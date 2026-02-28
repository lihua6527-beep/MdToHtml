const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Add any needed IPC methods here
  // Currently we use HTTP API, so this might be empty or just for system info
  getVersions: () => process.versions,
});
