# Tab Manager Chrome Extension

A Chrome extension to manage and organize tabs based on different roles/activities.

## Features

- Create and manage different tab collections (e.g., Job Search, House Hunting, Entertainment, Coding, Studying)
- Save current tabs to a collection with automatic compression
- Open all tabs in a collection with one click
- Delete or modify existing collections
- Smart storage management with cross-device syncing
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
2. Create new collections:
   - Enter a collection name
   - Click "Save current tabs"
   - The extension automatically chooses optimal storage (sync or local)
3. Manage collections:
   - Click on a collection to expand/collapse
   - Use "Open All" to launch all tabs
   - Delete individual tabs or entire collections
   - Use checkboxes for bulk operations
4. Recover deleted items:
   - Access the Recycle Bin via the ♻️ button
   - Items are kept for 7 days
   - Restore individual items or entire collections

## Storage Management

### Smart Storage System
- Automatic data compression:
  - URL optimization (removes common prefixes, preserves protocols)
  - Title truncation (max 100 characters)
  - Favicon optimization
  - Metadata tracking
- Storage selection:
  - Sync storage: Up to 8KB per collection (syncs across devices)
  - Local storage: Up to 5MB per collection (larger collections)
  - Total sync quota: ~100KB (Chrome limitation)

### Automatic Sync Features
- Background sync checks every 5 minutes
- Prioritizes collections based on:
  - Size (smaller collections first)
  - Last modified time
  - Available sync space
- Seamless transition between storage types:
  - Large collections start in local storage
  - Automatically moves to sync when size permits
  - Preserves all data during transitions

## Data Management

### URL Handling
- Smart URL compression:
  - Preserves protocol (http/https)
  - Removes common prefixes (www.)
  - Maintains full functionality
- Automatic protocol detection
- Fallback to HTTPS for safety

### Collection Features
- Expandable/collapsible collections
- Visual status indicators
- Bulk operations:
  - Select multiple tabs
  - Open selected tabs
  - Delete selected tabs
- Sort by name, size, or date

### Error Handling
- Graceful fallback to local storage
- Automatic retry mechanisms
- Clear error messages
- Data integrity checks
- Quota management

## Recovery System

### Recycle Bin
- 7-day retention period
- Automatic cleanup
- Visual countdown for expiration
- Storage type preservation
- Quick restore options

### Undo Features
- Immediate undo for deletions
- Bulk restore capabilities
- Storage status preservation
- Automatic cleanup

## Technical Details

### Storage Optimization
- Intelligent compression algorithms
- Protocol preservation
- Automatic size management
- Quota-aware operations

### Performance
- Asynchronous operations
- Background sync
- Memory-efficient
- Clean up on unload

### Browser Support
- Chrome version 88+
- Cross-platform support
- Sync requires Chrome sync enabled

## Project Structure

```
tab-manager/
├── manifest.json      # Extension configuration
├── popup.html        # Main interface
├── popup.js         # Core functionality
│   ├── Storage Management
│   ├── URL Handling
│   ├── Collection Management
│   └── Recovery System
├── background.js    # Background processes
├── content.js       # Page interaction
├── styles/
│   └── popup.css    # UI styling
└── icons/
    ├── icon16.png   # Extension icons
    ├── icon48.png
    └── icon128.png
```

## Known Limitations
- Sync storage limited to 8KB per collection (Chrome limitation)
- Local storage limited to 5MB per collection
- Total sync quota ~100KB across all collections
- Some chrome:// URLs cannot be saved

## Best Practices
- Use meaningful collection names
- Regular cleanup of unused collections
- Check recycle bin periodically
- Use bulk actions for efficiency
- Split large collections if needed
