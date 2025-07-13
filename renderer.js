// renderer.js
'use strict';

const { useState, useMemo, useEffect, useRef } = React;

// --- Icon Components ---
const SearchIcon = ({ s=22, c='' }) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const Loader = ({ s=24, c='' }) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${c} animate-spin`}><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>;
const Globe = ({s=16,c=''}) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>;
const Play = ({ s=16, c='' }) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>;
const Trash = ({ s=16, c='' }) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const ArrowUp = ({ s=16, c='' }) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>;


/**
 * A shared component for displaying a single app in a list.
 * @param {object} props - Component properties.
 * @param {object} props.app - The application data object.
 * @param {boolean} props.isManaging - Whether the app is currently being processed.
 * @param {function} props.onAction - Callback for actions like install, uninstall, open.
 * @param {function} props.onOpenHomepage - Callback for opening the homepage.
 * @param {React.ReactNode} props.children - Action buttons to be rendered.
 */
const ListItem = ({ app, isManaging, onAction, onOpenHomepage, children }) => (
    <div className="flex items-center p-3 hover:bg-white/5 rounded-lg transition-colors duration-150">
        <img src={app.iconUrl || 'https://placehold.co/64x64/2d3748/a0aec0?text=App'} alt={app.name} className="w-10 h-10 rounded-lg mr-4" />
        <div className="flex-grow min-w-0">
            <h3 className="font-semibold text-zinc-100 truncate">{app.name}</h3>
            <p className="text-zinc-400 text-sm truncate">{app.description || app.caskName}</p>
        </div>
        <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
            {isManaging ? <div className="text-sm font-semibold text-zinc-400 w-24 text-center">Working...</div> : children}
            <button onClick={() => onOpenHomepage(app)} className="p-2 text-zinc-400 hover:text-white rounded-md hover:bg-white/10" aria-label="Homepage"><Globe s={16}/></button>
        </div>
    </div>
);

/**
 * The main application component.
 */
const App = () => {
    // --- State Management ---
    const [view, setView] = useState('search'); // Controls which view is active: 'search', 'installed', 'updates'
    const [searchTerm, setSearchTerm] = useState(''); // The current text in the search input
    const [searchResults, setSearchResults] = useState([]); // Holds results from live Homebrew search
    const [isSearching, setIsSearching] = useState(false); // True when a search is in progress
    const [installedCasks, setInstalledCasks] = useState([]); // List of cask names that are installed
    const [outdatedCasks, setOutdatedCasks] = useState([]); // List of outdated cask objects from Homebrew
    const [managingApps, setManagingApps] = useState(new Set()); // A set of cask names currently being installed/uninstalled
    const [installedAppDetails, setInstalledAppDetails] = useState([]); // Detailed info for installed apps
    const [outdatedAppDetails, setOutdatedAppDetails] = useState([]); // Detailed info for outdated apps
    const searchInputRef = useRef(null); // A ref to the search input element for focusing

    // Constants for dynamic window sizing
    const BASE_HEIGHT = 70;
    const ITEM_HEIGHT = 64;
    const MAX_HEIGHT = 580;

    // --- Data Fetching and Event Listeners ---

    // Fetches the current lists of installed and outdated apps from Homebrew.
    const fetchInstalledAndOutdated = async () => {
        const [installed, outdated] = await Promise.all([
            window.electronAPI.getInstalledApps(),
            window.electronAPI.getOutdatedApps()
        ]);
        setInstalledCasks(installed);
        setOutdatedCasks(outdated.casks || []);
    };
    
    // This effect runs once on mount to set up initial state and listeners.
    useEffect(() => {
        fetchInstalledAndOutdated();

        // Refreshes data whenever an action (install, uninstall, etc.) is completed.
        const statusCallback = (event, {caskName, status}) => {
             if (status.endsWith('ing')) {
                setManagingApps(prev => new Set(prev).add(caskName));
            } else { // On completion ('installed', 'uninstalled', 'opened', 'error')
                setManagingApps(prev => {
                    const next = new Set(prev);
                    next.delete(caskName);
                    return next;
                });
                fetchInstalledAndOutdated(); // Refresh lists
            }
        };
        window.electronAPI.onManageAppStatus(statusCallback);
        
        // Resets the view to 'search' and focuses the input when the window is shown.
        const focusCallback = () => {
            setView('search');
            searchInputRef.current?.focus();
        };
        window.electronAPI.onFocusInput(focusCallback);
        
        // Cleanup function to remove listeners when the component unmounts.
        return () => {
            window.electronAPI.removeAllListeners('manage-app-status');
            window.electronAPI.removeAllListeners('focus-input');
        };
    }, []);
    
    // This effect debounces search input to prevent firing a search on every keystroke.
    useEffect(() => {
        const handler = setTimeout(async () => {
            if (view === 'search' && searchTerm.trim()) {
                setIsSearching(true);
                const results = await window.electronAPI.searchCasks(searchTerm);
                setSearchResults(results);
                setIsSearching(false);
            } else {
                 setSearchResults([]);
            }
        }, 250);
        return () => clearTimeout(handler);
    }, [searchTerm, view]);

    // This effect resizes the window dynamically based on the current view and number of results.
    useEffect(() => {
        let contentHeight = 0;
        let hasContent = false;
        if (view === 'search') {
            if(searchResults.length > 0) {
              contentHeight = (searchResults.length * ITEM_HEIGHT) + 16;
              hasContent = true;
            }
        } else if (view === 'installed') {
            contentHeight = installedAppDetails.length > 0 ? (installedAppDetails.length * ITEM_HEIGHT) + 16 : 80;
            hasContent = true;
        } else if (view === 'updates') {
            contentHeight = outdatedAppDetails.length > 0 ? (outdatedAppDetails.length * ITEM_HEIGHT) + 16 : 80;
            hasContent = true;
        }
        
        const newHeight = BASE_HEIGHT + (hasContent ? contentHeight : 0);
        window.electronAPI.resizeWindow(Math.min(newHeight, MAX_HEIGHT));
    }, [searchResults, view, installedAppDetails, outdatedAppDetails]);

    // This effect fetches detailed information for apps when switching to 'Installed' or 'Updates' view.
    useEffect(() => {
        const fetchDetails = async () => {
            if (view === 'installed') {
                setInstalledAppDetails(await window.electronAPI.getCaskDetails(installedCasks));
            } else if (view === 'updates') {
                const outdatedNames = outdatedCasks.map(cask => cask.name);
                const details = await window.electronAPI.getCaskDetails(outdatedNames);
                const detailsWithVersions = details.map(detail => {
                    const outdatedInfo = outdatedCasks.find(c => c.name === detail.caskName);
                    return { ...detail, ...outdatedInfo };
                });
                setOutdatedAppDetails(detailsWithVersions);
            }
        };
        fetchDetails();
    }, [view, installedCasks, outdatedCasks]);

    // --- Action Handlers ---

    const handleAction = (action, app) => {
        setManagingApps(prev => new Set(prev).add(app.caskName));
        window.electronAPI[action + 'App'](app);
    };

    const handleOpenHomepage = (app) => {
        window.electronAPI.openAppHomepage(app);
    };
    
    const handleSetView = (newView) => {
        setView(newView);
        if (newView === 'search') {
            setTimeout(() => searchInputRef.current?.focus(), 0);
        }
    };

    // --- Render Logic ---

    // This function determines which list of items to render based on the current view.
    const renderContent = () => {
        const listProps = { onAction: handleAction, onOpenHomepage: handleOpenHomepage, isManaging: false };
        let items = [];
        let emptyMessage = "";

        switch(view) {
            case 'installed':
                items = installedAppDetails;
                emptyMessage = "No installed apps found.";
                break;
            case 'updates':
                items = outdatedAppDetails;
                emptyMessage = "All apps are up to date!";
                break;
            default: // search
                items = searchResults;
                emptyMessage = searchTerm ? `No results found for "${searchTerm}".` : "Search for an app to get started.";
                break;
        }

        if (isSearching) {
            return <div className="flex justify-center items-center h-full"><Loader c="text-zinc-400" /></div>;
        }

        if (items.length > 0) {
            return items.map(app => {
                const props = {
                    ...listProps,
                    app,
                    isManaging: managingApps.has(app.caskName),
                    isInstalled: installedCasks.includes(app.caskName),
                };
                if (view === 'installed') {
                    return <ListItem {...props}><button onClick={() => handleAction('open', app)} className="px-3 py-1 text-xs rounded-md bg-white/10 hover:bg-white/20">Open</button><button onClick={() => handleAction('uninstall', app)} className="px-3 py-1 text-xs rounded-md bg-red-600/80 hover:bg-red-600">Uninstall</button></ListItem>;
                }
                if (view === 'updates') {
                    return <ListItem {...props}><button onClick={() => handleAction('update', app)} className="px-3 py-1 text-xs rounded-md bg-green-600/80 hover:bg-green-600">Update</button></ListItem>;
                }
                // Search result view
                return <ListItem {...props}>
                    {props.isInstalled
                        ? <button onClick={() => handleAction('open', app)} className="px-3 py-1 text-xs rounded-md bg-white/10 hover:bg-white/20">Open</button>
                        : <button onClick={() => handleAction('install', app)} className="px-3 py-1 text-xs rounded-md bg-blue-600 hover:bg-blue-500">Install</button>
                    }
                </ListItem>
            });
        }
        
        if (view === 'search' && !searchTerm) {
             return <p className="text-center text-zinc-500 pt-8">Search for an app to get started.</p>;
        }
        if(items.length === 0 && (view !== 'search' || searchTerm)) {
             return <p className="text-center text-zinc-500 pt-8">{emptyMessage}</p>;
        }
        return null;
    };

    return (
        <div className="h-screen w-full bg-transparent text-white rounded-2xl overflow-hidden flex flex-col">
            {/* Draggable top bar */}
            <div className="p-3 border-b border-white/10" style={{ WebkitAppRegion: 'drag' }}>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                       {isSearching ? <Loader s={20} c="text-zinc-400"/> : <SearchIcon s={20} c="text-zinc-400"/>}
                    </div>
                    {/* Search Input */}
                    <input ref={searchInputRef} type="text" placeholder="Search for apps..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-transparent text-xl pl-12 pr-4 py-2 focus:outline-none" style={{ WebkitAppRegion: 'no-drag' }}/>
                    
                    {/* Floating Navigation Buttons */}
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center space-x-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity" style={{ WebkitAppRegion: 'no-drag' }}>
                        <button onClick={() => handleSetView('search')} className={`px-2 py-1 text-xs rounded-md ${view === 'search' ? 'bg-blue-500 text-white' : 'bg-white/10 text-zinc-300 hover:bg-white/20'}`}>Search</button>
                        <button onClick={() => handleSetView('installed')} className={`px-2 py-1 text-xs rounded-md ${view === 'installed' ? 'bg-blue-500 text-white' : 'bg-white/10 text-zinc-300 hover:bg-white/20'}`}>Installed</button>
                        <button onClick={() => handleSetView('updates')} className={`px-2 py-1 text-xs rounded-md relative ${view === 'updates' ? 'bg-blue-500 text-white' : 'bg-white/10 text-zinc-300 hover:bg-white/20'}`}>
                            Updates
                            {outdatedCasks.length > 0 && <span className="absolute -top-1 -right-1 block h-3 w-3 rounded-full bg-green-500 border-2 border-zinc-900"></span>}
                        </button>
                    </div>
                </div>
            </div>
            {/* Scrollable list of results */}
            <div className="flex-grow overflow-y-auto p-2 space-y-1">
                {renderContent()}
            </div>
        </div>
    );
};

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(<App />);