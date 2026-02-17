const net = require('net');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const START_PORT = 3000;
const END_PORT = 9000;
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
    for (let port = START_PORT; port <= END_PORT; port++) {
        if (await checkPort(port)) {
            return port;
        }
    }
    throw new Error('No available ports found');
}

async function updateEnvFile(port) {
    let content = '';
    if (fs.existsSync(ENV_FILE)) {
        content = fs.readFileSync(ENV_FILE, 'utf8');
    }

    const portRegex = /^PORT=.*$/m;
    const newPortEntry = `PORT=${port}`;

    if (portRegex.test(content)) {
        content = content.replace(portRegex, newPortEntry);
    } else {
        content = content ? `${content}\n${newPortEntry}` : newPortEntry;
    }

    fs.writeFileSync(ENV_FILE, content);
    console.log(`[Smart Port] Configuration updated: PORT=${port}`);
}

function startNextServer(port) {
    console.log(`[Smart Port] Starting Next.js server on port ${port}...`);
    
    // On Windows, using shell: true is often safer for npm
    const server = spawn('npm', ['run', 'dev'], {
        stdio: 'inherit',
        env: { ...process.env, PORT: port },
        cwd: path.join(__dirname, '..'),
        shell: true
    });

    // Open browser after a short delay
    setTimeout(() => {
        const url = `http://localhost:${port}`;
        console.log(`[Smart Port] Opening ${url} in default browser...`);
        const startCommand = process.platform === 'win32' ? 'start' : (process.platform === 'darwin' ? 'open' : 'xdg-open');
        require('child_process').exec(`${startCommand} ${url}`);
    }, 3000);

    server.on('error', (err) => {
        console.error('[Smart Port] Failed to start server:', err);
        process.exit(1);
    });

    server.on('close', (code) => {
        process.exit(code);
    });
}

findAvailablePort()
    .then(async (port) => {
        await updateEnvFile(port);
        startNextServer(port);
    })
    .catch((err) => {
        console.error('[Smart Port] Error:', err.message);
        process.exit(1);
    });
