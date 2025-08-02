import { app, BrowserWindow, ipcMain, shell, protocol, Menu, globalShortcut } from 'electron'
import { join } from 'path'
import { homedir } from 'os'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { getProjects, getSessions, readSessionFile } from './fileSystem'
import { watchFile, unwatchFile, unwatchAll } from './fileWatcher'
import { installCLI } from './cliInstaller'

console.log('[Main] Starting Electron app...')
console.log('[Main] Process argv:', process.argv)
console.log('[Main] Is dev:', is.dev)
console.log('[Main] ELECTRON_RENDERER_URL:', process.env['ELECTRON_RENDERER_URL'])

let mainWindow: BrowserWindow | null = null
let deepLinkUrl: string | null = null
const windows = new Set<BrowserWindow>()

// Deep link protocol 설정
const PROTOCOL_PREFIX = 'claude-viewer'

// Deep link URL 파싱
function parseDeepLink(url: string): { sessionId?: string; projectPath?: string; jsonlFile?: string } {
  try {
    const urlObj = new URL(url)
    const params = new URLSearchParams(urlObj.search)
    return {
      sessionId: params.get('sessionId') || undefined,
      projectPath: params.get('projectPath') || undefined,
      jsonlFile: params.get('jsonlFile') || undefined
    }
  } catch (error) {
    console.error('Failed to parse deep link:', error)
    return {}
  }
}

function createMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Window',
          accelerator: 'Cmd+N',
          click: () => {
            createWindow()
          }
        },
        {
          label: 'New Tab',
          accelerator: 'Cmd+T',
          click: () => {
            // Send to focused window
            const focusedWindow = BrowserWindow.getFocusedWindow()
            if (focusedWindow) {
              focusedWindow.webContents.send('menu-new-tab')
            }
          }
        },
        {
          label: 'Close Tab',
          accelerator: 'Cmd+W',
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow()
            if (focusedWindow) {
              focusedWindow.webContents.send('menu-close-tab')
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Close Window',
          accelerator: 'Cmd+Shift+W',
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow()
            if (focusedWindow) {
              focusedWindow.close()
            }
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'Cmd+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'Shift+Cmd+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'Cmd+X', role: 'cut' },
        { label: 'Copy', accelerator: 'Cmd+C', role: 'copy' },
        { label: 'Paste', accelerator: 'Cmd+V', role: 'paste' },
        { label: 'Select All', accelerator: 'Cmd+A', role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Sidebar',
          accelerator: 'Cmd+B',
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow()
            if (focusedWindow) {
              focusedWindow.webContents.send('menu-toggle-sidebar')
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Zoom In',
          accelerator: 'CommandOrControl+Plus',
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow()
            if (focusedWindow) {
              const currentZoom = focusedWindow.webContents.getZoomFactor()
              focusedWindow.webContents.setZoomFactor(currentZoom + 0.1)
            }
          }
        },
        {
          label: 'Zoom Out', 
          accelerator: 'CommandOrControl+-',
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow()
            if (focusedWindow) {
              const currentZoom = focusedWindow.webContents.getZoomFactor()
              focusedWindow.webContents.setZoomFactor(Math.max(0.5, currentZoom - 0.1))
            }
          }
        },
        {
          label: 'Reset Zoom',
          accelerator: 'CommandOrControl+0',
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow()
            if (focusedWindow) {
              focusedWindow.webContents.setZoomFactor(1.0)
            }
          }
        },
        { type: 'separator' },
        { label: 'Reload', accelerator: 'Cmd+R', role: 'reload' },
        { label: 'Force Reload', accelerator: 'Cmd+Shift+R', role: 'forceReload' },
        { type: 'separator' },
        { label: 'Toggle Developer Tools', accelerator: 'F12', role: 'toggleDevTools' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { label: 'Minimize', accelerator: 'Cmd+M', role: 'minimize' },
        { label: 'Close Window', accelerator: 'Cmd+Shift+W', role: 'close' }
      ]
    }
  ]

  if (process.platform === 'darwin') {
    // macOS specific menu
    template.unshift({
      label: app.getName(),
      submenu: [
        { label: 'About ' + app.getName(), role: 'about' },
        { type: 'separator' },
        { label: 'Services', role: 'services', submenu: [] },
        { type: 'separator' },
        { label: 'Hide ' + app.getName(), accelerator: 'Cmd+H', role: 'hide' },
        { label: 'Hide Others', accelerator: 'Cmd+Shift+H', role: 'hideOthers' },
        { label: 'Show All', role: 'unhide' },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'Cmd+Q', role: 'quit' }
      ]
    })

    // Window menu adjustments for macOS
    const windowMenu = template.find(menu => menu.label === 'Window')
    if (windowMenu && windowMenu.submenu && Array.isArray(windowMenu.submenu)) {
      windowMenu.submenu = [
        { label: 'Minimize', accelerator: 'Cmd+M', role: 'minimize' },
        { label: 'Zoom', role: 'zoom' },
        { type: 'separator' },
        { label: 'Bring All to Front', role: 'front' }
      ]
    }
  }

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

function createWindow(deepLink?: string): void {
  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 400,
    minHeight: 300,
    show: false,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 20, y: 20 },
    backgroundColor: '#262624',
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  windows.add(window)
  
  window.on('ready-to-show', () => {
    window.show()
    
    // 개발 모드에서는 개발자 도구 자동 열기
    if (is.dev) {
      window.webContents.openDevTools()
    }
  })
  
  window.on('focus', () => {
    // 창이 포커스될 때 로컬 단축키 등록
    globalShortcut.register('CommandOrControl+-', () => {
      const currentZoom = window.webContents.getZoomFactor()
      window.webContents.setZoomFactor(Math.max(0.5, currentZoom - 0.1))
    })
    
    globalShortcut.register('CommandOrControl+=', () => {
      const currentZoom = window.webContents.getZoomFactor()
      window.webContents.setZoomFactor(currentZoom + 0.1)
    })
    
    globalShortcut.register('CommandOrControl+0', () => {
      window.webContents.setZoomFactor(1.0)
    })
  })
  
  window.on('blur', () => {
    // 창이 포커스를 잃으면 단축키 해제
    globalShortcut.unregister('CommandOrControl+-')
    globalShortcut.unregister('CommandOrControl+=')
    globalShortcut.unregister('CommandOrControl+0')
  })
  
  window.on('closed', () => {
    windows.delete(window)
    if (window === mainWindow) {
      mainWindow = null
    }
  })

  window.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'))
  }
  
  if (!mainWindow) {
    mainWindow = window
  }

  // Deep link가 있으면 처리
  if (deepLink || deepLinkUrl) {
    handleDeepLink(deepLink || deepLinkUrl!, window)
    if (deepLinkUrl) deepLinkUrl = null
  }
  
  return window
}

// Deep link 처리 함수
function handleDeepLink(url: string, targetWindow?: BrowserWindow) {
  const params = parseDeepLink(url)
  console.log('Handling deep link:', params)
  
  const window = targetWindow || mainWindow
  
  if (!window) {
    console.log('No window available, storing deep link for later')
    deepLinkUrl = url
    return
  }
  
  if (params.sessionId || params.projectPath) {
    // 창을 포커스하고 보이게 하기
    try {
      if (window.isDestroyed()) {
        console.log('Window is destroyed, cannot handle deep link')
        return
      }
      
      if (window.isMinimized()) window.restore()
      window.show()
      window.focus()
      
      // webContents가 준비될 때까지 기다린 후 전송
      if (window.webContents.isLoading()) {
        console.log('Window is still loading, waiting...')
        window.webContents.once('did-finish-load', () => {
          console.log('Window loaded! Sending deep link to renderer:', params)
          if (!window.isDestroyed()) {
            window.webContents.send('deep-link-open', params)
            
            // 디버깅: 렌더러 프로세스에서 콘솔 로그 실행
            window.webContents.executeJavaScript(`
              console.log('[Renderer] Received deep-link-open event');
              console.log('[Renderer] Window.api available:', !!window.api);
              console.log('[Renderer] Current URL:', window.location.href);
            `)
          }
        })
      } else {
        console.log('Window is ready, sending deep link to renderer:', params)
        window.webContents.send('deep-link-open', params)
        
        // 디버깅: 렌더러 프로세스에서 콘솔 로그 실행
        window.webContents.executeJavaScript(`
          console.log('[Renderer] Received deep-link-open event');
          console.log('[Renderer] Window.api available:', !!window.api);
          console.log('[Renderer] Current URL:', window.location.href);
        `)
      }
    } catch (error) {
      console.error('Error handling deep link:', error)
    }
  }
}

// macOS를 위한 protocol 등록
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(PROTOCOL_PREFIX, process.execPath, [process.argv[1]])
  }
} else {
  app.setAsDefaultProtocolClient(PROTOCOL_PREFIX)
}

// Windows/Linux deep link 처리
const gotTheLock = app.requestSingleInstanceLock()

console.log('[Main] Got the lock:', gotTheLock)

if (!gotTheLock) {
  console.log('[Main] Another instance is running, quitting...')
  app.quit()
} else {
  console.log('[Main] This is the first instance')
  app.on('second-instance', (_, commandLine) => {
    // 이미 실행 중인 인스턴스가 있을 때
    // Deep link URL 찾기
    const url = commandLine.find((arg) => arg.startsWith(`${PROTOCOL_PREFIX}://`))
    if (url) {
      // Deep link가 있으면 새 창에서 열기
      createWindow(url)
    } else if (mainWindow) {
      // Deep link가 없으면 기존 창 활성화
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

// macOS deep link 처리
app.on('open-url', (event, url) => {
  event.preventDefault()
  if (app.isReady()) {
    handleDeepLink(url)
  } else {
    deepLinkUrl = url
  }
})

app.whenReady().then(() => {
  console.log('[Main] App is ready!')
  electronApp.setAppUserModelId('com.mainpy.claude-code-viewer')

  // 메뉴 생성
  createMenu()

  // CLI 설치 시도 (macOS만)
  if (process.platform === 'darwin' && app.isPackaged) {
    installCLI()
  }

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  console.log('[Main] All windows closed')
  unwatchAll()
  if (process.platform !== 'darwin') {
    console.log('[Main] Not macOS, quitting app')
    app.quit()
  }
})

// IPC handlers
ipcMain.handle('fs:readDirectory', async (_, path: string) => {
  if (path === 'projects') {
    return getProjects()
  } else {
    return getSessions(path)
  }
})

ipcMain.handle('fs:getProjects', async () => {
  return getProjects()
})

ipcMain.handle('fs:getSessions', async (_, projectPath: string) => {
  return getSessions(projectPath)
})

ipcMain.handle('fs:readFile', async (_, path: string) => {
  return readSessionFile(path)
})

ipcMain.on('fs:watchFile', (event, path: string) => {
  const window = BrowserWindow.fromWebContents(event.sender)
  if (window) {
    watchFile(path, window)
  }
})

ipcMain.on('fs:unwatchFile', (_, path: string) => {
  unwatchFile(path)
})

ipcMain.handle('path:getHome', () => {
  return homedir()
})

ipcMain.handle('path:join', (_, ...paths: string[]) => {
  return join(...paths)
})

ipcMain.handle('app:getVersion', () => {
  return app.getVersion()
})