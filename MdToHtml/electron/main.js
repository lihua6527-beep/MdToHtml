const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

// Determine mode
// In dev: process.env.NODE_ENV === 'development'
// In prod (packaged): app.isPackaged === true
// We can also force server mode for testing build locally
const forceServe = process.env.FORCE_SERVE === 'true';

let mainWindow;
let serverPromise;
let shouldLoadLocalServer;
let serverInstance;

async function createWindow() {
  // Now app is ready, we can check isPackaged
  shouldLoadLocalServer = app.isPackaged || forceServe;
  
  let url;
  
  if (shouldLoadLocalServer) {
    // Start server in parallel
      console.log('[Main] Starting server initialization...');
      serverPromise = (async () => {
        try {
          const { startServer } = require('./server');
          const { port, server } = await startServer();
          serverInstance = server;
          console.log('[Main] Server started on port:', port);
          return `http://localhost:${port}`;
        } catch (err) {
          console.error('[Main] Failed to start server:', err);
          return null;
        }
      })();
      
      // Wait for server to start
      url = await serverPromise;
  } else {
    // Development mode: connect to Next.js dev server
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
    if (shouldLoadLocalServer) {
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
  // Close server if it's running
  if (serverInstance) {
    console.log('[Main] Closing server...');
    serverInstance.close(() => {
      console.log('[Main] Server closed');
      if (process.platform !== 'darwin') app.quit();
    });
  } else {
    if (process.platform !== 'darwin') app.quit();
  }
});

// Handle app quit event
app.on('quit', function () {
  // Ensure server is closed
  if (serverInstance) {
    console.log('[Main] Closing server on quit...');
    serverInstance.close(() => {
      console.log('[Main] Server closed on quit');
    });
  }
});

// Optimize app startup
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('enable-features', 'UseOzonePlatform');
app.commandLine.appendSwitch('ozone-platform', 'auto');

// Reduce startup overhead
app.disableHardwareAcceleration();
