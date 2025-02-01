document.addEventListener('DOMContentLoaded', async function() {
    console.log('Popup loaded');
    
    const saveButton = document.getElementById('saveCollection');
    const collectionInput = document.getElementById('collectionName');
    const collectionsList = document.getElementById('collectionsList');
    
    if (!collectionsList) {
        console.error('Collections list element not found');
        return;
    }
    
    if (saveButton && collectionInput) {
        saveButton.addEventListener('click', async function(e) {
            e.preventDefault();
            console.log('Save button clicked');
            const name = collectionInput.value.trim();
            if (!name) {
                alert('Please enter a collection name');
                return;
            }
            await saveCurrentTabs();
        });
    }
    
    // Initialize storage first
    await chrome.storage.local.get('collections', function(result) {
        if (!result.collections) {
            chrome.storage.local.set({ collections: {} });
        }
    });
    
    // Then load collections
    await loadCollections();
    
    // Add automatic cleanup
    await cleanupRecycleBin();
    
    // Start sync check
    startSyncCheck();
});

const RECYCLE_BIN_KEY = 'recycleBin';
const RECYCLE_BIN_RETENTION_DAYS = 7;

// Update storage limits
const SYNC_QUOTA_BYTES = 8000; // Maximum practical size for sync storage items
const MAX_LOCAL_BYTES = chrome.storage.local.QUOTA_BYTES || 5242880; // Use maximum available local storage
const SYNC_TOTAL_QUOTA = chrome.storage.sync.QUOTA_BYTES || 102400; // Total sync storage quota (100KB)

// Optimize compression for maximum storage
function compressTabData(tab) {
    // Store URL type (http or https)
    const urlType = tab.url.startsWith('https') ? 'https' : 'http';
    
    // Remove common URL prefixes and compress data
    const url = tab.url
        .replace(/^https?:\/\/(www\.)?/, '')  // Remove http(s):// and www.
        .replace(/\/$/, '');  // Remove trailing slash
    
    // Truncate title if too long but keep important parts
    const title = tab.title.length > 100 ? 
        tab.title.substring(0, 97) + '...' : 
        tab.title;
    
    // Store minimal favicon info
    const favicon = tab.favIconUrl ? 
        tab.favIconUrl.split('/').pop().split('?')[0] : // Get filename without query params
        '';
    
    return { u: url, t: title, f: favicon, p: urlType };
}

// Add function to reconstruct full URL
function getFullUrl(tab) {
    // If the URL already starts with http(s), return as is
    if (tab.u.startsWith('http://') || tab.u.startsWith('https://')) {
        return tab.u;
    }
    
    // Use stored protocol or default to https
    const protocol = tab.p || 'https';
    return `${protocol}://${tab.u}`;
}

async function saveCurrentTabs() {
    try {
        const collectionName = document.getElementById('collectionName').value.trim();
        if (!collectionName) {
            alert('Please enter a collection name');
            return;
        }

        console.log('Querying tabs...');
        const tabs = await chrome.tabs.query({ currentWindow: true });
        const validTabs = tabs.filter(tab => {
            return tab.url.startsWith('http') || tab.url.startsWith('https');
        });

        if (validTabs.length === 0) {
            alert('No valid tabs to save. Please open some web pages.');
            return;
        }

        console.log(`Found ${validTabs.length} valid tabs`);

        // Compress tab data before saving
        const tabUrls = validTabs.map(tab => {
            try {
                return compressTabData(tab);
            } catch (err) {
                console.error('Error compressing tab:', tab, err);
                return null;
            }
        }).filter(Boolean);

        const collectionData = { 
            tabs: tabUrls, 
            lastModified: Date.now(),
            version: '1.0'
        };

        console.log('Calculating collection size...');
        const collectionSize = new Blob([JSON.stringify(collectionData)]).size;
        console.log(`Collection size: ${Math.round(collectionSize/1024)}KB`);

        // First try sync storage
        try {
            console.log('Attempting to save to sync storage...');
            const syncResult = await chrome.storage.sync.get('collections');
            const syncCollections = syncResult.collections || {};
            const totalSyncSize = new Blob([JSON.stringify(syncCollections)]).size;
            console.log(`Current sync storage size: ${Math.round(totalSyncSize/1024)}KB`);

            if (collectionSize <= SYNC_QUOTA_BYTES && 
                (totalSyncSize + collectionSize) <= SYNC_TOTAL_QUOTA) {
                syncCollections[collectionName] = collectionData;
                await chrome.storage.sync.set({ collections: syncCollections });
                document.getElementById('collectionName').value = '';
                console.log('Successfully saved to sync storage');
                alert(`Tabs saved successfully! Saved ${validTabs.length} tabs (\u{1F504} synced across devices)`);
                await loadCollections();
                return;
            }
        } catch (syncError) {
            console.log('Sync storage failed, falling back to local storage:', syncError);
        }

        // If sync storage fails or is too small, use local storage
        try {
            console.log('Saving to local storage...');
            const localResult = await chrome.storage.local.get('collections');
            const localCollections = localResult.collections || {};
            
            if (collectionSize > MAX_LOCAL_BYTES) {
                throw new Error(`Collection size (${Math.round(collectionSize/1024)}KB) exceeds maximum allowed size (${Math.round(MAX_LOCAL_BYTES/1024)}KB). Try saving fewer tabs.`);
            }
            
            localCollections[collectionName] = collectionData;
            await chrome.storage.local.set({ collections: localCollections });
            document.getElementById('collectionName').value = '';
            console.log('Successfully saved to local storage');
            alert(`Tabs saved successfully! Saved ${validTabs.length} tabs (\u{1F4BB} stored locally). Will sync automatically when size reduces.`);
            
            // Ensure collections are reloaded before trying to sync
            await loadCollections();
            
            // Schedule a sync check with a slight delay
            setTimeout(() => {
                checkAndMoveToSync().catch(error => {
                    console.error('Delayed sync check failed:', error);
                });
            }, 2000);
        } catch (localError) {
            console.error('Local storage failed:', localError);
            throw new Error(`Unable to save collection: ${localError.message}`);
        }
        
    } catch (error) {
        console.error('Error saving tabs:', error);
        let errorMessage = error.message;
        if (error.message.includes('MAX_ITEMS')) {
            errorMessage = 'Maximum number of collections reached. Try deleting some old collections first.';
        }
        alert('Error saving tabs: ' + errorMessage);
    }
}

async function loadCollections() {
    try {
        // Load from both sync and local storage
        const [syncResult, localResult] = await Promise.all([
            chrome.storage.sync.get('collections'),
            chrome.storage.local.get('collections')
        ]);

        const syncCollections = syncResult.collections || {};
        const localCollections = localResult.collections || {};
        
        const collectionsList = document.getElementById('collectionsList');
        if (!collectionsList) {
            console.error('Collections list element not found');
            return;
        }
        collectionsList.innerHTML = '';

        // Create bulk actions container
        const bulkActionsDiv = document.createElement('div');
        bulkActionsDiv.className = 'bulk-actions';
        bulkActionsDiv.style.display = 'none';
        bulkActionsDiv.innerHTML = `
            <span class="selected-count"></span>
            <button class="open-selected-btn" type="button">Open Selected</button>
            <button class="delete-selected-btn" type="button">Delete Selected</button>
        `;
        collectionsList.appendChild(bulkActionsDiv);

        // Display total number of collections with proper emoji
        const totalCollections = Object.keys(syncCollections).length + Object.keys(localCollections).length;
        const counterDiv = document.createElement('div');
        counterDiv.className = 'collections-counter';
        counterDiv.innerHTML = `
            ${totalCollections} Collection${totalCollections !== 1 ? 's' : ''}
            <button id="showRecycleBinBtn" class="recycle-bin-btn" type="button">
                \u{267B}\u{FE0F} Recycle Bin
            </button>
        `;
        collectionsList.appendChild(counterDiv);

        // Add recycle bin button event listener
        const recycleBinBtn = document.getElementById('showRecycleBinBtn');
        if (recycleBinBtn) {
            recycleBinBtn.addEventListener('click', showRecycleBin);
        } else {
            console.error('Recycle bin button not found');
        }

        // Display synced collections first
        for (const [name, data] of Object.entries(syncCollections)) {
            createCollectionElement(name, data.tabs || data, true);
        }

        // Then display local collections
        for (const [name, data] of Object.entries(localCollections)) {
            createCollectionElement(name, data.tabs || data, false);
        }

        // Add event listeners for bulk actions
        setupBulkActions();

    } catch (error) {
        console.error('Error loading collections:', error);
        alert('Error loading collections: ' + error.message);
    }
}

async function initializeRecycleBin() {
    try {
        const result = await chrome.storage.local.get(RECYCLE_BIN_KEY);
        if (!result[RECYCLE_BIN_KEY]) {
            await chrome.storage.local.set({ [RECYCLE_BIN_KEY]: [] });
        }
        cleanupRecycleBin();
    } catch (error) {
        console.error('Error initializing recycle bin:', error);
    }
}

async function addToRecycleBin(item) {
    try {
        const result = await chrome.storage.local.get(RECYCLE_BIN_KEY);
        const recycleBin = result[RECYCLE_BIN_KEY] || [];
        
        // Add timestamp to item
        item.deletedAt = Date.now();
        recycleBin.push(item);
        
        await chrome.storage.local.set({ [RECYCLE_BIN_KEY]: recycleBin });
        showUndoNotification(item);
    } catch (error) {
        console.error('Error adding to recycle bin:', error);
    }
}

function showUndoNotification(item) {
    const notification = document.createElement('div');
    notification.className = 'undo-notification';
    notification.innerHTML = `
        <span>Item moved to recycle bin</span>
        <button class="undo-btn">Undo</button>
        <span class="countdown">30</span>
    `;
    
    document.body.appendChild(notification);
    
    let countdown = 30;
    const timer = setInterval(() => {
        countdown--;
        notification.querySelector('.countdown').textContent = countdown;
        if (countdown <= 0) {
            clearInterval(timer);
            notification.remove();
        }
    }, 1000);
    
    notification.querySelector('.undo-btn').addEventListener('click', async () => {
        clearInterval(timer);
        notification.remove();
        await restoreItem(item);
    });
    
    setTimeout(() => {
        notification.remove();
    }, 30000);
}

async function showRecycleBin() {
    try {
        const result = await chrome.storage.local.get(RECYCLE_BIN_KEY);
        const recycleBin = result[RECYCLE_BIN_KEY] || [];
        
        const recycleBinDiv = document.createElement('div');
        recycleBinDiv.className = 'recycle-bin';
        
        recycleBinDiv.innerHTML = `
            <div class="recycle-bin-header">
                <h3>Recycle Bin</h3>
                <button class="close-recycle-bin" type="button">×</button>
            </div>
            <div class="recycle-bin-content"></div>
        `;
        
        const content = recycleBinDiv.querySelector('.recycle-bin-content');
        
        if (recycleBin.length === 0) {
            content.innerHTML = '<p>No items in recycle bin</p>';
        } else {
            recycleBin.sort((a, b) => b.deletedAt - a.deletedAt).forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'recycle-bin-item';
                
                const daysRemaining = Math.ceil(
                    (item.deletedAt + (RECYCLE_BIN_RETENTION_DAYS * 24 * 60 * 60 * 1000) - Date.now()) 
                    / (24 * 60 * 60 * 1000)
                );
                
                const deletedDate = new Date(item.deletedAt).toLocaleString();
                const storageIcon = item.isSync ? '\u{1F504}' : '\u{1F4BB}';
                
                itemDiv.innerHTML = `
                    <div class="item-info">
                        <span class="item-name">${item.name} ${storageIcon}</span>
                        <span class="item-date">Deleted: ${deletedDate}</span>
                        <span class="expiry-info">Expires in ${daysRemaining} days</span>
                    </div>
                    <button class="restore-btn" type="button">Restore</button>
                `;
                
                const restoreBtn = itemDiv.querySelector('.restore-btn');
                restoreBtn.addEventListener('click', () => restoreItem(item));
                
                content.appendChild(itemDiv);
            });
        }
        
        const closeBtn = recycleBinDiv.querySelector('.close-recycle-bin');
        closeBtn.addEventListener('click', () => {
            recycleBinDiv.remove();
        });
        
        document.getElementById('collectionsList').appendChild(recycleBinDiv);
        recycleBinDiv.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error showing recycle bin:', error);
    }
}

async function restoreItem(item) {
    try {
        // Remove from recycle bin
        const result = await chrome.storage.local.get(RECYCLE_BIN_KEY);
        const recycleBin = result[RECYCLE_BIN_KEY] || [];
        const updatedRecycleBin = recycleBin.filter(i => i.deletedAt !== item.deletedAt);
        await chrome.storage.local.set({ [RECYCLE_BIN_KEY]: updatedRecycleBin });
        
        // Restore to appropriate storage
        if (item.type === 'collection') {
            const storage = item.isSync ? chrome.storage.sync : chrome.storage.local;
            const result = await storage.get('collections');
            const collections = result.collections || {};
            collections[item.name] = item.tabs;
            await storage.set({ collections });
        } else if (item.type === 'tab') {
            const storage = item.isSync ? chrome.storage.sync : chrome.storage.local;
            const result = await storage.get('collections');
            const collections = result.collections || {};
            if (!collections[item.collectionName]) {
                collections[item.collectionName] = [];
            }
            collections[item.collectionName].push(item.tab);
            await storage.set({ collections });
        }
        
        await loadCollections();
        
        // Remove any existing recycle bin display
        const existingRecycleBin = document.querySelector('.recycle-bin');
        if (existingRecycleBin) {
            existingRecycleBin.remove();
        }
        
        // Show recycle bin again if there are still items
        if (updatedRecycleBin.length > 0) {
            showRecycleBin();
        }
    } catch (error) {
        console.error('Error restoring item:', error);
        alert('Error restoring item: ' + error.message);
    }
}

async function cleanupRecycleBin() {
    try {
        const result = await chrome.storage.local.get(RECYCLE_BIN_KEY);
        const recycleBin = result[RECYCLE_BIN_KEY] || [];
        const now = Date.now();
        const retentionPeriod = RECYCLE_BIN_RETENTION_DAYS * 24 * 60 * 60 * 1000;
        
        const updatedRecycleBin = recycleBin.filter(item => {
            const isExpired = (now - item.deletedAt) >= retentionPeriod;
            if (isExpired) {
                console.log(`Removing expired item: ${item.name}`);
            }
            return !isExpired;
        });
        
        if (updatedRecycleBin.length !== recycleBin.length) {
            await chrome.storage.local.set({ [RECYCLE_BIN_KEY]: updatedRecycleBin });
            console.log(`Cleaned up ${recycleBin.length - updatedRecycleBin.length} expired items`);
        }
    } catch (error) {
        console.error('Error cleaning up recycle bin:', error);
    }
}

async function deleteTabFromCollection(collectionName, tabUrl, isSync) {
    try {
        const storage = isSync ? chrome.storage.sync : chrome.storage.local;
        const result = await storage.get('collections');
        const collections = result.collections || {};
        
        if (collections[collectionName]) {
            const deletedTab = collections[collectionName].tabs.find(tab => tab.u === tabUrl);
            if (deletedTab) {
                await addToRecycleBin({
                    type: 'tab',
                    collectionName,
                    tab: deletedTab,
                    isSync
                });
            }

            collections[collectionName].tabs = collections[collectionName].tabs.filter(
                tab => tab.u !== tabUrl
            );

            if (collections[collectionName].tabs.length === 0) {
                delete collections[collectionName];
            }

            await storage.set({ collections });
            await loadCollections();
        }
    } catch (error) {
        console.error('Error deleting tab:', error);
        alert('Error deleting tab: ' + error.message);
    }
}

async function deleteCollection(name, isSync) {
    try {
        const storage = isSync ? chrome.storage.sync : chrome.storage.local;
        const result = await storage.get('collections');
        const collections = result.collections || {};
        
        // Add to recycle bin before deleting
        if (collections[name]) {
            await addToRecycleBin({
                type: 'collection',
                name,
                tabs: collections[name],
                isSync
            });
        }
        
        delete collections[name];
        await storage.set({ collections });
        await loadCollections();
    } catch (error) {
        console.error('Error deleting collection:', error);
        alert('Error deleting collection: ' + error.message);
    }
}

function createCollectionElement(name, tabs, isSynced) {
    const collectionsList = document.getElementById('collectionsList');
    const collectionDiv = document.createElement('div');
    collectionDiv.className = 'collection-item';
    
    // Create collection header with proper emoji encoding
    const headerDiv = document.createElement('div');
    headerDiv.className = 'collection-header';
    
    // Use Unicode escape sequences for emojis
    const syncIcon = isSynced ? '\u{1F504}' : '\u{1F4BB}';
    
    headerDiv.innerHTML = `
        <span class="collection-name">${name} (${tabs.length} tabs) 
            <span class="sync-status ${isSynced ? 'synced' : 'local'}">${syncIcon}</span>
        </span>
        <div class="collection-controls">
            <button class="open-all-btn" type="button">Open All</button>
            <button class="delete-collection-btn" type="button">Delete</button>
        </div>
    `;
    
    // Create tabs list
    const tabsListDiv = document.createElement('div');
    tabsListDiv.className = 'tabs-list';
    tabsListDiv.style.display = 'none';
    
    // Add click handler for header
    headerDiv.addEventListener('click', (e) => {
        if (!e.target.matches('button, input')) {
            tabsListDiv.style.display = tabsListDiv.style.display === 'none' ? 'block' : 'none';
            headerDiv.classList.toggle('expanded');
        }
    });

    // Add event listeners for collection buttons
    const openAllBtn = headerDiv.querySelector('.open-all-btn');
    const deleteCollectionBtn = headerDiv.querySelector('.delete-collection-btn');

    openAllBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Open all ${tabs.length} tabs?`)) {
            tabs.forEach(tab => {
                chrome.tabs.create({ url: getFullUrl(tab) });
            });
        }
    });

    deleteCollectionBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Delete collection "${name}"?`)) {
            deleteCollection(name, isSynced);
        }
    });

    // Create tab items
    tabs.forEach(tab => {
        const tabDiv = document.createElement('div');
        tabDiv.className = 'tab-item';
        
        // Create tab content with full URL in data attribute
        tabDiv.innerHTML = `
            <div class="tab-content">
                <input type="checkbox" class="tab-checkbox" data-collection="${name}" data-url="${getFullUrl(tab)}" data-storage="${isSynced ? 'sync' : 'local'}">
                <img src="${tab.f || 'icons/default-favicon.png'}" class="tab-favicon" alt="">
                <span class="tab-title">${tab.t}</span>
            </div>
            <div class="tab-actions">
                <button class="open-tab-btn" type="button">Open</button>
                <button class="delete-tab-btn" type="button">Delete</button>
            </div>
        `;

        // Add error handling for favicon
        const favicon = tabDiv.querySelector('.tab-favicon');
        favicon.addEventListener('error', () => {
            favicon.src = 'icons/default-favicon.png';
        });

        // Add event listeners for tab buttons
        const openTabBtn = tabDiv.querySelector('.open-tab-btn');
        const deleteTabBtn = tabDiv.querySelector('.delete-tab-btn');
        const tabCheckbox = tabDiv.querySelector('.tab-checkbox');

        openTabBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: getFullUrl(tab) });
        });

        deleteTabBtn.addEventListener('click', () => {
            if (confirm('Remove this tab from the collection?')) {
                deleteTabFromCollection(name, tab.u, isSynced);
            }
        });

        tabCheckbox.addEventListener('change', () => {
            updateBulkActionsVisibility();
        });

        tabsListDiv.appendChild(tabDiv);
    });

    collectionDiv.appendChild(headerDiv);
    collectionDiv.appendChild(tabsListDiv);
    collectionsList.appendChild(collectionDiv);
}

function setupBulkActions() {
    const bulkActionsDiv = document.querySelector('.bulk-actions');
    if (!bulkActionsDiv) {
        console.error('Bulk actions container not found');
        return;
    }

    const openSelectedBtn = bulkActionsDiv.querySelector('.open-selected-btn');
    const deleteSelectedBtn = bulkActionsDiv.querySelector('.delete-selected-btn');
    const selectedCountSpan = bulkActionsDiv.querySelector('.selected-count');

    if (openSelectedBtn && deleteSelectedBtn) {
        // Handle bulk open
        openSelectedBtn.addEventListener('click', async () => {
            const selectedCheckboxes = document.querySelectorAll('.tab-checkbox:checked');
            if (selectedCheckboxes.length === 0) return;

            if (confirm(`Open ${selectedCheckboxes.length} selected tabs?`)) {
                selectedCheckboxes.forEach(checkbox => {
                    const url = checkbox.dataset.url;
                    if (url) {
                        chrome.tabs.create({ url });
                    }
                });
                // Uncheck all after opening
                selectedCheckboxes.forEach(checkbox => checkbox.checked = false);
                updateBulkActionsVisibility();
            }
        });

        // Handle bulk delete
        deleteSelectedBtn.addEventListener('click', async () => {
            const selectedCheckboxes = document.querySelectorAll('.tab-checkbox:checked');
            if (selectedCheckboxes.length === 0) return;

            if (confirm(`Delete ${selectedCheckboxes.length} selected tabs?`)) {
                try {
                    for (const checkbox of selectedCheckboxes) {
                        const collectionName = checkbox.dataset.collection;
                        const url = checkbox.dataset.url;
                        const isSync = checkbox.dataset.storage === 'sync';
                        
                        if (collectionName && url) {
                            // Get the compressed URL (remove protocol)
                            const compressedUrl = url.replace(/^https?:\/\/(www\.)?/, '');
                            await deleteTabFromCollection(collectionName, compressedUrl, isSync);
                        }
                    }
                    
                    // Refresh the display
                    await loadCollections();
                    
                    // Update bulk actions visibility
                    updateBulkActionsVisibility();
                } catch (error) {
                    console.error('Error deleting selected tabs:', error);
                    alert('Error deleting selected tabs: ' + error.message);
                }
            }
        });

        // Add event listeners for checkboxes
        document.addEventListener('change', (e) => {
            if (e.target.matches('.tab-checkbox')) {
                updateBulkActionsVisibility();
            }
        });
    }
}

function updateBulkActionsVisibility() {
    const bulkActionsDiv = document.querySelector('.bulk-actions');
    if (!bulkActionsDiv) return;

    const selectedCheckboxes = document.querySelectorAll('.tab-checkbox:checked');
    const selectedCount = selectedCheckboxes.length;
    const selectedCountSpan = bulkActionsDiv.querySelector('.selected-count');

    if (selectedCount > 0) {
        bulkActionsDiv.style.display = 'flex';
        selectedCountSpan.textContent = `${selectedCount} tab${selectedCount !== 1 ? 's' : ''} selected`;
    } else {
        bulkActionsDiv.style.display = 'none';
    }
}

async function checkAndMoveToSync() {
    try {
        const [localResult, syncResult] = await Promise.all([
            chrome.storage.local.get('collections'),
            chrome.storage.sync.get('collections')
        ]);

        const localCollections = localResult.collections || {};
        const syncCollections = syncResult.collections || {};

        // If no local collections, nothing to do
        if (Object.keys(localCollections).length === 0) {
            return;
        }

        let hasChanges = false;
        const currentSyncSize = new Blob([JSON.stringify(syncCollections)]).size;
        const availableSyncSpace = SYNC_TOTAL_QUOTA - currentSyncSize;

        console.log('Current sync size:', Math.round(currentSyncSize/1024), 'KB');
        console.log('Available sync space:', Math.round(availableSyncSpace/1024), 'KB');

        // Sort collections by size and last modified
        const collectionsToSync = Object.entries(localCollections)
            .map(([name, data]) => ({
                name,
                data,
                size: new Blob([JSON.stringify(data)]).size,
                lastModified: data.lastModified || 0
            }))
            .sort((a, b) => a.size - b.size || b.lastModified - a.lastModified);

        // Try to move collections that fit in available space
        for (const collection of collectionsToSync) {
            const wouldFit = collection.size <= SYNC_QUOTA_BYTES && 
                            (currentSyncSize + collection.size) <= SYNC_TOTAL_QUOTA;

            if (wouldFit) {
                try {
                    // Create a copy of the sync collections with the new addition
                    const updatedSyncCollections = { ...syncCollections };
                    updatedSyncCollections[collection.name] = collection.data;

                    // Verify the total size after adding
                    const newTotalSize = new Blob([JSON.stringify(updatedSyncCollections)]).size;
                    if (newTotalSize <= SYNC_TOTAL_QUOTA) {
                        // Actually update sync storage
                        await chrome.storage.sync.set({ 
                            collections: updatedSyncCollections 
                        });

                        // Only remove from local after successful sync
                        const updatedLocalCollections = { ...localCollections };
                        delete updatedLocalCollections[collection.name];
                        await chrome.storage.local.set({ 
                            collections: updatedLocalCollections 
                        });

                        hasChanges = true;
                        console.log(`Successfully moved "${collection.name}" to sync storage`);
                    } else {
                        console.log(`Skipping "${collection.name}" - would exceed quota`);
                    }
                } catch (error) {
                    console.error(`Failed to move "${collection.name}" to sync:`, error);
                    // Continue with next collection
                    continue;
                }
            }
        }

        if (hasChanges) {
            console.log('Collections were moved to sync, refreshing display...');
            await loadCollections();
        }
    } catch (error) {
        console.error('Error in checkAndMoveToSync:', error);
        // Don't rethrow - this is a background operation
    }
}

// Update the sync check interval management
let syncCheckInterval;

function startSyncCheck() {
    // Clear any existing interval
    if (syncCheckInterval) {
        clearInterval(syncCheckInterval);
    }

    // Immediate first check
    checkAndMoveToSync().catch(error => {
        console.error('Initial sync check failed:', error);
    });

    // Set new interval
    syncCheckInterval = setInterval(() => {
        checkAndMoveToSync().catch(error => {
            console.error('Periodic sync check failed:', error);
            // Only stop interval on persistent errors
            if (error.message.includes('QUOTA_BYTES_PER_ITEM')) {
                clearInterval(syncCheckInterval);
            }
        });
    }, 5 * 60 * 1000); // Check every 5 minutes
}

// Clean up interval when popup closes
window.addEventListener('unload', () => {
    if (syncCheckInterval) {
        clearInterval(syncCheckInterval);
    }
});

// Make only necessary functions available globally
window.deleteCollection = deleteCollection; 