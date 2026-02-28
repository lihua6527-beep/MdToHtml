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



    server.on('error', (err) => {
        console.error('[Smart Port] Failed to start server:', err);
        process.exit(1);
    });

    server.on('close', (code) => {
        process.exit(code);
    });
}

let browserOpened = false;

function openBrowser(url) {
    if (browserOpened) return;
    browserOpened = true;

    console.log(`[Smart Port] Server is ready at: ${url}`);
    console.log(`[Smart Port] Opening ${url} in default browser...`);
    
    const { exec } = require('child_process');
    let command;
    
    switch (process.platform) {
        case 'win32':
            command = `start "" "${url}"`;
            break;
        case 'darwin':
            command = `open "${url}"`;
            break;
        case 'linux':
            command = `xdg-open "${url}"`;
            break;
        default:
            command = `start "${url}"`;
    }

    if (command) {
        exec(command, (error) => {
            if (error) {
                console.error('[Smart Port] Failed to open browser:', error);
            }
        });
    }
}

findAvailablePort()
    .then(async (port) => {
        await updateEnvFile(port);
        
        // Start the server
        startNextServer(port);

        // Wait for the server to be ready
        const url = `http://localhost:${port}`;
        
        try {
            // Try to use wait-on if available
            const waitOn = require('wait-on');
            const opts = {
                resources: [`tcp:localhost:${port}`],
                delay: 1000,
                interval: 500,
                timeout: 30000,
            };
            
            console.log(`[Smart Port] Waiting for server to be ready on port ${port}...`);
            await waitOn(opts);
            
            // Add a small extra delay to ensure HTTP is ready
            setTimeout(() => openBrowser(url), 1000);
            
        } catch (err) {
            if (err.code === 'MODULE_NOT_FOUND') {
                console.log('[Smart Port] "wait-on" module not found, using fallback timer...');
            } else {
                console.warn('[Smart Port] wait-on check failed:', err.message);
            }
            // Fallback: wait 5 seconds then open
            setTimeout(() => openBrowser(url), 5000);
        }
    })
    .catch((err) => {
        console.error('[Smart Port] Error:', err.message);
        process.exit(1);
    });
