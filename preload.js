// preload.js

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  checkBrew: () => ipcRenderer.invoke('check-brew'),
  installBrew: () => ipcRenderer.send('install-brew'),
  onBrewInstallStatus: (callback) => ipcRenderer.on('brew-install-status', callback),
  getInstalledApps: () => ipcRenderer.invoke('get-installed-apps'),
  getOutdatedApps: () => ipcRenderer.invoke('get-outdated-apps'),
  installApp: (appData) => ipcRenderer.send('install-app', appData),
  uninstallApp: (appData) => ipcRenderer.send('uninstall-app', appData),
  updateApp: (appData) => ipcRenderer.send('update-app', appData),
  openApp: (appData) => ipcRenderer.send('open-app', appData),
  openAppHomepage: (appData) => ipcRenderer.send('open-app-homepage', appData),
  onManageAppStatus: (callback) => ipcRenderer.on('manage-app-status', callback),
  onManageAppProgress: (callback) => ipcRenderer.on('manage-app-progress', callback),
  // --- NEW: Expose the restart function ---
  restartApp: () => ipcRenderer.send('restart-app'),
});