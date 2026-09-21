const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const net = require('net');

// Determine mode
// In dev: process.env.NODE_ENV === 'development'
// In prod (packaged): app.isPackaged === true
// We can also force server mode for testing build locally
const forceServe = process.env.FORCE_SERVE === 'true';

let mainWindow;
let serverProcess;

/**
 * Find a free port for the Next.js production server
 */
function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', reject);
  });
}

async function createWindow() {
  const isPackaged = app.isPackaged || forceServe;
  
  let url;
  
  if (isPackaged) {
    // === 打包模式：启动 Next.js 生产服务器 ===
    console.log('[Main] Starting Next.js production server...');
    
    try {
      const nextPort = await getFreePort();
      const nextServerPath = path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'bin', 'next');
      
      serverProcess = fork(nextServerPath, ['start', '-p', String(nextPort)], {
        cwd: path.join(__dirname, '..'),
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
        env: { ...process.env, NODE_ENV: 'production' }
      });
      
      // Wait for server to be ready
      url = await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.log('[Main] Server startup timeout, trying to connect anyway...');
          resolve(`http://localhost:${nextPort}`);
        }, 15000);
        
        serverProcess.stdout.on('data', (data) => {
          const msg = data.toString();
          console.log('[NextServer]', msg.trim());
          if (msg.includes('Ready') || msg.includes('started') || msg.includes('localhost')) {
            clearTimeout(timeout);
            resolve(`http://localhost:${nextPort}`);
          }
        });
        
        serverProcess.stderr.on('data', (data) => {
          console.error('[NextServer Error]', data.toString().trim());
        });
        
        serverProcess.on('error', (err) => {
          clearTimeout(timeout);
          console.error('[Main] Failed to start Next.js server:', err);
          resolve(null);
        });
        
        serverProcess.on('exit', (code) => {
          if (code !== 0 && code !== null) {
            console.error(`[Main] Next.js server exited with code ${code}`);
          }
        });
      });
    } catch (err) {
      console.error('[Main] Failed to start Next.js server:', err);
      url = null;
    }
  } else {
    // 开发模式：连接 Next.js 开发服务器
    url = 'http://localhost:3000';
  }

  console.log('[Main] Creating window...');
  // Create the browser window with optimized settings
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false, // Don't show until ready
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false, // Improve performance
      disableBlinkFeatures: 'Auxclick', // Reduce unnecessary features
    },
    title: 'MdToHtml Pro',
    icon: path.join(__dirname, '../public/favicon.ico'),
    // Optimize window creation
    frame: true,
    resizable: true,
    maximizable: true,
    minimizable: true,
    closable: true
  });

  // Show window when ready to avoid visual flashing
  mainWindow.once('ready-to-show', () => {
    console.log('[Main] Window ready to show');
    mainWindow.show();
    if (isPackaged) {
        // Open DevTools in packaged app for debugging per user request
        mainWindow.webContents.openDevTools();
    }
  });

  // Load URL efficiently
  if (url) {
    console.log('[Main] Loading URL:', url);
    mainWindow.loadURL(url).catch(e => console.error('[Main] Failed to load URL:', e));
  } else {
    console.error('[Main] URL is undefined!');
  }

  // Open links in external browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// Track startup time
const startTime = Date.now();

// Handle uncaught exceptions during startup
process.on('uncaughtException', (error) => {
  console.error('[Main] Uncaught exception during startup:', error);
  // Try to show an error dialog if possible
  if (mainWindow) {
    mainWindow.webContents.send('startup-error', { message: error.message });
  }
});

// Handle unhandled promise rejections during startup
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Main] Unhandled promise rejection during startup:', reason);
  // Try to show an error dialog if possible
  if (mainWindow) {
    mainWindow.webContents.send('startup-error', { message: reason instanceof Error ? reason.message : String(reason) });
  }
});

app.whenReady().then(() => {
  console.log(`[Main] App ready, startup time: ${Date.now() - startTime}ms`);
  createWindow();

  app.on('activate', function () {
    if (mainWindow === null) createWindow();
  });
});

app.on('window-all-closed', function () {
  // Close Next.js server if it's running
  if (serverProcess) {
    console.log('[Main] Killing Next.js server...');
    serverProcess.kill('SIGTERM');
  }
  if (process.platform !== 'darwin') app.quit();
});

// Handle app quit event
app.on('quit', function () {
  // Ensure Next.js server is killed
  if (serverProcess && !serverProcess.killed) {
    console.log('[Main] Killing Next.js server on quit...');
    serverProcess.kill('SIGTERM');
  }
});

// Optimize app startup
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('enable-features', 'UseOzonePlatform');
app.commandLine.appendSwitch('ozone-platform', 'auto');

// Reduce startup overhead
app.disableHardwareAcceleration();
