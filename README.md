# Tab Manager Chrome Extension

A Chrome extension to manage and organize tabs based on different roles/activities.

## Features

- Create and manage different tab collections (e.g., Job Search, House Hunting, Entertainment, Coding, Studying)
- Save current tabs to a collection
- Open all tabs in a collection with one click
- Delete or modify existing collections
- Smart storage management with automatic syncing
- Bulk actions for multiple collections or tabs
- Visual indicators for sync status (🔄 for synced, 💻 for local)
- Recycle bin for recovering deleted items

## Installation

1. Clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Usage

1. Click the extension icon in Chrome toolbar
2. Create new collections for different activities
3. When you have tabs open for an activity:
   - Click the extension icon
   - Enter a name for your collection
   - Click "Save current tabs"
4. To restore tabs:
   - Click the extension icon
   - Select the collection
   - Click "Open all tabs" or select specific tabs to open

## Storage Management

The extension uses an advanced storage system to maximize sync capabilities while handling larger collections:

### Smart Storage System:
- Automatically compresses data to maximize storage efficiency:
  - Removes common URL prefixes (http://, https://, www.)
  - Truncates long titles while preserving readability
  - Optimizes favicon storage
- Uses Chrome's sync storage (up to 8KB per collection) for cross-device access
- Falls back to local storage (up to 5MB) for larger collections
- Shows clear visual indicators: 🔄 for synced, 💻 for local storage

### Automatic Sync Features:
- Checks every 5 minutes for sync opportunities
- Prioritizes collections based on:
  - Size (smaller collections sync first)
  - Last modified time (recent changes get priority)
- Automatically moves collections to sync storage when space becomes available
- Preserves collection metadata across storage types

### Storage Optimization:
- Intelligent data compression
- Automatic cleanup of unused data
- Size-based storage decisions
- Quota management for both sync and local storage

## Recycle Bin & Recovery

### Features:
- 7-day retention period for deleted items
- Automatic cleanup of expired items
- Visual countdown for expiration
- Storage type preservation (sync/local) during restoration

### Recovery Options:
- Immediate undo button after deletion
- Full recycle bin access for older deletions
- Restore entire collections or individual tabs
- Clear expiration indicators

### Management:
- Hourly automatic cleanup
- Clear visual indicators for remaining time
- Easy-to-use restore buttons
- Storage status indicators

## Bulk Actions

### Features:
- Select multiple tabs across collections
- Batch operations:
  - Open selected tabs
  - Delete selected tabs
- Visual counter for selected items
- Easy selection toggle

## Technical Details

### Storage Limits:
- Sync Storage:
  - Per collection: 8KB maximum
  - Total: ~100KB (Chrome sync quota)
- Local Storage:
  - Per collection: 5MB maximum
  - Total: Based on available disk space

### Data Optimization:
- URL compression: Removes common prefixes and trailing slashes
- Title optimization: Smart truncation at 100 characters
- Favicon optimization: Stores only essential path information
- Metadata tracking: Timestamps for sync prioritization

### Error Handling:
- Graceful fallback to local storage
- Clear error messages
- Automatic retry mechanisms
- Data integrity checks

## Browser Compatibility

- Chrome version 88 or higher required
- Works across all platforms (Windows, macOS, Linux)
- Sync features require Chrome sync to be enabled

## Project Structure

```
tab-manager/
├── manifest.json      # Extension configuration
├── popup.html        # Main extension interface
├── popup.js          # Core functionality
├── background.js     # Background processes
├── content.js        # Page interaction
├── styles/
│   └── popup.css     # UI styling
└── icons/
    ├── icon16.png    # Extension icons
    ├── icon48.png
    └── icon128.png
```
