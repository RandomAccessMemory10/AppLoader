/**
 * @file renderer.js
 * This file contains all the client-side logic for the application's user interface.
 * It's a React application that renders the app store, manages state, and communicates
 * with the main process (main.js) via the preload script's exposed APIs.
 */

'use strict';

// Destructure necessary hooks from the React library.
const { useState, useMemo, useEffect } = React;

// --- UI Icon Components ---
// These are simple, stateless functional components that render SVG icons.
// They accept size (s) and className (c) as props for easy customization.
const Download = ({ s=16, c='' }) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>;
const ArrowUp = ({ s=16, c='' }) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>;
const Trash = ({ s=16, c='' }) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const Search = ({ s=22, c='' }) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const Loader = ({ s=48, c='' }) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${c} animate-spin`}><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>;
const Globe = ({s=16,c=''}) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>;
const CheckCircle = ({s=16,c=''}) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
const Play = ({ s=16, c='' }) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>;
const AlertTriangle = ({ s=48, c='' }) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>;
const RefreshCw = ({ s = 16, c = '' }) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}><path d="M3 2v6h6"/><path d="M21 12A9 9 0 0 0 6 5.3L3 8"/><path d="M21 22v-6h-6"/><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"/></svg>;
const BrowserIcon = ({s=16,c=''}) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4"></circle><line x1="21.17" y1="8" x2="12" y2="8"></line><line x1="3.95" y1="6.06" x2="8.54" y2="14"></line><line x1="10.88" y1="21.94" x2="15.46" y2="14"></line></svg>;
const DesignIcon = ({s=16,c=''}) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>;
const DevelopmentIcon = ({s=16,c=''}) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>;
const ProductivityIcon = ({s=16,c=''}) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const MediaIcon = ({s=16,c=''}) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>;
const SocialIcon = ({s=16,c=''}) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
const GamesIcon = ({s=16,c=''}) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}><path d="M6 12h12M12 18V6"></path><path d="M12 18a6 6 0 110-12 6 6 0 010 12z"></path></svg>;
const UtilitiesIcon = ({s=16,c=''}) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>;
const EducationIcon = ({s=16,c=''}) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>;

// A mapping of category names to their corresponding icon components for dynamic rendering.
const categoryIcons = { "All": Globe, "Browsers": BrowserIcon, "Design": DesignIcon, "Development": DevelopmentIcon, "Productivity": ProductivityIcon, "Media": MediaIcon, "Social": SocialIcon, "Games": GamesIcon, "Utilities": UtilitiesIcon, "Education": EducationIcon };

/**
 * A reusable button component that displays progress as a filling background.
 * @param {object} props - The component's props.
 * @param {object} props.progress - The progress object { percent, text }.
 * @param {function} props.onClick - The function to call when the button is clicked.
 * @param {boolean} props.disabled - Whether the button should be disabled.
 * @param {React.ReactNode} props.children - The default content of the button (e.g., text and an icon).
 * @param {string} props.baseClassName - The base Tailwind CSS classes for the button.
 * @param {string} props.progressClassName - The Tailwind CSS classes for the progress fill element.
 */
const ProgressButton = ({ progress, onClick, disabled, children, baseClassName, progressClassName }) => {
    const { percent = 0, text } = progress || {};
    const isQueued = text === 'Queued...';
    
    // If the progress object has text, we display it. Otherwise, we show the default children.
    const buttonText = text ? <span>{text} {percent > 0 && percent < 100 && `${percent}%`}</span> : children;

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`relative w-full font-bold py-2 px-4 rounded-lg flex items-center justify-center overflow-hidden transition-all duration-300 ${baseClassName} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
            {/* This div is the visual progress indicator. Its width is animated based on the 'percent' prop. */}
            <div
                className={`absolute top-0 left-0 h-full ${progressClassName} ${isQueued ? 'bg-opacity-50' : ''}`}
                style={{ width: `${isQueued ? 100 : percent}%`, transition: 'width 0.2s ease-in-out' }}
            ></div>
            {/* The actual button content is placed in a span with a higher z-index to appear above the progress fill. */}
            <span className="relative z-10 flex items-center justify-center">
                {buttonText}
            </span>
        </button>
    );
};

/**
 * Renders a single application card in the store.
 * @param {object} props - The component's props.
 */
const AppCard = ({ app, status, onInstall, onUninstall, onUpdate, onOpen, onOpenHomepage, progress }) => {
    const { isInstalled, isOutdated, isManaging } = status;

    // Helper function to format file sizes into a human-readable format.
    const formatBytes = (bytes, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    return (
        <div className={`relative bg-white/10 dark:bg-zinc-800/50 backdrop-blur-sm border border-zinc-300/20 dark:border-zinc-700/50 rounded-2xl p-4 flex flex-col items-center transition-all duration-300 ${isManaging ? 'opacity-50' : 'hover:shadow-xl hover:-translate-y-1'}`}>
            
            <button onClick={() => onOpenHomepage(app)} className="absolute top-3 right-3 bg-zinc-500/50 hover:bg-zinc-600/70 text-white p-2 rounded-full z-10 transition-colors disabled:opacity-50" disabled={isManaging} aria-label="Open Homepage">
                <Globe s={16}/>
            </button>
            
            <img src={app.iconUrl || 'https://placehold.co/128x128/1f2937/4b5563?text=Icon'} alt={app.name} className="w-24 h-24 rounded-2xl mb-4" />
            
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-lg mb-1 truncate w-full text-center">{app.name}</h3>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2 h-4 text-center">
                {app.developer && <span>{app.developer}</span>}
                {app.size_in_bytes && <span className="font-mono"> • {formatBytes(app.size_in_bytes)}</span>}
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4 flex-grow h-16 overflow-hidden text-center">{app.description}</p>
            
            {/* This container holds the action buttons at the bottom of the card. */}
            <div className="mt-auto w-full flex flex-col space-y-2 min-h-[5rem] justify-end">
                {isInstalled ? (
                    // If the app is installed, show Open, Update (if available), and Uninstall buttons.
                    <>
                        <button onClick={() => onOpen(app)} disabled={isManaging} className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center disabled:opacity-50"><Play c="mr-2"/>Open</button>
                        {isOutdated && (
                             <ProgressButton
                                 onClick={() => onUpdate(app)}
                                 disabled={isManaging}
                                 progress={isManaging ? progress : null}
                                 baseClassName="bg-green-500 hover:bg-green-600 text-white"
                                 progressClassName="bg-green-700"
                             >
                                 <ArrowUp c="mr-2"/>Update
                             </ProgressButton>
                        )}
                        <ProgressButton
                             onClick={() => onUninstall(app)}
                             disabled={isManaging}
                             progress={isManaging ? progress : null}
                             baseClassName="bg-red-500 hover:bg-red-600 text-white"
                             progressClassName="bg-red-700"
                         >
                             <Trash c="mr-2"/>Uninstall
                         </ProgressButton>
                    </>
                ) : (
                    // If the app is not installed, show the Install button.
                    <ProgressButton
                        onClick={() => onInstall(app)}
                        disabled={isManaging}
                        progress={isManaging ? progress : null}
                        baseClassName="bg-blue-500 hover:bg-blue-600 text-white"
                        progressClassName="bg-blue-700"
                    >
                        <Download c="mr-2"/>Install
                    </ProgressButton>
                )}
            </div>
        </div>
    );
};

/**
 * Renders the "Installed" page, showing a list of all managed apps that are currently installed.
 */
const InstalledView = ({ apps, onOpen, onUninstall, managingApps, progressData }) => (
    <div className="p-8">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">Installed Apps</h1>
        <div className="space-y-4">
            {apps.length > 0 ? apps.map(app => {
                const isManaging = managingApps.includes(app.caskName);
                return (
                    <div key={app.caskName} className="bg-white/10 dark:bg-zinc-800/50 p-4 rounded-lg flex items-center justify-between">
                        <div className="flex items-center">
                            <img src={app.iconUrl || 'https://placehold.co/64x64/1f2937/4b5563?text=Icon'} className="w-12 h-12 rounded-lg mr-4" />
                            <div>
                                <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">{app.name}</h3>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400">{app.developer}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                           <button onClick={() => onOpen(app)} disabled={isManaging} className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center disabled:opacity-50"><Play c="mr-2"/>Open</button>
                           <ProgressButton
                                onClick={() => onUninstall(app)}
                                disabled={isManaging}
                                progress={isManaging ? progressData[app.caskName] : null}
                                baseClassName="bg-red-500 hover:bg-red-600 text-white min-w-[120px]"
                                progressClassName="bg-red-700"
                           >
                               <Trash c="mr-2"/>Uninstall
                           </ProgressButton>
                        </div>
                    </div>
                )
            }) : <p className="text-center text-zinc-500 dark:text-zinc-400 py-8">No applications managed by this app are installed.</p>}
        </div>
    </div>
);

/**
 * Renders the "Updates" page, showing a list of all installed apps that have an update available.
 */
const UpdatesView = ({ apps, onUpdateAll, onUpdate, managingApps, progressData }) => (
    <div className="p-8">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">Available Updates</h1>
            <button onClick={onUpdateAll} disabled={managingApps.length > 0} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">Update All</button>
        </div>
        <div className="space-y-4">
            {apps.length > 0 ? apps.map(app => {
                const isManaging = managingApps.includes(app.caskName);
                return (
                    <div key={app.caskName} className="bg-white/10 dark:bg-zinc-800/50 p-4 rounded-lg flex items-center justify-between">
                        <div className="flex items-center">
                            <img src={app.iconUrl || 'https://placehold.co/64x64/1f2937/4b5563?text=Icon'} className="w-12 h-12 rounded-lg mr-4" />
                            <div>
                                <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">{app.name}</h3>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400">Version {app.installed_version} → {app.current_version}</p>
                            </div>
                        </div>
                        <ProgressButton
                            onClick={() => onUpdate(app)}
                            disabled={isManaging}
                            progress={isManaging ? progressData[app.caskName] : null}
                            baseClassName="bg-green-500 hover:bg-green-600 text-white min-w-[120px]"
                            progressClassName="bg-green-700"
                        >
                            <ArrowUp c="mr-2"/>Update
                        </ProgressButton>
                    </div>
                )
            }) : <p className="text-center text-zinc-500 dark:text-zinc-400 py-8">All your applications are up to date!</p>}
        </div>
    </div>
);

/**
 * Renders a full-screen view prompting the user to install Homebrew if it's not detected.
 */
const BrewCheckView = () => {
    const [installStatus, setInstallStatus] = useState('idle');
    // Listen for status updates from the main process regarding the Homebrew installation attempt.
    useEffect(() => {
        const removeListener = window.electronAPI.onBrewInstallStatus((_event, { status }) => {
            setInstallStatus(status);
        });
        return () => removeListener();
    }, []);
    // Tell the main process to start the installation.
    const handleInstallClick = () => {
        setInstallStatus('starting');
        window.electronAPI.installBrew();
    };
    return (
        <div className="font-sans h-screen w-full flex items-center justify-center bg-zinc-900 text-white">
            <div className="text-center p-8 bg-zinc-800 rounded-2xl max-w-lg mx-4">
                <AlertTriangle s={64} c="text-yellow-400 mx-auto mb-4" />
                <h1 className="text-3xl font-bold mb-2">Homebrew Not Found</h1>
                <p className="text-zinc-300 mb-6">This application requires Homebrew to manage apps.</p>
                <div className="space-y-4">
                    <button onClick={handleInstallClick} disabled={installStatus === 'starting' || installStatus === 'started'} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300">
                        <Download c="mr-2"/>
                        {installStatus === 'starting' && 'Starting...'}
                        {installStatus === 'started' && 'Check Terminal...'}
                        {installStatus === 'idle' && 'Attempt to Install Homebrew'}
                        {installStatus === 'error' && 'Error - Try Again'}
                    </button>
                    <div className="text-sm text-zinc-400 p-3 bg-black/20 rounded-lg">
                        <p className="font-semibold">After the installation in the Terminal is complete, relaunch the app using the button below.</p>
                    </div>
                    <button onClick={() => window.electronAPI.restartApp()} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-all duration-300">
                        <RefreshCw c="mr-2"/>
                        Relaunch Application
                    </button>
                </div>
                <div className="mt-8 border-t border-zinc-700 pt-6">
                     <p className="text-xs text-zinc-400">
                        If the button above fails, copy this command and paste it into a new Terminal window:
                    </p>
                    <pre className="bg-black/50 text-white p-3 rounded-lg text-left overflow-x-auto text-xs mt-2 font-mono select-all">
                        <code>/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"</code>
                    </pre>
                </div>
            </div>
        </div>
    );
};

/**
 * The root component of the application. It manages the main state and renders the appropriate view.
 */
const App = () => {
    // --- State Management ---
    const [view, setView] = useState('store'); // Which page is currently visible ('store', 'updates', 'installed').
    const [selectedCategory, setSelectedCategory] = useState('All'); // The currently selected app category.
    const [searchTerm, setSearchTerm] = useState(''); // The current value of the search input.
    const [isLoading, setIsLoading] = useState(true); // Whether the app is in an initial loading state.
    const [installedApps, setInstalledApps] = useState([]); // An array of cask names for all installed apps.
    const [outdatedApps, setOutdatedApps] = useState([]); // An array of app objects for outdated apps.
    const [managingApps, setManagingApps] = useState([]); // A list of cask names for apps currently being managed (install/update/uninstall).
    const [progressData, setProgressData] = useState({}); // An object mapping cask names to their progress data.
    const [brewFound, setBrewFound] = useState(true); // Whether Homebrew was found on the system.

    // --- Memoized Data ---
    // useMemo is used to optimize performance by caching the result of expensive calculations.
    // The calculation is only re-run if one of the dependencies in the dependency array changes.
    const allCuratedApps = useMemo(() => Object.values(APP_DATA).flat(), []);

    // --- Functions to Interact with the Main Process ---
    const checkBrewStatus = async () => {
        setIsLoading(true);
        const found = await window.electronAPI.checkBrew();
        setBrewFound(found);
        if (found) {
            await fetchAppStatus();
        }
        setIsLoading(false);
    };

    const fetchAppStatus = async () => {
        try {
            const [installed, outdated] = await Promise.all([
                window.electronAPI.getInstalledApps(),
                window.electronAPI.getOutdatedApps()
            ]);
            setInstalledApps(installed);
            setOutdatedApps(outdated.casks || []);
        } catch (error) {
            console.error("Failed to fetch app status:", error);
        }
    };

    // --- Effect Hook for Initialization and IPC Listeners ---
    // The useEffect hook runs after the component mounts. An empty dependency array `[]` means it only runs once.
    useEffect(() => {
        // Check for Homebrew and fetch app statuses on initial load.
        checkBrewStatus();
        
        // Set up listeners for events from the main process.
        // These listeners update the component's state based on background task progress.
        const removeStatusListener = window.electronAPI.onManageAppStatus((_event, { caskName, status, message }) => {
            if (status === 'error') {
                console.error(`Error with ${caskName || 'operation'}: ${message}`);
                // Remove the app from the managing list on error.
                setManagingApps(prev => prev.filter(c => c !== caskName));
                setProgressData(prev => { const next = {...prev}; delete next[caskName]; return next; });
            } else if (status === 'queued') {
                // Add the app to the managing list and set its initial progress text.
                setManagingApps(prev => [...new Set([...prev, caskName])]);
                setProgressData(prev => ({ ...prev, [caskName]: { percent: 0, text: 'Queued...' } }));
            } else if (status.endsWith('ing')) { // Catches 'installing', 'updating', 'uninstalling'
                // Update the progress text when the task starts.
                setManagingApps(prev => [...new Set([...prev, caskName])]);
                setProgressData(prev => ({
                    ...prev,
                    [caskName]: {
                        percent: prev[caskName]?.percent || 0,
                        text: `${status.charAt(0).toUpperCase() + status.slice(1)}...`
                    }
                }));
            } else { // Catches 'installed', 'uninstalled', 'updated'
                // Task is complete. Remove the app from the managing list and refresh all app statuses.
                setManagingApps(prev => prev.filter(c => c !== caskName));
                setProgressData(prev => { const next = {...prev}; delete next[caskName]; return next; });
                fetchAppStatus();
            }
        });

        const removeProgressListener = window.electronAPI.onManageAppProgress((_event, { caskName, percent, text }) => {
            setProgressData(prev => ({ ...prev, [caskName]: { percent, text } }));
        });

        // The return function from useEffect is a cleanup function. It's called when the component unmounts.
        // This is important to prevent memory leaks by removing the listeners.
        return () => {
            removeStatusListener();
            removeProgressListener();
        };
    }, []);

    // --- Event Handlers ---
    // These functions are passed down as props to child components to trigger actions in the main process.
    const handleInstall = (app) => window.electronAPI.installApp(app);
    const handleUninstall = (app) => window.electronAPI.uninstallApp(app);
    const handleUpdate = (app) => window.electronAPI.updateApp(app);
    const handleOpen = (app) => window.electronAPI.openApp(app);
    const handleOpenHomepage = (app) => window.electronAPI.openAppHomepage(app);
    const handleUpdateAll = () => appsWithUpdates.forEach(app => handleUpdate(app));

    // --- Memoized Derived State ---
    // These values are derived from the component's state and are memoized for performance.
    const displayedStoreApps = useMemo(() => {
        const apps = selectedCategory === 'All' ? allCuratedApps : APP_DATA[selectedCategory] || [];
        return apps.filter(app => app.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [selectedCategory, searchTerm, allCuratedApps]);

    const appsWithUpdates = useMemo(() => {
        return outdatedApps.map(outdated => {
            const appDetails = allCuratedApps.find(app => app.caskName === outdated.name);
            return appDetails ? { ...appDetails, installed_version: outdated.installed_versions[0], current_version: outdated.version } : null;
        }).filter(Boolean);
    }, [outdatedApps, allCuratedApps]);

    const installedAppsDetails = useMemo(() => {
        return installedApps.map(caskName => {
            return allCuratedApps.find(app => app.caskName === caskName);
        }).filter(Boolean);
    }, [installedApps, allCuratedApps]);

    // --- Conditional Rendering ---
    if (isLoading) {
        return <div className="font-sans h-screen w-full flex items-center justify-center bg-zinc-900 text-white"><Loader c="text-white"/><p className="ml-4 text-lg">Checking System Status...</p></div>;
    }

    if (!brewFound) {
        return <BrewCheckView />;
    }

    // Function to render the main content based on the current view.
    const renderContent = () => {
        switch(view) {
            case 'store':
                return (
                    <div className="p-8">
                        <div className="sticky top-0 z-10 mb-8 bg-gray-200 dark:bg-gray-800 pt-4">
                            <h1 className="text-5xl font-bold mb-6 text-zinc-900 dark:text-zinc-50">{selectedCategory}</h1>
                            <div className="relative">
                                <Search c="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search this category..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-white/70 dark:bg-zinc-900/50 rounded-xl pl-12 pr-10 py-3 text-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {displayedStoreApps.map(app => {
                                const isInstalled = installedApps.includes(app.caskName);
                                const isOutdated = outdatedApps.some(outdated => outdated.name === app.caskName);
                                const isManaging = managingApps.includes(app.caskName);
                                return <AppCard
                                    key={app.caskName}
                                    app={app}
                                    status={{ isInstalled, isOutdated, isManaging }}
                                    onInstall={handleInstall}
                                    onUninstall={handleUninstall}
                                    onUpdate={handleUpdate}
                                    onOpen={handleOpen}
                                    onOpenHomepage={handleOpenHomepage}
                                    progress={progressData[app.caskName]}
                                />;
                            })}
                        </div>
                    </div>
                );
            case 'updates':
                return <UpdatesView apps={appsWithUpdates} onUpdateAll={handleUpdateAll} onUpdate={handleUpdate} managingApps={managingApps} progressData={progressData} />;
            case 'installed':
                return <InstalledView apps={installedAppsDetails} onOpen={handleOpen} onUninstall={handleUninstall} managingApps={managingApps} progressData={progressData} />;
            default:
                return null;
        }
    };

    // The final JSX to be rendered.
    return (
        <div className="font-sans h-screen w-full flex flex-col overflow-hidden bg-gray-300 dark:bg-zinc-900">
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Navigation */}
                <aside className="w-56 bg-zinc-300/20 dark:bg-black/20 backdrop-blur-2xl p-4 border-r border-black/10 dark:border-white/10 flex-shrink-0">
                    {/* This empty div acts as a draggable area for the window title bar. */}
                    <div className="h-11" style={{ WebkitAppRegion: 'drag' }}></div>
                    <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-2 px-2">Discover</h2>
                    <nav className="mb-6">
                        <ul>
                            <li><button onClick={() => { setView('store'); setSelectedCategory('All'); }} className={`w-full text-left px-3 py-2 rounded-lg text-md flex items-center ${view === 'store' && selectedCategory === 'All' ? 'bg-blue-500 text-white' : 'text-zinc-600 dark:text-zinc-300 hover:bg-black/5'}`}><Globe c="mr-3"/>All Apps</button></li>
                            {Object.keys(APP_DATA).map(category => {
                                const Icon = categoryIcons[category] || Globe;
                                return <li key={category}><button onClick={() => { setView('store'); setSelectedCategory(category); }} className={`w-full text-left px-3 py-2 rounded-lg text-md flex items-center ${view === 'store' && selectedCategory === category ? 'bg-blue-500 text-white' : 'text-zinc-600 dark:text-zinc-300 hover:bg-black/5'}`}><Icon c="mr-3"/>{category}</button></li>
                            })}
                        </ul>
                    </nav>
                    <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-2 px-2">Manage</h2>
                     <nav>
                        <ul>
                           <li><button onClick={() => setView('updates')} className={`w-full text-left px-3 py-2 rounded-lg text-md flex items-center ${view === 'updates' ? 'bg-blue-500 text-white' : 'text-zinc-600 dark:text-zinc-300 hover:bg-black/5'}`}><ArrowUp c="mr-3"/>Updates {outdatedApps.length > 0 && <span className="ml-auto bg-green-500 text-white text-xs font-bold rounded-full px-2">{outdatedApps.length}</span>}</button></li>
                           <li><button onClick={() => setView('installed')} className={`w-full text-left px-3 py-2 rounded-lg text-md flex items-center ${view === 'installed' ? 'bg-blue-500 text-white' : 'text-zinc-600 dark:text-zinc-300 hover:bg-black/5'}`}><CheckCircle c="mr-3"/>Installed</button></li>
                        </ul>
                    </nav>
                </aside>
                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto bg-gray-200 dark:bg-gray-800">
                    <div className="h-11" style={{ WebkitAppRegion: 'drag' }}></div>
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

// --- React DOM Rendering ---
// Find the root DOM element and render the main App component into it.
const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(<App />);
