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

### 🎨 Design
- Matches Claude's design system
- Light and dark mode support
- Responsive layout
- Minimal, focused interface

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