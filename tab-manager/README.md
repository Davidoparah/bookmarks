# Tab Manager Chrome Extension

A Chrome extension to manage and organize tabs based on different roles/activities.

## Features

- Create and manage different tab collections (e.g., Job Search, House Hunting, Entertainment, Coding, Studying)
- Save current tabs to a collection
- Open all tabs in a collection with one click
- Delete or modify existing collections
- Smart storage management with cross-device syncing
- Visual indicators for sync status

## Storage Management

The extension implements a smart storage system that:
- Saves small collections (< 8KB) to sync storage for cross-device access
- Saves larger collections to local storage
- Automatically moves collections to sync storage when they become small enough
- Shows clear visual indicators of sync status (🔄 for synced, 💻 for local)
- Preserves all functionality regardless of storage type

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
   - Select the appropriate collection
   - Click "Save current tabs"
   - The extension will automatically choose the best storage method
4. To restore tabs:
   - Click the extension icon
   - Select the collection
   - Click "Open all tabs" or individual tab buttons
5. Managing collections:
   - Collapse/expand collections by clicking the title
   - Delete individual tabs or entire collections
   - Monitor sync status through visual indicators
   - Collections automatically sync across devices when possible

## How It Works

The extension provides a seamless way to manage your browser tabs across different activities or projects:

### Saving Tabs
1. When you have multiple tabs open for a specific activity (e.g., "Job Search"):
   - Click the extension icon
   - Enter a name for your collection (e.g., "Job Applications")
   - Click "Save Current Tabs"
2. The extension will:
   - Capture all tabs in your current window
   - Save their URLs, titles, and favicon information
   - Store them in Chrome's sync storage (limited to 5KB per collection)

### Managing Collections
Each collection is displayed with:
- Collection name and tab count
- List of all saved tabs with favicons and titles
- Controls for individual tabs:
  - Open: Launch a specific tab
  - Delete: Remove a tab from the collection
- Collection-level controls:
  - Open All: Launch all tabs in the collection
  - Delete: Remove the entire collection

### Data Syncing
- Collections automatically sync across all your Chrome browsers
- Uses Chrome's sync storage for seamless cross-device access
- Size limits are enforced (5KB per collection) to ensure sync compatibility

## Functionality Review

### ✅ Fully Functional Components:
1. **Tab Collection Management**
   - Save current tabs to named collections
   - View all saved collections
   - Open individual tabs or entire collections
   - Delete individual tabs or whole collections
   - Size limit enforcement for sync compatibility

2. **User Interface**
   - Clean and intuitive popup interface
   - Responsive design with proper styling
   - Clear feedback for user actions
   - Favicon support for visual tab identification
   - Confirmation dialogs for destructive actions

3. **Data Management**
   - Chrome sync storage integration
   - Automatic tab metadata saving (URL, title, favicon)
   - Collection size limit checks (5KB) for sync compatibility
   - Efficient data compression (storing minimal required data)
   - Error handling for storage operations

4. **Background Processing**
   - Proper installation handling
   - Error management
   - Cross-browser sync support
   - Automatic state management
   - Event handling for tab operations

5. **Security & Permissions**
   - Appropriate permissions model
   - Secure storage handling
   - Cross-origin security compliance
   - Safe URL handling
   - User data protection

### Technical Implementation
- Uses modern JavaScript async/await patterns
- Implements event delegation for efficient DOM handling
- Provides graceful error handling and user feedback
- Maintains clean separation of concerns between UI and data management
- Optimizes storage usage through data compression

## Project Structure
