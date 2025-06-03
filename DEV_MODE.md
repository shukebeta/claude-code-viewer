# Development Mode for Claude Viewer CLI

## 개발 환경에서 딥링크 테스트하기

### 1. 개발 서버 실행
```bash
npm run dev
```

### 2. Claude Viewer CLI 개발 모드로 실행

#### 방법 1: --dev 플래그 사용
```bash
claude-viewer --dev
```

#### 방법 2: 환경변수 설정
```bash
export CLAUDE_VIEWER_DEV=1
claude-viewer
```

### 3. 디버깅 로그 확인

개발 모드에서는 다음과 같은 디버깅 정보가 표시됩니다:

```
Current directory: /Users/lullu/mainpy/project
Found project for: /Users/lullu/mainpy/project
Found project: /Users/lullu/.claude/projects/-Users-lullu-mainpy-project
Found most recent session: abc123...
Opening Claude Session Viewer...
Session ID: abc123...
Project: -Users-lullu-mainpy-project
Deep link: claude-viewer://open?sessionId=abc123...

[DEV MODE] Trying to connect to development server...
[DEV MODE] Opening URL: http://localhost:5173/dev-open?sessionId=abc123...
[DEV MODE] Development server should open with your session
```

### 4. 개발 서버에서 처리

개발 서버(http://localhost:5173)가 브라우저에서 열리고, URL 파라미터를 통해 세션 정보를 받아 자동으로 해당 세션을 엽니다.

## 프로덕션 모드와의 차이점

- **프로덕션 모드**: `claude-viewer://` 딥링크 사용
- **개발 모드**: `http://localhost:5173/dev-open?...` URL 사용

## 트러블슈팅

1. **개발 서버가 열리지 않는 경우**
   - `npm run dev`가 실행 중인지 확인
   - 포트 5173이 사용 가능한지 확인

2. **세션이 자동으로 열리지 않는 경우**
   - 브라우저 콘솔에서 `[DEV MODE]` 로그 확인
   - URL 파라미터가 올바르게 전달되었는지 확인

3. **Electron API 에러**
   - 개발 모드에서는 window.api가 없을 수 있음
   - 이는 정상적인 동작이며, 무시해도 됨