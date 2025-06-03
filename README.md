# 🔍 Claude Code Viewer

Claude Code Viewer brings your Claude Code sessions to life in a clear, structured web-based interface.

- Beautifully renders markdown, code, and long outputs for easier reading.
- Hover to preview sessions and navigate instantly.
- Compact, collapsible chat flows for streamlined context.
- Seamlessly switch from viewer to Claude CLI for direct edits.

The best bridge between your terminal and a smarter, clearer session workflow.

## ✨ Features

### 📁 Project & Session Management
- **Auto-discovery** - Automatically finds all Claude projects from `~/.claude/projects/`
- **Smart sorting** - Sessions sorted by modification time, grouped by date (Today, Yesterday, etc.)
- **Session preview** - Hover to preview conversation content (can be disabled in settings)
- **Real-time updates** - Sessions refresh automatically as you work with Claude

### 💬 Advanced Message Rendering
- **Syntax highlighting** - Beautiful code blocks with language detection
- **Tool-specific displays** - Custom rendering for different tool types:
  - 📝 File operations (Read, Write, Edit)
  - 🔧 Bash commands with styled input/output/error
  - 🔍 Search results (Grep, Glob)
  - 🌐 Web operations
  - ✅ Todo management
- **Smart grouping** - Consecutive tool uses are grouped together
- **Collapsible content** - Long messages and tool outputs can be collapsed

### 🎯 Navigation & Interface
- **Multi-tab system** - Open multiple sessions across different projects
- **Timeline minimap** - Visual overview with click-to-jump navigation
- **Keyboard shortcuts**:
  - `Ctrl/Cmd + W` - Close current tab
  - `Ctrl/Cmd + B` - Toggle sidebar
- **Responsive design** - Adapts to different window sizes
- **Dark/Light themes** - Matches Claude's design system

## 🚀 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- macOS, Windows, or Linux

### Build & Install

```bash
# Clone and install dependencies
git clone https://github.com/yourusername/claude-code-viewer.git
cd claude-code-viewer
npm install

# Build the application
npm run build

# Package for your platform
npm run dist:mac    # macOS (creates .dmg)
```

### 🔗 Claude CLI Integration

Enable the `claude-viewer` command in Claude CLI:

```bash
# Run the installation script
./install-cli.sh

# Or manually install
cd cli
npm install
npm link
```

## 💻 Usage

### From Claude CLI
When working in a Claude session (`CLAUDECODE=1`):

```bash
# Opens current session instantly
claude-viewer

# Output:
# Project: /Users/you/your-project
# Session: abc123def456
```

### Standalone App
1. Launch Claude Session Viewer
2. Select a project from the sidebar
3. Click any session to view
4. Use tabs to open multiple sessions

### ⚙️ Settings
- **Custom Resume Command** - Configure how sessions open in Claude CLI
- **Session Preview** - Toggle hover previews on/off

## 🛠️ Development

```bash
# Development with hot reload
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Run tests
npm test
```

### Project Structure
```
claude-session-viewer/
├── electron/          # Main process
├── src/              # Renderer process (React app)
│   ├── components/   # UI components
│   ├── store/        # Zustand state management
│   └── utils/        # Helper functions
├── cli/              # CLI integration
└── release/          # Built applications
```

## 🔧 Tech Stack

- **Electron** - Cross-platform desktop framework
- **React 18** - UI library with hooks
- **TypeScript** - Type safety and better DX
- **Vite** - Lightning fast build tool
- **Tailwind CSS v4** - Utility-first styling
- **Zustand** - Lightweight state management

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

Made with ❤️ for the Claude community
