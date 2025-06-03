# Claude Session Viewer

Desktop app for viewing Claude conversations with real-time updates.

## Features

- **Real-time session updates** - Auto-refreshes as you work
- **Project organization** - Browse all Claude projects and sessions
- **Smart rendering** - Syntax highlighting, collapsible messages, tool-specific displays
- **Multi-tab interface** - Open multiple sessions simultaneously
- **CLI integration** - Run `claude-viewer` from Claude CLI to open current session
- **Session preview** - Hover to preview session contents (toggleable)
- **Timeline navigation** - Visual minimap with click-to-jump

## Installation

```bash
# Install and build
npm install
npm run build

# Package app
npm run dist:mac    # macOS
npm run dist:win    # Windows  
npm run dist:linux  # Linux

# Install CLI integration
./install-cli.sh
```

## Usage

### From Claude CLI
```bash
claude-viewer  # Opens current session
```

### Standalone
Open the app and browse projects/sessions directly.

## Development

```bash
npm run dev   # Development mode
npm run build # Production build
```

## Tech Stack

- Electron + React + TypeScript
- Vite + Tailwind CSS v4
- Zustand state management

## License

MIT