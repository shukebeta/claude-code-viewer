# Claude Code Viewer - ccviewer 명령어 코드 리뷰 요청

## 프로젝트 개요
Claude Code Viewer는 Claude Code CLI 세션을 위한 Electron 기반 데스크톱 뷰어입니다. 터미널의 텍스트 기반 인터페이스를 벗어나 웹 기반의 깔끔한 UI로 세션 내용을 확인할 수 있게 해주는 도구입니다.

## ccviewer 명령어 개요

### 목적
`ccviewer`는 Claude CLI 내부에서 작업 중일 때 현재 세션을 GUI로 즉시 열어볼 수 있게 해주는 명령어입니다.

### 주요 기능
1. **Claude CLI 통합**: `CLAUDECODE=1` 환경에서만 동작
2. **세션 자동 탐지**: 현재 디렉토리 기반으로 관련 프로젝트와 세션 찾기
3. **Deep Link 사용**: `claude-viewer://` 프로토콜로 Electron 앱과 통신
4. **개발 모드 지원**: `--dev` 플래그나 환경변수로 개발 서버 연결

### 워크플로우
```
Claude CLI에서 작업 중 → ccviewer 명령 실행 → 세션 정보 탐색 → Deep Link 생성 → Electron 앱 실행 → 현재 세션 자동 열림
```

## 핵심 구현 파일

### 1. `/cli/claude-viewer-cli.js` - CLI 진입점
```javascript
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
        return { projectPath, originalPath: currentPath };
      }
      
      // 상위 디렉토리로 이동
      currentPath = path.dirname(currentPath);
    }

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

// 프로젝트 이름 추출
const projectName = path.basename(sessionInfo.projectPath);

// 깔끔한 출력
console.log(`\nProject: ${projectName}`);
console.log(`Session: ${sessionInfo.sessionId}\n`);

// 개발 모드 확인
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
  // Deep link로 앱 열기
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
```

### 2. `package.json` - CLI 명령어 등록
```json
{
  "name": "claude-code-viewer",
  "version": "1.0.2",
  "bin": {
    "ccviewer": "./cli/claude-viewer-cli.js"
  },
  // ... 나머지 설정
}
```

### 3. `/electron/main.ts` - Deep Link 처리 (일부)
```typescript
// Deep link protocol 설정
const PROTOCOL_PREFIX = 'claude-viewer'

// Deep link URL 파싱
function parseDeepLink(url: string): { sessionId?: string; projectPath?: string; jsonlFile?: string } {
  // URL 파싱 로직
}

// 프로토콜 핸들러 등록
app.setAsDefaultProtocolClient(PROTOCOL_PREFIX)
```

## 코드 리뷰 요청사항

다음 관점에서 코드를 검토해주세요:

### 1. 로직의 정확성
- 세션 찾기 알고리즘이 올바르게 구현되었는가?
- 경로 변환 로직 (`pathToProjectName`)이 모든 경우를 처리하는가?
- 상위 디렉토리 탐색 로직이 안전하고 효율적인가?

### 2. 에러 처리
- 프로젝트/세션을 찾지 못한 경우 적절히 처리되는가?
- 파일 읽기 실패 시 graceful하게 처리되는가?
- Deep Link 열기 실패 시 대안이 있는가?

### 3. 보안 관점
- 경로 탐색 시 보안 취약점이 없는가?
- 환경변수 검증이 충분한가?
- Deep Link URL 생성 시 인코딩이 적절한가?

### 4. 성능
- 대용량 JSONL 파일 처리 시 메모리 효율성
- 세션 탐색 알고리즘의 시간 복잡도
- 불필요한 파일 시스템 접근이 있는가?

### 5. 크로스 플랫폼 호환성
- Windows, macOS, Linux에서 모두 동작하는가?
- 경로 구분자 처리가 올바른가?
- 플랫폼별 명령어 실행이 적절한가?

### 6. 사용자 경험
- 에러 메시지가 명확하고 도움이 되는가?
- 성공 시 출력이 깔끔하고 정보가 충분한가?
- 개발 모드 전환이 직관적인가?

### 7. 코드 품질
- 코드 구조와 가독성
- 에러 처리의 일관성
- 주석과 문서화 수준

특히 다음 시나리오에서의 동작을 확인해주세요:
1. Claude 프로젝트가 없는 디렉토리에서 실행
2. 여러 세션이 있는 프로젝트에서 실행
3. 손상된 JSONL 파일이 있는 경우
4. 권한이 없는 디렉토리에서 실행
5. 개발 모드와 프로덕션 모드 전환

감사합니다!