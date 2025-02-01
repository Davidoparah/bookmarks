# Tab Manager Chrome Extension

A Chrome extension to manage and organize tabs based on different roles/activities.

## Features

- Create and manage different tab collections (e.g., Job Search, House Hunting, Entertainment, Coding, Studying)
- Save current tabs to a collection
- Open all tabs in a collection with one click
- Delete or modify existing collections
- Smart storage management with automatic syncing
- Bulk actions for multiple collections or tabs
- Visual indicators for sync status
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

The extension uses a smart storage system to maximize sync capabilities while handling larger collections:

### When Saving Collections:
- If collection is small enough (≤8KB), saves to sync storage for cross-device access
- If too large, automatically saves to local storage
- Shows storage location in the success message (🔄 for synced, 💻 for local)

### During Loading:
- Loads both synced and local collections
- Shows sync status for each collection with clear visual indicators
- Automatically checks if local collections can be moved to sync storage

### Automatic Sync:
- Periodically checks if local collections can be moved to sync storage
- Automatically moves collections when they meet size requirements (≤8KB)
- Updates UI to reflect any changes in sync status

### Storage Limits:
- Sync storage: Up to 8KB per collection for cross-device syncing
- Local storage: Up to 5MB per collection for larger sets of tabs
- Collections automatically move between storage types as their size changes

## Recycle Bin & Recovery

The extension includes a recycle bin feature to help recover accidentally deleted items:

### Deleted Items Recovery:
- All deleted collections and individual tabs are stored in the recycle bin
- Items are kept for 7 days before automatic removal
- Quick undo option appears immediately after deletion
- Full recycle bin access for older deletions

### Recovery Features:
- Immediate undo button appears after any deletion
- Restore entire collections or individual tabs
- Shows expiration time for each deleted item
- Maintains original sync/local storage status when restored

### Recycle Bin Management:
- Automatic cleanup of expired items
- Clear indication of days remaining for each item
- Easy-to-use restore buttons for each item
- Keeps storage type (sync/local) information for proper restoration

## Project Structure

``` # bookmarks
