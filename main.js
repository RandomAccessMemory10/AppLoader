/**
 * @file main.js
 * This is the main process for the Electron application. It handles window creation,
 * background tasks, and all interactions with the operating system, including
 * running Homebrew commands. It communicates with the renderer process (the UI)
 * via IPC (Inter-Process Communication).
 */

// --- Core Electron Modules ---
const { app, BrowserWindow, ipcMain, shell, Notification } = require('electron');

// --- Node.js Modules ---
const path = require('node:path'); // For handling and transforming file paths.
const fs = require('node:fs');     // For interacting with the file system (e.g., checking if Homebrew exists).
const { exec, spawn } = require('child_process'); // For executing external commands (like Homebrew).

// --- Homebrew Configuration ---
// Homebrew can be installed in different locations depending on the Mac's architecture (Intel vs. Apple Silicon).
// This array lists the most common paths for the Homebrew executable.
const BREW_PATHS = [
  "/opt/homebrew/bin/brew", // Standard path on Apple Silicon Macs
  "/usr/local/bin/brew"     // Standard path on Intel Macs
];
// Find the correct Homebrew path on the current system. If it's not found, BREW_PATH will be undefined.
let BREW_PATH = BREW_PATHS.find(p => fs.existsSync(p));

// --- Task Queue System ---
// To prevent multiple `brew` commands from running simultaneously (which can cause corruption or errors),
// we use a simple queue. New tasks are added to the queue, and only one is processed at a time.
const taskQueue = [];
let isTaskRunning = false; // A flag to track if a task is currently in progress.

/**
 * Creates and configures the main application window.
 */
function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: 'hidden', // Hides the default OS title bar for a custom, seamless look.
    trafficLightPosition: { x: 15, y: 15 }, // Positions the close/minimize/maximize buttons.
    backgroundColor: '#111827', // Sets a dark background color to prevent a white flash on load.
    webPreferences: {
      // The preload script is a bridge between the Node.js environment of the main process
      // and the browser environment of the renderer process. It exposes specific APIs
      // from the main process to the UI in a secure way.
      preload: path.join(__dirname, 'preload.js')
    }
  });
  mainWindow.loadFile('index.html');
  // For debugging, you can uncomment the line below to open the developer tools on launch.
  // mainWindow.webContents.openDevTools();
}

// --- Electron App Lifecycle Events ---

// This method is called when Electron has finished initialization and is ready to create browser windows.
app.whenReady().then(() => {
  createWindow();
  // On macOS, it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS where it's common
// for applications to stay active until the user quits explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// --- IPC Handlers: Communication with Renderer Process ---

// Listen for a 'restart-app' event from the renderer to relaunch the application.
ipcMain.on('restart-app', () => {
    app.relaunch();
    app.quit();
});

// Handle the 'check-brew' event. This is an async handler that returns a promise.
// It checks if the Homebrew executable exists and returns true or false.
ipcMain.handle('check-brew', async () => {
  BREW_PATH = BREW_PATHS.find(p => fs.existsSync(p));
  return !!BREW_PATH;
});

// Listen for the 'install-brew' event. This triggers the Homebrew installation process.
ipcMain.on('install-brew', (event) => {
    // This is the official, non-interactive command to install Homebrew.
    const brewInstallCommand = '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"';
    // The command needs to be properly escaped to be passed into an AppleScript string.
    const escapedCommand = brewInstallCommand.replace(/"/g, '\\"');
    // We use AppleScript to open a new Terminal window and run the command.
    // This provides the user with a familiar interface for the installation process.
    const appleScript = `
        tell application "Terminal"
            activate
            do script "${escapedCommand}"
        end tell
    `;
    // The `osascript` command executes AppleScript from the command line.
    exec(`osascript -e '${appleScript}'`, (error) => {
        if (error) {
            console.error("Failed to open Terminal to install Homebrew:", error);
            event.sender.send('brew-install-status', { status: 'error', message: error.message });
            return;
        }
        // Inform the renderer that the installation has been initiated.
        event.sender.send('brew-install-status', { status: 'started' });
    });
});

// Handle the 'get-installed-apps' event. It runs `brew list` and returns an array of installed cask names.
ipcMain.handle('get-installed-apps', async () => {
  if (!BREW_PATH) return [];
  return new Promise((resolve) => {
    exec(`${BREW_PATH} list --cask --full-name`, (error, stdout) => {
      if (error) resolve([]);
      else resolve(stdout.split('\n').filter(Boolean));
    });
  });
});

// Handle the 'get-outdated-apps' event. It runs `brew outdated` and returns the JSON output.
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

// Listen for 'open-app-homepage'. It gets the app's metadata from Homebrew and opens its homepage URL in the default browser.
ipcMain.on('open-app-homepage', (event, { caskName }) => {
    if (!BREW_PATH) return;
    exec(`${BREW_PATH} info --json=v2 --cask ${caskName}`, (error, stdout) => {
        if (error) {
            console.error(`Failed to get info for ${caskName}:`, error);
            return;
        }
        try {
            const info = JSON.parse(stdout);
            const homepage = info.casks[0]?.homepage;
            if (homepage) {
                shell.openExternal(homepage); // Safely opens a URL in the user's default browser.
            } else {
                console.error(`No homepage found for ${caskName}`);
            }
        } catch (e) {
            console.error(`Failed to parse info for ${caskName}:`, e);
        }
    });
});

// Listen for 'open-app'. It uses the macOS `open` command to launch the application.
ipcMain.on('open-app', (event, { appName }) => {
    const command = `open -a "${appName}"`;
    exec(command, (error) => {
        if (error) {
            console.error(`Failed to open app: ${appName}`, error);
            event.sender.send('manage-app-status', { caskName: null, status: 'error', message: `Could not open ${appName}.` });
        }
    });
});

/**
 * The core function for managing an app (install, uninstall, update).
 * It uses `spawn` instead of `exec` to get real-time output from the command's streams.
 * @param {IpcMainEvent} event - The IPC event object.
 * @param {object} options - The options for the app management task.
 * @param {string} options.caskName - The Homebrew cask name of the app.
 * @param {string} options.appName - The display name of the app.
 * @param {string} options.action - The action to perform ('install', 'uninstall', 'update').
 */
function manageApp(event, { caskName, appName, action }) {
    const webContents = event.sender;
    if (!BREW_PATH) {
        webContents.send('manage-app-status', { caskName, status: 'error', message: 'Homebrew not found.' });
        return;
    }

    const args = {
        install: ['install', '--cask', caskName],
        uninstall: ['uninstall', '--cask', '--force', caskName],
        update: ['upgrade', '--cask', caskName],
    }[action];

    const statusMap = {
        install: { start: 'installing', end: 'installed' },
        uninstall: { start: 'uninstalling', end: 'uninstalled' },
        update: { start: 'updating', end: 'updated' },
    };

    // Immediately notify the renderer that the process has started.
    webContents.send('manage-app-status', { caskName, status: statusMap[action].start });

    let needsSudoTerminal = false;
    // Spawn the Homebrew process. We disable auto-updates for faster, more predictable execution.
    const brewProcess = spawn(BREW_PATH, args, { env: { ...process.env, HOMEBREW_NO_AUTO_UPDATE: '1' } });

    // Listen to the standard error stream. Homebrew often outputs progress and prompts here.
    brewProcess.stderr.on('data', (data) => {
        const output = data.toString();
        console.log("Brew Stderr:", output);

        // Check if the process is asking for a sudo password.
        if (output.includes('sudo: a password is required') || output.includes('sudo: a terminal is required')) {
            needsSudoTerminal = true;
        }

        // Parse the download progress from the output.
        const progressRegex = /#+ *(\d{1,3}(?:\.\d+)?)/;
        const match = output.match(progressRegex);
        if (match && match[1]) {
            // Send progress updates to the renderer.
            webContents.send('manage-app-progress', { caskName, percent: Math.floor(parseFloat(match[1])), text: 'Downloading...' });
        }
    });

    // Listen for the process to close.
    brewProcess.on('close', (code) => {
        // If the process failed and we detected a sudo prompt, we need to re-run it in a terminal.
        if (code !== 0 && needsSudoTerminal) {
            console.log(`Command for ${caskName} requires admin privileges. Opening in Terminal...`);
            const fullCommand = `${BREW_PATH} ${args.join(' ')}`;
            const escapedCommand = fullCommand.replace(/"/g, '\\"');
            // This AppleScript command will run the original command with `sudo` in a new Terminal window.
            const appleScript = `tell application "Terminal"
    activate
    do script "sudo ${escapedCommand}; exit"
end tell`;

            webContents.send('manage-app-progress', { caskName, percent: 50, text: 'Check Terminal for password...' });
            
            exec(`osascript -e '${appleScript}'`, (error) => {
                 if (error) {
                    new Notification({ title: 'Task Failed', body: `Could not open Terminal to finish the task for ${appName}.` }).show();
                    webContents.send('manage-app-status', { caskName, status: 'error', message: 'Failed to open terminal.' });
                } else {
                    // Show a system notification to the user.
                    new Notification({ title: 'Action Required', body: `Please enter your password for ${appName} in the new Terminal window.` }).show();
                    // Assume success after a short delay, as we can't get the result from the new terminal.
                    setTimeout(() => {
                        webContents.send('manage-app-status', { caskName, status: statusMap[action].end });
                    }, 5000);
                 }
                // The task is finished, so we can process the next one in the queue.
                isTaskRunning = false;
                processTaskQueue();
            });
            return; // Exit here, as the rest of the logic is handled by the new terminal process.
        }
        
        // Reset the progress bar in the renderer.
        webContents.send('manage-app-progress', { caskName, percent: 0, text: '' });
        
        if (code !== 0) { // The process failed for a reason other than sudo.
            webContents.send('manage-app-status', { caskName, status: 'error', message: `Process exited with code ${code}` });
            new Notification({ title: 'Task Failed', body: `The ${action} task for ${caskName} failed.` }).show();
        } else { // The process succeeded.
            const postAction = () => {
                webContents.send('manage-app-status', { caskName, status: statusMap[action].end });
                new Notification({ title: 'Task Complete', body: `${appName} was successfully ${statusMap[action].end}.` }).show();
            };
            // On macOS, apps downloaded from the internet are often quarantined. This command removes the quarantine attribute,
            // preventing the "This app was downloaded from the internet" dialog from appearing on first launch.
            if (action === 'install') exec(`xattr -cr "/Applications/${appName}"`, postAction);
            else postAction();
        }
        // The task is finished, so we can process the next one in the queue.
        isTaskRunning = false;
        processTaskQueue();
    });
}

/**
 * Processes the next task in the queue if no other task is running.
 */
function processTaskQueue() {
    if (isTaskRunning || taskQueue.length === 0) {
        return;
    }
    isTaskRunning = true;
    const task = taskQueue.shift(); // Get the next task from the front of the queue.
    manageApp(task.event, { ...task.appData, action: task.action });
}

// --- IPC Listeners for App Actions ---
// When the renderer requests an action, we add it to the queue and then
// attempt to process the queue.

ipcMain.on('install-app', (event, appData) => {
    taskQueue.push({ event, appData, action: 'install' });
    event.sender.send('manage-app-status', { caskName: appData.caskName, status: 'queued' });
    processTaskQueue();
});
ipcMain.on('uninstall-app', (event, appData) => {
    taskQueue.push({ event, appData, action: 'uninstall' });
    event.sender.send('manage-app-status', { caskName: appData.caskName, status: 'queued' });
    processTaskQueue();
});
ipcMain.on('update-app', (event, appData) => {
    taskQueue.push({ event, appData, action: 'update' });
    event.sender.send('manage-app-status', { caskName: appData.caskName, status: 'queued' });
    processTaskQueue();
});
