import { FSWatcher, watch } from 'chokidar'
import { BrowserWindow } from 'electron'

const watchers = new Map<string, FSWatcher>()

export function watchFile(filePath: string, window: BrowserWindow): void {
  // Stop existing watcher if any
  if (watchers.has(filePath)) {
    watchers.get(filePath)?.close()
  }
  
  // Create new watcher
  const watcher = watch(filePath, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100
    }
  })
  
  watcher.on('change', () => {
    window.webContents.send('fs:fileChanged', filePath)
  })
  
  watcher.on('error', (error) => {
    console.error(`Error watching file ${filePath}:`, error)
  })
  
  watchers.set(filePath, watcher)
}

export function unwatchFile(filePath: string): void {
  const watcher = watchers.get(filePath)
  if (watcher) {
    watcher.close()
    watchers.delete(filePath)
  }
}

export function unwatchAll(): void {
  for (const watcher of watchers.values()) {
    watcher.close()
  }
  watchers.clear()
}