#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const readline = require('readline');

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
    // execSync('pwd') 대신 process.cwd() 사용 (보안 및 호환성 향상)
    return process.cwd();
  }

  pathToProjectName(dirPath) {
    // Windows의 ''와 Unix의 '/'를 모두 처리하도록 수정
    return dirPath.replace(/[/\\]/g, '-').replace(/_/g, '-');
  }

  findMatchingProject(pwd) {
    let currentPath = pwd;
    while (currentPath && currentPath !== path.dirname(currentPath)) {
      const projectName = this.pathToProjectName(currentPath);
      const projectPath = path.join(this.claudeProjectsPath, projectName);
      
      try {
        if (fs.existsSync(projectPath) && fs.statSync(projectPath).isDirectory()) {
          return { projectPath, originalPath: currentPath };
        }
      } catch (error) {
        // 권한 문제 등으로 statSync에서 에러가 날 수 있음
        console.error(`Warning: Could not access ${projectPath}`, error.message);
      }
      
      currentPath = path.dirname(currentPath);
    }

    console.error(`Error: No Claude project found for the current directory or its parents.`);
    return null;
  }

  async findMostRecentSession(projectDir) {
    let mostRecent = null;
    let mostRecentTime = new Date(0);

    try {
      const files = await fs.promises.readdir(projectDir);
      const jsonlFiles = files.filter(f => f.endsWith('.jsonl'));

      for (const jsonlFile of jsonlFiles) {
        const filePath = path.join(projectDir, jsonlFile);
        try {
          const fileStream = fs.createReadStream(filePath);
          const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
          });

          let lastValidLine = null;
          for await (const line of rl) {
            if (line.trim()) {
              try {
                const data = JSON.parse(line);
                if (data.sessionId && data.timestamp) {
                  lastValidLine = data;
                }
              } catch (e) {
                // 손상된 JSON 라인 무시
              }
            }
          }

          if (lastValidLine) {
            const timestamp = new Date(lastValidLine.timestamp);
            if (timestamp > mostRecentTime) {
              mostRecentTime = timestamp;
              mostRecent = {
                sessionId: lastValidLine.sessionId,
                projectPath: projectDir,
                jsonlFile: filePath,
                timestamp: lastValidLine.timestamp
              };
            }
          }
        } catch (error) {
          console.error(`Failed to read or process file ${filePath}:`, error);
        }
      }
    } catch (error) {
      console.error(`Failed to read project directory ${projectDir}:`, error);
    }

    return mostRecent;
  }

  async findCurrentSession() {
    const pwd = this.getCurrentDirectory();
    const projectInfo = this.findMatchingProject(pwd);
    
    if (!projectInfo) {
      return null;
    }

    const session = await this.findMostRecentSession(projectInfo.projectPath);
    if (session) {
      return {
        ...session,
        originalPath: projectInfo.originalPath
      };
    }

    console.error('Error: No active session found in project.');
    return null;
  }
}

async function main() {
  const finder = new SessionFinder();
  const sessionInfo = await finder.findCurrentSession();

  if (!sessionInfo) {
    process.exit(1);
  }

  const deepLink = `claude-viewer://open?sessionId=${encodeURIComponent(sessionInfo.sessionId)}&projectPath=${encodeURIComponent(sessionInfo.projectPath)}&jsonlFile=${encodeURIComponent(sessionInfo.jsonlFile)}`;
  
  // 원래 프로젝트 경로를 표시 (originalPath 사용)
  const projectDisplayName = sessionInfo.originalPath || path.basename(sessionInfo.projectPath);

  console.log(`\nProject: ${projectDisplayName}`);
  console.log(`Session: ${sessionInfo.sessionId}\n`);

  const isDev = process.argv.includes('--dev') || process.env.CLAUDE_VIEWER_DEV === '1';
  let targetUrl = deepLink;

  if (isDev) {
    const params = new URLSearchParams(new URL(deepLink).search);
    targetUrl = `http://localhost:5173/dev-open?${params.toString()}`;
    console.log('Running in dev mode. Opening URL in browser...');
  }

  const openCommand = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  
  try {
    const child = spawn(openCommand, [targetUrl], {
      detached: true,
      stdio: 'ignore'
    });
    child.on('error', (err) => {
      console.error(`Error: Failed to launch viewer. Command "${openCommand}" failed.`);
      console.error(`Please open this URL manually:\n${targetUrl}`);
    });
    child.unref();
  } catch (error) {
    console.error(`Error: Failed to execute command "${openCommand}".`);
    console.error(`Please open this URL manually:\n${targetUrl}`);
  }
}

main().catch(err => {
  console.error("An unexpected error occurred:", err);
  process.exit(1);
});