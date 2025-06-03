#!/usr/bin/env ts-node

import { SessionFinder } from './src/utils/sessionFinder'
import { spawn } from 'child_process'
import * as path from 'path'

// CLAUDECODE 환경변수 확인
if (process.env.CLAUDECODE !== '1') {
  // Claude CLI 밖에서 실행된 경우 현재 프로젝트의 세션들을 보여주는 앱 열기
  const currentProjectPath = process.cwd()
  const deepLink = `claude-viewer://open?projectPath=${encodeURIComponent(currentProjectPath)}`
  
  console.log(`Opening Claude Session Viewer for project: ${path.basename(currentProjectPath)}`)
  
  // macOS에서 deep link 열기
  const openCommand = process.platform === 'darwin' ? 'open' : 
                     process.platform === 'win32' ? 'start' : 'xdg-open'
  
  const child = spawn(openCommand, [deepLink], {
    detached: true,
    stdio: 'ignore'
  })
  
  child.unref()
  
  // 앱이 열릴 시간을 주고 종료
  setTimeout(() => {
    process.exit(0)
  }, 1000)
}

// 세션 찾기
const finder = new SessionFinder()
const sessionInfo = finder.findCurrentSession({ 
  keyword: 'claude-viewer',
  seconds: 30 
})

if (!sessionInfo) {
  console.error('No active Claude session found in current directory')
  console.log('Make sure you are in a directory with an active Claude session')
  process.exit(1)
}

// Deep link URL 생성
const deepLink = `claude-viewer://open?sessionId=${encodeURIComponent(sessionInfo.sessionId)}&projectPath=${encodeURIComponent(sessionInfo.projectPath)}&jsonlFile=${encodeURIComponent(sessionInfo.jsonlFile)}`

console.log(`Opening Claude Session Viewer...`)
console.log(`Session ID: ${sessionInfo.sessionId}`)
console.log(`Project: ${path.basename(sessionInfo.projectPath)}`)

// macOS에서 deep link 열기
const openCommand = process.platform === 'darwin' ? 'open' : 
                   process.platform === 'win32' ? 'start' : 'xdg-open'

const child = spawn(openCommand, [deepLink], {
  detached: true,
  stdio: 'ignore'
})

child.unref()

// 앱이 열릴 시간을 주고 종료
setTimeout(() => {
  console.log('Claude Session Viewer should now be open with your session')
  process.exit(0)
}, 1000)