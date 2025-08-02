# Homebrew Tap 설정 가이드

## 1. GitHub에서 새 저장소 생성
- 저장소 이름: `homebrew-tap` (반드시 이 형식이어야 함)
- 예: `https://github.com/YOUR_USERNAME/homebrew-tap`

## 2. Tap 저장소 구조
```
homebrew-tap/
├── Formula/
│   └── claude-code-viewer.rb
└── README.md
```

## 3. Formula 파일 업데이트
1. Release 생성 후 DMG/AppImage의 SHA256 확인:
   ```bash
   shasum -a 256 claude-code-viewer-1.0.0-mac.dmg
   shasum -a 256 claude-code-viewer-1.0.0-linux.AppImage
   ```

2. Formula 파일에서 다음 부분 수정:
   - `YOUR_USERNAME`을 실제 GitHub 사용자명으로
   - `REPLACE_WITH_ACTUAL_SHA256`을 실제 SHA256 값으로

## 4. Tap 저장소에 푸시
```bash
cd homebrew-tap
git add Formula/claude-code-viewer.rb
git commit -m "Add claude-code-viewer formula"
git push
```

## 5. 사용자가 설치하는 방법
```bash
# Tap 추가
brew tap YOUR_USERNAME/tap

# 설치
brew install claude-code-viewer

# 또는 한 줄로
brew install YOUR_USERNAME/tap/claude-code-viewer
```