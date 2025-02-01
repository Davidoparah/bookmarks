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
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Received message:', message);
    // Handle any messages from popup.js here
    sendResponse({ status: 'success' });
    return true; // Required to use sendResponse asynchronously
}); 