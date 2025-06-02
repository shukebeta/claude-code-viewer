import { app, BrowserWindow, ipcMain, shell, protocol } from 'electron'
import { join } from 'path'
import { homedir } from 'os'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { getProjects, getSessions, readSessionFile } from './fileSystem'
import { watchFile, unwatchFile, unwatchAll } from './fileWatcher'
import { installCLI } from './cliInstaller'

let mainWindow: BrowserWindow | null = null
let deepLinkUrl: string | null = null

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

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 400,
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

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    
    // 개발 모드에서는 개발자 도구 자동 열기
    if (is.dev) {
      mainWindow?.webContents.openDevTools()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Deep link가 있으면 처리
  if (deepLinkUrl) {
    handleDeepLink(deepLinkUrl)
    deepLinkUrl = null
  }
}

// Deep link 처리 함수
function handleDeepLink(url: string) {
  const params = parseDeepLink(url)
  console.log('Handling deep link:', params)
  
  if (!mainWindow) {
    console.log('Main window not ready, storing deep link for later')
    deepLinkUrl = url
    return
  }
  
  if (params.sessionId) {
    // 창을 포커스하고 보이게 하기
    try {
      if (mainWindow.isDestroyed()) {
        console.log('Window is destroyed, cannot handle deep link')
        return
      }
      
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
      
      // webContents가 준비될 때까지 기다린 후 전송
      if (mainWindow.webContents.isLoading()) {
        console.log('Window is still loading, waiting...')
        mainWindow.webContents.once('did-finish-load', () => {
          console.log('Window loaded! Sending deep link to renderer:', params)
          if (!mainWindow?.isDestroyed()) {
            mainWindow!.webContents.send('deep-link-open', params)
            
            // 디버깅: 렌더러 프로세스에서 콘솔 로그 실행
            mainWindow!.webContents.executeJavaScript(`
              console.log('[Renderer] Received deep-link-open event');
              console.log('[Renderer] Window.api available:', !!window.api);
              console.log('[Renderer] Current URL:', window.location.href);
            `)
          }
        })
      } else {
        console.log('Window is ready, sending deep link to renderer:', params)
        mainWindow.webContents.send('deep-link-open', params)
        
        // 디버깅: 렌더러 프로세스에서 콘솔 로그 실행
        mainWindow.webContents.executeJavaScript(`
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

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (_, commandLine) => {
    // 이미 실행 중인 인스턴스가 있을 때
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
      
      // Deep link URL 찾기
      const url = commandLine.find((arg) => arg.startsWith(`${PROTOCOL_PREFIX}://`))
      if (url) {
        handleDeepLink(url)
      }
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
  electronApp.setAppUserModelId('com.claude.session-viewer')

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
  unwatchAll()
  if (process.platform !== 'darwin') {
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

ipcMain.on('fs:watchFile', (_, path: string) => {
  if (mainWindow) {
    watchFile(path, mainWindow)
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