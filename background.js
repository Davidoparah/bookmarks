// Initialize storage when extension is installed
chrome.runtime.onInstalled.addListener(async () => {
    try {
        // Initialize sync storage
        const syncResult = await chrome.storage.sync.get('collections');
        if (!syncResult.collections) {
            await chrome.storage.sync.set({ collections: {} });
        }
        
        // Initialize local storage
        const localResult = await chrome.storage.local.get('collections');
        if (!localResult.collections) {
            await chrome.storage.local.set({ collections: {} });
        }
        
        console.log('Storage initialized successfully');
    } catch (error) {
        console.error('Error initializing storage:', error);
    }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'saveTabs') {
        // Handle saving tabs
        console.log('Received saveTabs message:', request);
        sendResponse({ success: true });
    }
    return true; // Required for async response
}); 