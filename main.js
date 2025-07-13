// main.js

// --- Electron Modules ---
const { app, BrowserWindow, ipcMain, shell, Notification, globalShortcut, screen } = require('electron');
// --- Node.js Modules ---
const path = require('node:path');
const fs = require('node:fs');
const https = require('node:httpss');
const { exec, spawn } = require('child_process');

// --- Globals ---
// Define potential paths for the Homebrew executable.
const BREW_PATHS = ["/opt/homebrew/bin/brew", "/usr/local/bin/brew"];
// Find the valid Homebrew path on this system.
let BREW_PATH = BREW_PATHS.find(p => fs.existsSync(p));

// Task queue system to prevent multiple Homebrew commands from running simultaneously.
const taskQueue = [];
let isTaskRunning = false;
let mainWindow;

/**
 * Creates and configures the main application window.
 */
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 750,
        height: 70,       // Start with a small height for just the search bar.
        frame: false,     // Create a frameless window.
        show: false,      // Start hidden to prevent a visual flash on launch.
        resizable: false,
        movable: true,
        skipTaskbar: true,  // Keep the app out of the Dock on macOS.
        vibrancy: 'sidebar', // Use native macOS vibrancy for a translucent, blurred effect.
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            devTools: false // Disable DevTools in this style of app.
        }
    });

    mainWindow.loadFile('index.html');
    
    // Hide the window when it loses focus (e.g., user clicks away).
    mainWindow.on('blur', () => {
        if (mainWindow.isVisible()) {
            mainWindow.hide();
        }
    });
}

/**
 * Positions, shows, and focuses the main window.
 */
const showWindow = () => {
    if (mainWindow) {
        if (!mainWindow.isVisible()) {
             // Position the window 20% from the top of the screen, horizontally centered.
             const [width] = mainWindow.getSize();
             const currentScreen = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
             const x = Math.round((currentScreen.workArea.width - width) / 2) + currentScreen.workArea.x;
             const y = Math.round(currentScreen.workArea.height * 0.2) + currentScreen.workArea.y;
             mainWindow.setPosition(x, y);
        }
        mainWindow.show();
        mainWindow.focus();
        // Tell the renderer process to focus the search input field.
        mainWindow.webContents.send('focus-input');
    }
}

// --- App Lifecycle Events ---

app.whenReady().then(() => {
    createWindow();

    // Wait for the window's content to be fully loaded before showing it.
    mainWindow.once('ready-to-show', () => {
        showWindow();
    });

    // Handle clicking the Dock icon on macOS.
    app.on('activate', () => {
        if (mainWindow) {
            showWindow();
        }
    });

    // Register a global keyboard shortcut to toggle the window's visibility.
    globalShortcut.register('CommandOrControl+Space', () => {
        if (mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            showWindow();
        }
    });
});

// Unregister all shortcuts when the app is about to quit.
app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// --- IPC Handlers ---

// Handles requests from the renderer to resize the window.
ipcMain.on('resize-window', (event, newHeight) => {
    if (mainWindow) {
        const [width] = mainWindow.getSize();
        // Only change the height, keeping the X/Y position stable.
        mainWindow.setSize(width, newHeight, true);
    }
});

// Handles requests from the renderer to restart the app (e.g., after installing Homebrew).
ipcMain.on('restart-app', () => {
    app.relaunch();
    app.quit();
});

// Checks if Homebrew is installed on the system.
ipcMain.handle('check-brew', async () => {
  BREW_PATH = BREW_PATHS.find(p => fs.existsSync(p));
  return !!BREW_PATH;
});

// Opens a new Terminal window to run the Homebrew installation script.
ipcMain.on('install-brew', (event) => {
    const brewInstallCommand = 'curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh | bash';
    const appleScript = `tell application "Terminal"
    activate
    do script "${brewInstallCommand}"
end tell`;
    exec(`osascript -e '${appleScript}'`, (error) => {
        if (error) {
            console.error("Failed to open Terminal to install Homebrew:", error);
            event.sender.send('brew-install-status', { status: 'error', message: error.message });
            return;
        }
        event.sender.send('brew-install-status', { status: 'started' });
    });
});

/**
 * Fetches detailed information for a given cask, including a high-quality icon.
 * @param {string} caskName - The name of the cask to get info for.
 * @returns {Promise<object|null>} A promise that resolves with the app's data object or null.
 */
const getCaskInfo = (caskName) => {
    return new Promise((resolve) => {
        if (!BREW_PATH) return resolve(null);
        
        // 1. Get base app info from Homebrew.
        exec(`${BREW_PATH} info --json=v2 --casks ${caskName}`, (err, stdout) => {
            if (err) return resolve(null);
            try {
                const info = JSON.parse(stdout);
                const cask = info.casks[0];
                if (!cask) return resolve(null);

                const appData = {
                    name: cask.name?.[0] || cask.token,
                    description: cask.desc,
                    homepage: cask.homepage,
                    caskName: cask.token,
                    appName: cask.artifacts.find(a => a.app)?.['0'] || `${cask.name?.[0]}.app`,
                    developer: cask.vendor,
                    iconUrl: null
                };

                if (!appData.homepage) {
                    return resolve(appData);
                }

                try {
                    const hostname = new URL(appData.homepage).hostname;
                    const clearbitUrl = `https://logo.clearbit.com/${hostname}`;

                    // 2. Try to get a high-quality logo from the Clearbit API.
                    const request = https.request(clearbitUrl, { method: 'HEAD' }, (res) => {
                        if (res.statusCode === 200) {
                            appData.iconUrl = clearbitUrl;
                            resolve(appData);
                        } else {
                            // 3. Fallback to Google's favicon service if Clearbit fails.
                            appData.iconUrl = `https://www.google.com/s2/favicons?sz=64&domain_url=${hostname}`;
                            resolve(appData);
                        }
                    });
                    
                    request.on('error', () => {
                        appData.iconUrl = `https://www.google.com/s2/favicons?sz=64&domain_url=${hostname}`;
                        resolve(appData);
                    });
                    
                    request.end();

                } catch (urlError) {
                    resolve(appData);
                }
            } catch (e) {
                resolve(null);
            }
        });
    });
};

// Searches for casks via Homebrew and fetches their details.
ipcMain.handle('search-casks', async (event, query) => {
    if (!BREW_PATH || !query) return [];
    
    return new Promise((resolve, reject) => {
        exec(`${BREW_PATH} search --casks ${query}`, async (error, stdout) => {
            if (error) return reject(error);
            const caskNames = stdout.split('\n').filter(Boolean);
            if (caskNames.length === 0) return resolve([]);
            
            // Limit results for performance.
            const detailPromises = caskNames.slice(0, 8).map(caskName => getCaskInfo(caskName));
            const results = await Promise.all(detailPromises);
            resolve(results.filter(Boolean));
        });
    });
});

// Gets details for a specific list of already known cask names (for Installed/Updates pages).
ipcMain.handle('get-cask-details', async (event, caskNames) => {
    if (!BREW_PATH || !caskNames || caskNames.length === 0) return [];
    const detailPromises = caskNames.map(caskName => getCaskInfo(caskName));
    const results = await Promise.all(detailPromises);
    return results.filter(Boolean);
});


// Gets the list of all installed casks.
ipcMain.handle('get-installed-apps', async () => {
  if (!BREW_PATH) return [];
  return new Promise((resolve) => {
    exec(`${BREW_PATH} list --cask`, (error, stdout) => {
      if (error) resolve([]);
      else resolve(stdout.split('\n').filter(Boolean));
    });
  });
});
// Gets the list of all outdated casks.
ipcMain.handle('get-outdated-apps', async () => {
    if (!BREW_PATH) return { casks: [] };
    return new Promise((resolve) => {
        exec(`${BREW_PATH} outdated --cask --json`, (error, stdout) => {
            if (error) resolve({ casks: [] });
            else {
                try { resolve(JSON.parse(stdout)); }
                catch (e) { resolve({ casks: [] }); }
            }
        });
    });
});
// Opens an app's homepage in the default browser.
ipcMain.on('open-app-homepage', (event, { homepage }) => {
    if (homepage) {
        shell.openExternal(homepage);
    }
});
// Opens an installed application.
ipcMain.on('open-app', (event, { appName, caskName }) => {
    const command = `open -a "${appName}"`;
    exec(command, (error) => {
        if (error) {
            console.error(`Failed to open app: ${appName}`, error);
            event.sender.send('manage-app-status', { caskName, status: 'error', message: `Could not open ${appName}.` });
        } else {
            event.sender.send('manage-app-status', { caskName, status: 'opened' });
        }
    });
});

/**
 * Runs a Homebrew command (install, uninstall, update) and handles its lifecycle.
 * @param {IpcMainEvent} event - The IPC event object.
 * @param {object} options - Contains caskName, appName, and action.
 */
function manageApp(event, { caskName, appName, action }) {
    const webContents = event.sender;
    if (!BREW_PATH) {
        webContents.send('manage-app-status', { caskName, status: 'error', message: 'Homebrew not found.' });
        return;
    }

    const args = { install: ['install', '--cask', caskName], uninstall: ['uninstall', '--cask', '--force', caskName], update: ['upgrade', '--cask', caskName] };
    const statusMap = { install: { start: 'installing', end: 'installed' }, uninstall: { start: 'uninstalling', end: 'uninstalled' }, update: { start: 'updating', end: 'updated' }};

    webContents.send('manage-app-status', { caskName, status: statusMap[action].start });

    let needsSudoTerminal = false;
    const brewProcess = spawn(BREW_PATH, args[action], { env: { ...process.env, HOMEBREW_NO_AUTO_UPDATE: '1' } });

    brewProcess.stderr.on('data', (data) => {
        const output = data.toString();
        // Detect if the command is asking for a password.
        if (output.includes('sudo: a password is required')) { needsSudoTerminal = true; }
        // Parse download progress for the progress bar.
        const progressRegex = /#+ *(\d{1,3}(?:\.\d+)?)/;
        const match = output.match(progressRegex);
        if (match && match[1]) {
            webContents.send('manage-app-progress', { caskName, percent: Math.floor(parseFloat(match[1])), text: 'Downloading...' });
        }
    });

    brewProcess.on('close', (code) => {
        // If the command failed and we detected it needs sudo, open it in a new Terminal window.
        if (code !== 0 && needsSudoTerminal) {
            const fullCommand = `${BREW_PATH} ${args[action].join(' ')}`;
            const escapedCommand = fullCommand.replace(/"/g, '\\"');
            const appleScript = `tell application "Terminal" to do script "${escapedCommand}; exit"`;
            exec(`osascript -e '${appleScript}'`, () => {});
        }
        
        if (code === 0) {
            const postAction = () => new Notification({ title: 'Task Complete', body: `${appName} was successfully ${statusMap[action].end}.` }).show();
            // Fix permissions after installing an app.
            if (action === 'install') exec(`xattr -cr "/Applications/${appName}"`, postAction);
            else postAction();
        } else if (!needsSudoTerminal) {
            new Notification({ title: 'Task Failed', body: `The ${action} task for ${caskName} failed.` }).show();
        }

        // Notify the renderer that the task is finished.
        webContents.send('manage-app-status', { caskName, status: statusMap[action].end });
        isTaskRunning = false;
        processTaskQueue(); // Check for the next task.
    });
}

/**
 * Processes the next task in the queue if no other task is running.
 */
function processTaskQueue() {
    if (isTaskRunning || taskQueue.length === 0) return;
    isTaskRunning = true;
    const task = taskQueue.shift();
    manageApp(task.event, { ...task.appData, action: task.action });
}

// IPC handlers for app actions just add the task to the queue.
ipcMain.on('install-app', (event, appData) => {
    taskQueue.push({ event, appData, action: 'install' });
    processTaskQueue();
});
ipcMain.on('uninstall-app', (event, appData) => {
    taskQueue.push({ event, appData, action: 'uninstall' });
    processTaskQueue();
});
ipcMain.on('update-app', (event, appData) => {
    taskQueue.push({ event, appData, action: 'update' });
    processTaskQueue();
});