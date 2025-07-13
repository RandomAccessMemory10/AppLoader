// preload.js

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  checkBrew: () => ipcRenderer.invoke('check-brew'),
  installBrew: () => ipcRenderer.send('install-brew'),
  restartApp: () => ipcRenderer.send('restart-app'),

  getInstalledApps: () => ipcRenderer.invoke('get-installed-apps'),
  getOutdatedApps: () => ipcRenderer.invoke('get-outdated-apps'),
  searchCasks: (query) => ipcRenderer.invoke('search-casks', query),
  getCaskDetails: (caskNames) => ipcRenderer.invoke('get-cask-details', caskNames),
  
  installApp: (appData) => ipcRenderer.send('install-app', appData),
  uninstallApp: (appData) => ipcRenderer.send('uninstall-app', appData),
  updateApp: (appData) => ipcRenderer.send('update-app', appData),
  openApp: (appData) => ipcRenderer.send('open-app', appData),
  openAppHomepage: (appData) => ipcRenderer.send('open-app-homepage', appData),
  
  onManageAppStatus: (callback) => ipcRenderer.on('manage-app-status', callback),
  onManageAppProgress: (callback) => ipcRenderer.on('manage-app-progress', callback),
  onFocusInput: (callback) => ipcRenderer.on('focus-input', callback),
  
  resizeWindow: (height) => ipcRenderer.send('resize-window', height),
  
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});