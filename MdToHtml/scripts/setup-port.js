const net = require('net');
const fs = require('fs');
const path = require('path');
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

/**
 * HTTP GET 请求，返回状态码
 */
function httpGet(url, timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
        const http = require('http');
        const req = http.get(url, (res) => {
            // 读取所有数据以释放连接
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => resolve(res.statusCode));
        });
        req.on('error', reject);
        req.setTimeout(timeoutMs, () => { req.destroy(); reject(new Error('timeout')); });
    });
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

    console.log('[Smart Port] Starting Next.js dev server on port ' + port + '...');

    const server = spawn('npm', ['run', 'dev'], {
        stdio: 'inherit',
        env: Object.assign({}, process.env, { PORT: String(port), BROWSER: 'none' }),
        cwd: path.join(__dirname, '..'),
        shell: true
    });

    const url = 'http://localhost:' + port;

    // 第一步：等待服务器就绪（检测 api/files 路由）
    let serverReady = false;
    const maxWait = 60; // seconds

    console.log('[Smart Port] Waiting for server to be ready on ' + url + '...');

    for (let i = 0; i < maxWait; i++) {
        await new Promise(r => setTimeout(r, 1000));
        try {
            const status = await httpGet(url + '/api/files', 2000);
            if (status === 200) {
                serverReady = true;
                break;
            }
        } catch (e) {
            // Server not ready yet, keep polling
        }
    }

    if (!serverReady) {
        console.log('[Smart Port] Server did not respond within ' + maxWait + 's, opening browser anyway...');
        openBrowser(url);
    } else {
        console.log('[Smart Port] Server is ready!');

        // 第二步：预热主页（重要！next dev 是惰性编译的，首次请求 / 需要 1s 编译）
        // 先请求主页并等待返回，这样后续浏览器打开时主页已被编译好
        console.log('[Smart Port] Pre-warming homepage to trigger compilation...');
        const startTime = Date.now();
        try {
            const status = await httpGet(url, 30000); // 主页可能首次编译需要更长时间
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log('[Smart Port] Homepage compiled in ' + elapsed + 's (status: ' + status + ')');
        } catch (e) {
            console.log('[Smart Port] Homepage pre-warm warning: ' + e.message + ' (opening browser anyway)');
        }

        // 第三步：打开浏览器
        // 此时主页已被编译，浏览器一打开就能立刻流式输出 HTML
        console.log('[Smart Port] Opening browser...');
        openBrowser(url);
    }

    // Block until Next.js child process exits (keeps the CMD window alive)
    server.on('close', (code) => {
        console.log('[Smart Port] Next.js exited with code ' + code);
        process.exit(code || 0);
    });

    server.on('error', (err) => {
        console.error('[Smart Port] Failed to start Next.js:', err.message);
        process.exit(1);
    });
})();