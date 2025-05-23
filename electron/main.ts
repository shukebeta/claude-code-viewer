import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'
import { homedir } from 'os'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { getProjects, getSessions, readSessionFile } from './fileSystem'
import { watchFile, unwatchFile, unwatchAll } from './fileWatcher'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 400,
    show: false,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 20, y: 20 },
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
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
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.claude.session-viewer')

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