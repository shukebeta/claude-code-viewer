# Claude Session Viewer

View your Claude Code conversations in a dedicated desktop app with real-time updates, searchable history, and powerful navigation tools.

## ✨ Features

### 📁 Project Management
- Automatically discovers all Claude projects from `~/.claude/projects/`
- Project list with session counts and last activity timestamps
- Quick navigation between projects and sessions

### 💬 Session Viewing
- **Real-time Updates** - Sessions update automatically as Claude works
- **Collapsible Messages** - Expandable user messages and tool outputs
- **Syntax Highlighting** - Code blocks with automatic language detection
- **Tool-specific Rendering** - Custom displays for Bash, File operations, and Search tools

### 🎯 Navigation
- **Timeline Minimap** - Visual overview of conversation with click-to-jump navigation
- **Tab System** - Multiple sessions in tabs with dynamic sizing
- **Recent Sessions** - Quick access to latest conversations across all projects
- **Keyboard Shortcuts** - `Ctrl+W` close tab, `Ctrl+N` new tab, `Ctrl+B` toggle sidebar
- **Claude CLI Integration** - Open current session directly from Claude CLI with `claude-viewer` command

### 🎨 Design
- Matches Claude's design system
- Light and dark mode support
- Responsive layout
- Minimal, focused interface

## 🚀 Installation

### Installing the App
```bash
# Install dependencies
npm install

# Build the app
npm run build

# Package for your platform
npm run dist:mac   # For macOS
npm run dist:win   # For Windows
npm run dist:linux # For Linux
```

### Installing Claude CLI Integration
After building the app, install the CLI integration:

```bash
# Run the install script
./install-cli.sh
```

This will:
- Install the necessary dependencies
- Create a global `claude-viewer` command
- Configure deep linking for the app

## 🎮 Usage

### From Claude CLI
When inside a Claude CLI session (where `CLAUDECODE=1`):

```bash
# Open the current session in Claude Session Viewer
claude-viewer
```

The app will automatically:
1. Detect your current working directory
2. Find the matching Claude project
3. Locate the most recent session
4. Open the Session Viewer with that session loaded

### Manual Usage
You can also use the app standalone:
1. Open Claude Session Viewer
2. Browse projects and sessions
3. Click any session to view

## 🛠️ Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Package for distribution
npm run dist
```

## 📦 Tech Stack

- **Electron** - Desktop application framework
- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Zustand** - State management
- **Tailwind CSS v4** - Styling

## 🤝 Contributing

Contributions are welcome. Please open issues or submit pull requests.

## 📄 License

MIT License