#!/bin/bash

# Claude Code Viewer macOS Build Script
# 로컬에서 DMG 빌드용 (공증 없음)

set -e

echo "🚀 Claude Code Viewer macOS 빌드 시작..."

# 의존성 설치
echo "📦 의존성 설치 중..."
npm ci

# 이전 빌드 정리
echo "🧹 이전 빌드 파일 정리 중..."
rm -rf dist
rm -rf release

# 프로덕션 빌드
echo "🔨 앱 빌드 중..."
npm run build

# Electron 빌드 (공증 없이)
echo "📱 macOS DMG 생성 중..."
npx electron-builder --mac --config electron-builder.yml \
  -c.mac.identity=null

# 빌드 결과 확인
if ls release/*.dmg 1> /dev/null 2>&1; then
    echo "✅ 빌드 완료!"
    echo "📍 빌드 파일 위치:"
    ls -la release/*.dmg
    
    # 파일 크기 표시
    echo ""
    echo "📊 파일 정보:"
    du -h release/*.dmg
else
    echo "❌ 빌드 실패: DMG 파일을 찾을 수 없습니다."
    exit 1
fi

echo ""
echo "🎉 완료! DMG 파일이 release 폴더에 생성되었습니다."
echo "⚠️  주의: 이 빌드는 공증되지 않았으므로 사용자가 보안 설정에서 허용해야 합니다."