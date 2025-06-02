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
    const projectName = this.pathToProjectName(pwd);
    const projectPath = path.join(this.claudeProjectsPath, projectName);

    if (fs.existsSync(projectPath) && fs.statSync(projectPath).isDirectory()) {
      return projectPath;
    }

    console.log(`Looking for project: ${projectName}`);
    console.log('Available projects:');
    try {
      const projects = fs.readdirSync(this.claudeProjectsPath);
      projects.forEach(project => {
        if (fs.statSync(path.join(this.claudeProjectsPath, project)).isDirectory()) {
          console.log(`  - ${project}`);
        }
      });
    } catch (error) {
      console.error('Failed to list projects:', error);
    }

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
    console.log(`Current directory: ${pwd}`);

    const projectDir = this.findMatchingProject(pwd);
    if (!projectDir) {
      console.error('No matching Claude project found for current directory');
      return null;
    }

    console.log(`Found project: ${projectDir}`);

    const session = this.findMostRecentSession(projectDir);
    if (session) {
      console.log(`Found most recent session: ${session.sessionId}`);
      return session;
    }

    console.error('No active session found');
    return null;
  }
}

// 메인 로직
const finder = new SessionFinder();
const sessionInfo = finder.findCurrentSession();

if (!sessionInfo) {
  console.error('No active Claude session found in current directory');
  console.log('Make sure you are in a directory with an active Claude session');
  process.exit(1);
}

// Deep link URL 생성
const deepLink = `claude-viewer://open?sessionId=${encodeURIComponent(sessionInfo.sessionId)}&projectPath=${encodeURIComponent(sessionInfo.projectPath)}&jsonlFile=${encodeURIComponent(sessionInfo.jsonlFile)}`;

console.log(`Opening Claude Session Viewer...`);
console.log(`Session ID: ${sessionInfo.sessionId}`);
console.log(`Project: ${path.basename(sessionInfo.projectPath)}`);

// macOS에서 deep link 열기
const openCommand = process.platform === 'darwin' ? 'open' : 
                   process.platform === 'win32' ? 'start' : 'xdg-open';

const child = spawn(openCommand, [deepLink], {
  detached: true,
  stdio: 'ignore'
});

child.unref();

// 앱이 열릴 시간을 주고 종료
setTimeout(() => {
  console.log('Claude Session Viewer should now be open with your session');
  process.exit(0);
}, 1000);