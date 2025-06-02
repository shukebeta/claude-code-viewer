import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

export function installCLI() {
  try {
    // CLI 설치 여부 확인
    const cliInstalled = fs.existsSync('/usr/local/bin/claude-viewer')
    
    if (cliInstalled) {
      // 이미 설치된 경우, 버전 확인
      const installedTarget = fs.readlinkSync('/usr/local/bin/claude-viewer')
      const expectedSource = path.join(app.getPath('exe'), '..', '..', 'Resources', 'cli', 'claude-viewer-cli.js')
      
      if (installedTarget === expectedSource) {
        console.log('CLI already installed and up to date')
        return
      }
    }

    // CLI 소스 경로
    const cliSource = app.isPackaged
      ? path.join(process.resourcesPath, 'cli', 'claude-viewer-cli.js')
      : path.join(__dirname, '..', 'cli', 'claude-viewer-cli.js')

    if (!fs.existsSync(cliSource)) {
      console.error('CLI source not found:', cliSource)
      return
    }

    // /usr/local/bin 디렉토리 생성
    try {
      execSync('mkdir -p /usr/local/bin', { stdio: 'ignore' })
    } catch (e) {
      console.error('Failed to create /usr/local/bin:', e)
    }

    // 기존 심볼릭 링크 제거
    if (fs.existsSync('/usr/local/bin/claude-viewer')) {
      try {
        fs.unlinkSync('/usr/local/bin/claude-viewer')
      } catch (e) {
        console.error('Failed to remove existing CLI:', e)
      }
    }

    // 새 심볼릭 링크 생성
    try {
      fs.symlinkSync(cliSource, '/usr/local/bin/claude-viewer')
      console.log('CLI installed successfully')
      
      // 사용자에게 알림 (선택사항)
      const { dialog } = require('electron')
      dialog.showMessageBox({
        type: 'info',
        title: 'CLI Installed',
        message: 'claude-viewer command has been installed.\nYou can now use it in Claude CLI.',
        buttons: ['OK']
      })
    } catch (e) {
      console.error('Failed to create CLI symlink:', e)
      
      // 권한 문제일 경우 사용자에게 수동 설치 안내
      const { dialog } = require('electron')
      dialog.showMessageBox({
        type: 'warning',
        title: 'CLI Installation',
        message: 'Could not automatically install CLI command.\nPlease run the following in terminal:\n\nsudo ln -s "' + cliSource + '" /usr/local/bin/claude-viewer',
        buttons: ['OK']
      })
    }
  } catch (error) {
    console.error('Error during CLI installation:', error)
  }
}