#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// CLAUDECODE 환경변수 확인
if (process.env.CLAUDECODE !== '1') {
  console.error('Error: This command must be run inside Claude CLI (CLAUDECODE=1)');
  process.exit(1);
}

// 세션 찾기 로직
class SessionFinder {
  constructor() {
    this.claudeProjectsPath = path.join(os.homedir(), '.claude', 'projects');
  }

  getCurrentDirectory() {
    try {
      return execSync('pwd', { encoding: 'utf-8' }).trim();
    } catch (error) {
      console.error('Failed to get current directory:', error);
      return process.cwd();
    }
  }

  pathToProjectName(dirPath) {
    return dirPath.replace(/\//g, '-').replace(/_/g, '-');
  }

  findMatchingProject(pwd) {
    // 현재 디렉토리부터 시작해서 상위 폴더들을 차례로 확인
    let currentPath = pwd;
    const checkedPaths = [];
    
    while (currentPath && currentPath !== '/' && currentPath !== path.dirname(currentPath)) {
      const projectName = this.pathToProjectName(currentPath);
      const projectPath = path.join(this.claudeProjectsPath, projectName);
      
      checkedPaths.push(projectName);
      
      if (fs.existsSync(projectPath) && fs.statSync(projectPath).isDirectory()) {
        // Don't log here, will log in main
        return { projectPath, originalPath: currentPath };
      }
      
      // 상위 디렉토리로 이동
      currentPath = path.dirname(currentPath);
    }

    // 찾지 못한 경우 - 간단한 에러 메시지만
    console.error(`Error: No Claude project found for current directory`);

    return null;
  }

  findMostRecentSession(projectDir) {
    const jsonlFiles = fs.readdirSync(projectDir).filter(f => f.endsWith('.jsonl'));
    let mostRecent = null;
    let mostRecentTime = new Date(0);

    for (const jsonlFile of jsonlFiles) {
      const filePath = path.join(projectDir, jsonlFile);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());

        // 마지막 줄부터 확인
        for (let i = lines.length - 1; i >= 0; i--) {
          try {
            const data = JSON.parse(lines[i]);
            const timestamp = new Date(data.timestamp);

            if (timestamp > mostRecentTime && data.sessionId) {
              mostRecentTime = timestamp;
              mostRecent = {
                sessionId: data.sessionId,
                projectPath: projectDir,
                jsonlFile: filePath,
                timestamp: data.timestamp
              };
              break;
            }
          } catch (error) {
            continue;
          }
        }
      } catch (error) {
        console.error(`Failed to read file ${filePath}:`, error);
      }
    }

    return mostRecent;
  }

  findCurrentSession() {
    const pwd = this.getCurrentDirectory();

    const projectInfo = this.findMatchingProject(pwd);
    if (!projectInfo) {
      return null;
    }

    const session = this.findMostRecentSession(projectInfo.projectPath);
    if (session) {
      return {
        ...session,
        originalPath: projectInfo.originalPath
      };
    }

    console.error('Error: No active session found');
    return null;
  }
}

// 메인 로직
const finder = new SessionFinder();
const sessionInfo = finder.findCurrentSession();

if (!sessionInfo) {
  process.exit(1);
}

// Deep link URL 생성
const deepLink = `claude-viewer://open?sessionId=${encodeURIComponent(sessionInfo.sessionId)}&projectPath=${encodeURIComponent(sessionInfo.projectPath)}&jsonlFile=${encodeURIComponent(sessionInfo.jsonlFile)}`;

// 깔끔한 출력 - Project와 Session ID만
console.log(`\nProject: ${sessionInfo.originalPath}`);
console.log(`Session: ${sessionInfo.sessionId}\n`);

// 개발 모드 확인 (환경변수 또는 --dev 플래그)
const isDev = process.argv.includes('--dev') || process.env.CLAUDE_VIEWER_DEV === '1';

if (isDev) {
  // 개발 서버에 HTTP 요청으로 세션 정보 전달
  const http = require('http');
  const url = new URL(deepLink);
  const params = new URLSearchParams(url.search);
  
  const devUrl = `http://localhost:5173/dev-open?${params.toString()}`;
  
  // 브라우저로 개발 서버 URL 열기
  const openCommand = process.platform === 'darwin' ? 'open' : 
                     process.platform === 'win32' ? 'start' : 'xdg-open';
  
  const child = spawn(openCommand, [devUrl], {
    detached: true,
    stdio: 'ignore'
  });
  
  child.unref();
} else {
  // macOS에서 deep link 열기
  const openCommand = process.platform === 'darwin' ? 'open' : 
                     process.platform === 'win32' ? 'start' : 'xdg-open';
  
  const child = spawn(openCommand, [deepLink], {
    detached: true,
    stdio: 'ignore'
  });
  
  child.unref();
}

// 앱이 열릴 시간을 주고 종료
setTimeout(() => {
  process.exit(0);
}, 1000);