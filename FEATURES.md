# Claude Session Viewer - Features Documentation

## Overview
Claude Session Viewer is an Electron-based application for browsing and viewing Claude Code session files. It provides a comprehensive interface for exploring conversation history with enhanced UI features and keyboard shortcuts.

## Core Features

### 1. Application Architecture
- **Electron App**: Desktop application built with Electron, React, and TypeScript
- **Theme Support**: Full light/dark theme support with system preference detection
- **Responsive Design**: Adaptive layout that adjusts to window size
- **Live Updates**: Real-time file watching for active sessions

### 2. Sidebar Navigation
- **Collapsible Sidebar**: Toggle with Ctrl/Cmd+B or collapse button
  - When collapsed, shows minimal button to reopen
  - Fixed width of 240px when expanded
  - Smooth transition animations
- **Project List**: Displays all projects in the projects directory
  - Shows project names and session counts
  - Click to view project sessions
- **Search Bar**: Search functionality placeholder (visual only)
- **Traffic Light Integration**: macOS-style window controls

### 3. Tab Management
- **Multi-tab Interface**: Open multiple sessions simultaneously
  - Maximum 10 tabs supported
  - Dynamic tab width based on count (240px max, 120px min)
  - Tab labels truncate with ellipsis when needed
- **Tab Types**:
  - Dashboard tabs (with bar chart icon)
  - Session tabs (shows first 8 chars of session ID)
  - Project tabs (with folder icon)
  - New tabs (with plus icon)
- **Tab Controls**:
  - Click to switch between tabs
  - X button to close tabs (hidden if only 1 tab)
  - Plus button to create new tabs
  - Ctrl/Cmd+W to close current tab
  - Ctrl/Cmd+N to create new tab
- **Smart Tab Behavior**: Prevents duplicate tabs for same session

### 4. Dashboard View
- **Welcome Screen**: Shows when no session is selected
  - Large file icon
  - Application title and description
  - Project count indicator
- **Recent Sessions**: Lists up to 20 most recent sessions across all projects
  - Shows project name, session ID, timestamp
  - Preview text (first 2 lines of conversation)
  - Message count and total cost
  - Click to open session in new tab
  - Hover effects for better interactivity

### 5. Session Viewer
- **Header Section**:
  - Project/Session name display
  - Auto-scroll toggle checkbox
  - Live/Offline status indicator with colored dot
- **Message Display**:
  - User messages (blue dot indicator)
  - Assistant messages (purple dot indicator)
  - Tool messages (compact display with specialized rendering)
  - Timestamps for each message
  - Cost display when available
- **Content Rendering**:
  - Full Markdown support with syntax highlighting
  - Code blocks with language detection
  - Copy button for code snippets
  - Line numbers for code blocks > 5 lines
  - Proper list formatting (bullets and numbered)
  - Inline code styling

### 6. Tool Message Rendering
- **Improved Tool Components**: Specialized rendering for each tool type
- **Tool Categories**:
  - **Terminal Tools**: Bash commands with green accent
  - **File Operations**: Read, Write, Edit, MultiEdit with distinct colors
  - **Search Tools**: Grep, Glob, LS with search-focused UI
  - **Web Tools**: WebSearch, WebFetch with globe icons
  - **Task Management**: TodoRead, TodoWrite with task icons
  - **Notebook Tools**: NotebookRead, NotebookEdit for Jupyter support
- **Tool Features**:
  - Colored icons and backgrounds for each tool type
  - Compact mode by default (expandable for details)
  - Error state handling with red accents
  - Success indicators
  - Parameter display
  - Result formatting

### 7. Timeline Navigation
- **Visual Timeline**: Appears on hover at right edge
  - Vertical timeline showing all messages
  - Color-coded dots (blue=user, purple=assistant, yellow=tool)
  - Active message highlighted with larger dot
  - Click any dot to jump to that message
  - Smooth scrolling animation
  - Time labels for message groups
- **Timeline Behavior**:
  - Hidden by default (opacity 0)
  - Appears on hover with slide-in animation
  - Shows tooltips with message type and time
  - Tracks current scroll position

### 8. Collapsible Messages
- **Long Message Handling**: User messages > 6 lines are collapsible
  - Shows first 6 lines by default
  - "Show X more lines" button
  - Smooth expand/collapse animation
  - Preserves formatting and whitespace

### 9. Code Block Features
- **Syntax Highlighting**: Language-specific highlighting
- **Theme Support**: Different styles for light/dark themes
- **Copy Functionality**: 
  - Copy button in header
  - Check mark confirmation on copy
  - 2-second feedback timeout
- **Line Numbers**: Automatic for blocks > 5 lines
- **Language Display**: Shows detected language in header

### 10. Keyboard Shortcuts
- **Ctrl/Cmd+B**: Toggle sidebar
- **Ctrl/Cmd+W**: Close current tab
- **Ctrl/Cmd+N**: Create new tab
- **-**: Decrease font size (zoom out, min 10px)
- **+/=**: Increase font size (zoom in, max 24px)
- **0**: Reset font size to default (16px)

### 11. Theme System
- **Light/Dark Modes**: Full theme support
- **Theme Toggle**: Sun/Moon icon in tab bar
- **System Integration**: Follows system theme by default
- **CSS Variables**: Comprehensive variable system for colors
  - --background, --foreground
  - --primary, --secondary
  - --muted, --muted-foreground
  - --border, --destructive
  - Tool-specific color variables

### 12. Live File Watching
- **Auto-refresh**: Sessions update when files change
- **Status Indicator**: Shows Live/Offline status
- **File Watcher**: Monitors active session files
- **Immediate Updates**: New messages appear instantly

### 13. Session List View
- **Project Sessions**: Shows all sessions for selected project
- **Session Cards**: 
  - Session ID and timestamp
  - Message count and cost
  - Preview text
  - Click to open in tab

### 14. Search and Navigation
- **Project Search**: Visual search bar in sidebar (UI only)
- **Timeline Jump**: Click timeline dots to navigate
- **Smooth Scrolling**: All navigation uses smooth scroll
- **Auto-scroll**: Optional automatic scrolling to bottom

### 15. Performance Features
- **Lazy Loading**: Sessions load on demand
- **Message Refs**: Efficient scroll tracking
- **Optimized Rendering**: React memo for heavy components
- **Tab Limits**: Maximum 10 tabs to prevent overload

## Edge Cases and Behaviors

### Tab Management Edge Cases
- When closing the last tab, no tab is selected
- When closing active tab, selects nearest tab
- Duplicate session prevention
- Tab overflow handling with dynamic widths

### Message Display Edge Cases
- Empty messages show "No content available"
- Tool messages without names show generic "Tool" label
- Missing timestamps handled gracefully
- Zero cost not displayed

### Timeline Edge Cases
- Empty sessions show no timeline
- Single message sessions show single dot
- Very long sessions scale timeline appropriately
- Handles rapid message updates

### Theme Edge Cases
- Code blocks adapt to theme changes
- Tool colors remain visible in both themes
- Preserves theme preference across sessions

## Testing Scenarios

### Basic Navigation
1. Open app → Should show dashboard with recent sessions
2. Click project → Should show project sessions
3. Click session → Should open in new tab
4. Switch tabs → Should preserve scroll position
5. Close tab → Should activate adjacent tab

### Keyboard Shortcuts
1. Press Ctrl+B → Sidebar should toggle
2. Press Ctrl+W → Current tab should close
3. Press Ctrl+N → New tab should open
4. Press - → Font should decrease
5. Press + → Font should increase
6. Press 0 → Font should reset

### Tool Messages
1. View Bash command → Should show green terminal UI
2. View file read → Should show blue file icon
3. View search results → Should show search UI
4. Tool errors → Should show red error state

### Live Updates
1. Open active session → Should show "Live" status
2. Modify session file → Should see new messages
3. Close session externally → Status changes to "Offline"

### Theme Testing
1. Toggle theme → All elements should adapt
2. Code blocks → Should use appropriate syntax theme
3. Tool messages → Colors should remain distinguishable

### Performance Testing
1. Open large session (1000+ messages) → Should load smoothly
2. Rapid tab switching → No lag or memory leaks
3. Timeline navigation → Smooth scrolling
4. Multiple sessions → Memory usage reasonable