const net = require('net');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const START_PORT = 3000;
const END_PORT = 3100;
const ENV_FILE = path.join(__dirname, '../.env.local');

function checkPort(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.listen(port, () => {
            server.close(() => resolve(true));
        });
        server.on('error', () => resolve(false));
    });
}

async function findAvailablePort() {
    const ports = [];
    for (let p = START_PORT; p <= END_PORT; p++) ports.push(p);
    const results = await Promise.all(ports.map(p => checkPort(p)));
    for (let i = 0; i < results.length; i++) {
        if (results[i]) return ports[i];
    }
    throw new Error('No available ports found in range ' + START_PORT + '-' + END_PORT);
}

async function updateEnvFile(port) {
    let content = '';
    if (fs.existsSync(ENV_FILE)) {
        content = fs.readFileSync(ENV_FILE, 'utf8');
    }
    const newLine = `PORT=${port}`;
    if (/^PORT=.*$/m.test(content)) {
        content = content.replace(/^PORT=.*$/m, newLine);
    } else {
        content = content ? content + '\n' + newLine : newLine;
    }
    fs.writeFileSync(ENV_FILE, content);
    console.log('[Smart Port] PORT=' + port + ' written to .env.local');
}

function openBrowser(url) {
    const { exec } = require('child_process');
    const cmd = process.platform === 'win32'
        ? 'start "" "' + url + '"'
        : process.platform === 'darwin'
            ? 'open "' + url + '"'
            : 'xdg-open "' + url + '"';
    exec(cmd, (err) => {
        if (err) console.error('[Smart Port] Failed to open browser:', err.message);
    });
}

/** 返回 loading.html 的完整 HTML 字符串 */
function getLoadingPageHtml(targetPort) {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CHD Document Renderer - 加载中</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{
    background:linear-gradient(135deg,#f0f5ff 0%,#e8f0fe 50%,#f5f3ff 100%);
    min-height:100vh;display:flex;align-items:center;justify-content:center;
    font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,sans-serif;
    -webkit-font-smoothing:antialiased
  }
  .card{
    background:rgba(255,255,255,0.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
    border:1px solid rgba(255,255,255,0.6);border-radius:24px;
    padding:48px 56px;text-align:center;
    box-shadow:0 8px 32px rgba(79,110,247,0.08),0 2px 8px rgba(0,0,0,0.04);
    max-width:380px;width:90%
  }
  .logo-wrapper{
    width:72px;height:72px;
    background:linear-gradient(135deg,#4f6ef7,#7c5cfc);
    border-radius:20px;display:flex;align-items:center;justify-content:center;
    margin:0 auto 20px;box-shadow:0 4px 16px rgba(79,110,247,0.3)
  }
  .logo-wrapper span{font-size:28px;font-weight:700;color:#fff;letter-spacing:-0.5px}
  h1{font-size:20px;font-weight:700;color:#1f2937;margin-bottom:4px}
  .subtitle{font-size:13px;color:#9ca3af;margin-bottom:28px}
  .spinner{margin:0 auto 24px;width:40px;height:40px}
  .spinner svg{width:40px;height:40px}
  .progress-track{width:100%;height:3px;background:#e0e7ff;border-radius:2px;overflow:hidden;margin-bottom:16px}
  .progress-fill{height:100%;width:0%;background:linear-gradient(90deg,#4f6ef7,#7c5cfc);border-radius:2px;transition:width 0.2s ease}
  .status{font-size:13px;color:#6b7280}
  .status-dot{display:inline-block;width:6px;height:6px;background:#4f6ef7;border-radius:50%;margin-right:8px;vertical-align:middle;animation:pulse-dot 1.2s ease-in-out infinite}
  @keyframes pulse-dot{0%,100%{opacity:0.4;transform:scale(0.8)}50%{opacity:1;transform:scale(1.2)}}
</style>
</head>
<body>
<div class="card">
  <div class="logo-wrapper"><span>C</span></div>
  <h1>CHD Document Renderer</h1>
  <p class="subtitle">智能文档渲染引擎</p>
  <div class="spinner">
    <svg width="40" height="40" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="20" stroke="#d0d7ff" stroke-width="4" fill="none"/>
      <circle cx="24" cy="24" r="20" stroke="#4f6ef7" stroke-width="4" fill="none"
        stroke-dasharray="125" stroke-dashoffset="0" stroke-linecap="round">
        <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="0.8s" repeatCount="indefinite"/>
      </circle>
    </svg>
  </div>
  <div class="progress-track"><div class="progress-fill" id="progress-fill"></div></div>
  <div class="status" id="status-text"><span class="status-dot"></span>正在准备文档服务...</div>
</div>
<script>
(function(){
  var statusEl = document.getElementById('status-text');
  var progressEl = document.getElementById('progress-fill');

  // 文案轮播 + 进度条安慰剂（到 80% 停止，留 20% 给就绪瞬间）
  var msgs = ['正在准备文档服务...','正在扫描可用端口...','正在加载文档目录',
    '正在加载整体布局','正在加载网页格式','加载编辑器组件...'];
  var idx = 0;
  var timer = setInterval(function(){
    idx = (idx + 1) % msgs.length;
    if (statusEl) statusEl.innerHTML = '<span class="status-dot"></span>' + msgs[idx];
    var cur = parseFloat(progressEl.style.width || '0');
    if (cur < 80) progressEl.style.width = Math.min(cur + (Math.random() * 5 + 1), 80) + '%';
  }, 1500);

  // ★ 轮询同源的 /status 端点（http://localhost:PORT+1/status）
  // 由 setup-port.js 通过 stdout 监听 ✓ Compiled 来控制状态
  // 这是最精确的方案：同源请求，无跨域，零开销
  function onReady() {
    clearInterval(timer);
    progressEl.style.width = '100%';
    window.location.href = 'http://localhost:${targetPort}/';
  }

  var retries = 0;
  function poll() {
    if (retries > 120) { onReady(); return; }
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/status', true);
    xhr.timeout = 500;
    xhr.onload = function() {
      if (xhr.responseText === 'ready') { onReady(); return; }
      retries++; setTimeout(poll, 200);
    };
    xhr.onerror = function() { retries++; setTimeout(poll, 200); };
    xhr.ontimeout = function() { retries++; setTimeout(poll, 200); };
    xhr.send();
  }

  if (document.readyState === 'complete') poll();
  else window.addEventListener('load', poll);
})();
</script>
</body>
</html>`;
}

// ----- Main -----
(async () => {
    let port;
    try {
        port = await findAvailablePort();
        console.log('[Smart Port] Available port found: ' + port);
    } catch (e) {
        console.error('[Smart Port] ' + e.message);
        process.exit(1);
    }

    await updateEnvFile(port);

    // ===== 在 port+1 启动加载服务器 =====
    // 提供两个端点：
    //   GET /         → 返回 loading.html
    //   GET /status   → 返回 'ready' 或 ''（由 stdout 监听控制）
    const loadingPort = port + 1;
    let statusReady = false;  // ← 由 stdout 监听设为 true

    const loadingServer = http.createServer((req, res) => {
        if (req.url === '/status') {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(statusReady ? 'ready' : '');
            return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(getLoadingPageHtml(port));
    });

    loadingServer.listen(loadingPort, () => {
        console.log('[Smart Port] Loading server on http://localhost:' + loadingPort);
        openBrowser('http://localhost:' + loadingPort + '/');
    });

    // ===== 启动 Next.js =====
    console.log('[Smart Port] Starting Next.js dev server on port ' + port + '...');

    const server = spawn('npm', ['run', 'dev'], {
        stdio: ['inherit', 'pipe', 'inherit'],
        env: Object.assign({}, process.env, { PORT: String(port), BROWSER: 'none' }),
        cwd: path.join(__dirname, '..'),
        shell: true
    });

    // ===== stdout 监听 → 控制 statusReady + 后台预热 =====
    if (server.stdout) {
        server.stdout.on('data', (data) => {
            process.stdout.write(data);
            const text = data.toString();

            // ✓ Compiled / in → 主页编译完成 → 通知加载页跳转
            if (text.includes('✓ Compiled / in')) {
                console.log('[Smart Port] Homepage compiled, signaling loading page...');
                statusReady = true;  // 加载页下一次轮询 /status 就收到 'ready'
            }

            // ✓ Ready in → 触发预热（让编译更快开始）
            if (text.includes('✓ Ready in') || text.includes('- Local:')) {
                http.get('http://localhost:' + port + '/', (res) => {
                    res.resume();
                }).on('error', () => {});
            }
        });
        server.stdout.on('error', () => {});
    }

    // ===== 清理：加载服务器随主进程退出 =====
    server.on('close', (code) => {
        loadingServer.close();
        console.log('[Smart Port] Next.js exited with code ' + code);
        process.exit(code || 0);
    });

    server.on('error', (err) => {
        console.error('[Smart Port] Failed to start Next.js:', err.message);
        process.exit(1);
    });
})();