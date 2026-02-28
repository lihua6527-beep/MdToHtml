const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

// Determine mode
// In dev: process.env.NODE_ENV === 'development'
// In prod (packaged): app.isPackaged === true
// We can also force server mode for testing build locally
const forceServe = process.env.FORCE_SERVE === 'true';
const shouldLoadLocalServer = app.isPackaged || forceServe;

let mainWindow;

async function createWindow() {
  let url;
  
  if (shouldLoadLocalServer) {
    try {
      console.log('[Main] Starting local server...');
      // Start the Express server
      const { startServer } = require('./server');
      const port = await startServer();
      console.log('[Main] Server started on port:', port);
      url = `http://localhost:${port}`;
    } catch (err) {
      console.error('[Main] Failed to start server:', err);
    }
  } else {
    // Development mode: connect to Next.js dev server
    // Note: You must run `next dev` separately or concurrently
    url = 'http://localhost:3000';
  }

  console.log('[Main] Creating window...');
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false, // Don't show until ready
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: 'MdToHtml Pro',
    icon: path.join(__dirname, '../public/favicon.ico') // Adjust if icon exists
  });

  // Show window when ready to avoid visual flashing
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (shouldLoadLocalServer) {
        // Open DevTools in packaged app for debugging per user request
        mainWindow.webContents.openDevTools();
    }
  });

  console.log('[Main] Loading URL:', url);
  if (url) {
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

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (mainWindow === null) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
