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

    // Wait for Next.js to be ready by polling stdout
    // We can't use wait-on reliably in all envs, so poll via HTTP
    let started = false;
    const maxWait = 60; // seconds
    const pollInterval = 1000;

    console.log('[Smart Port] Waiting for server to be ready on ' + url + '...');

    for (let i = 0; i < maxWait; i++) {
        await new Promise(r => setTimeout(r, pollInterval));
        try {
            const http = require('http');
            await new Promise((resolve, reject) => {
                const req = http.get(url + '/api/files', (res) => {
                    if (res.statusCode === 200) {
                        resolve(true);
                    } else {
                        reject(new Error('Status ' + res.statusCode));
                    }
                });
                req.on('error', reject);
                req.setTimeout(2000, () => { req.destroy(); reject(new Error('timeout')); });
            });
            started = true;
            break;
        } catch (e) {
            // Server not ready yet, keep polling
        }
    }

    if (started) {
        console.log('[Smart Port] Server is ready!');
        openBrowser(url);
    } else {
        console.log('[Smart Port] Server did not respond within ' + maxWait + 's, opening browser anyway...');
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