import { existsSync } from 'fs'
import { join } from 'path'

// 캐시를 위한 Map
const pathCache = new Map<string, string>()

/**
 * Claude 프로젝트 폴더명을 실제 파일 시스템 경로로 복원
 * 예: -Users-lullu-mainpy-claude-code-web → /Users/lullu/mainpy/claude-code-web
 * 
 * 알고리즘:
 * 1. 맨 앞의 '-'를 '/'로 바꿔서 시작
 * 2. 각 '-'에 대해 '/'로 바꿨을 때 실제 디렉토리가 존재하는지 확인
 * 3. 존재하면 계속 진행, 없으면 '-'를 그대로 유지
 */
export function resolveProjectPath(projectName: string): string {
  // 캐시 확인
  if (pathCache.has(projectName)) {
    return pathCache.get(projectName)!
  }

  // 빈 문자열이나 '-'만 있는 경우
  if (!projectName || projectName === '-') {
    const result = '/'
    pathCache.set(projectName, result)
    return result
  }

  // 맨 앞의 '-'는 항상 '/'
  if (!projectName.startsWith('-')) {
    // 이미 경로 형태인 경우
    pathCache.set(projectName, projectName)
    return projectName
  }

  // 결과 경로를 구성할 배열
  const parts: string[] = []
  
  // 첫 번째 '-'는 루트를 의미하므로 제거
  let remaining = projectName.substring(1)
  
  // 빈 디렉토리명 처리 (--로 시작하는 경우)
  while (remaining.startsWith('-')) {
    // 연속된 '-'는 빈 디렉토리를 의미
    parts.push('')
    remaining = remaining.substring(1)
  }
  
  // 현재까지 구성된 경로
  let currentPath = '/'
  
  while (remaining.length > 0) {
    // 다음 '-'의 위치 찾기
    let nextDashIndex = remaining.indexOf('-')
    
    if (nextDashIndex === -1) {
      // 더 이상 '-'가 없으면 나머지 전체를 하나의 부분으로 처리
      parts.push(remaining)
      currentPath = join(currentPath, remaining)
      break
    }
    
    // '-'를 '/'로 바꿨을 때의 경로 확인
    const possiblePart = remaining.substring(0, nextDashIndex)
    const possiblePathAsSlash = join(currentPath, possiblePart)
    
    // '-'를 '_'로 바꿨을 때의 경로도 확인
    const possiblePathAsUnderscore = join(currentPath, possiblePart.replace(/-/g, '_'))
    
    if (existsSync(possiblePathAsSlash)) {
      // 디렉토리가 존재하면 '/'로 구분
      parts.push(possiblePart)
      currentPath = possiblePathAsSlash
      remaining = remaining.substring(nextDashIndex + 1)
    } else if (existsSync(possiblePathAsUnderscore)) {
      // '_'로 바꿨을 때 존재하면 '_'로 처리
      parts.push(possiblePart.replace(/-/g, '_'))
      currentPath = possiblePathAsUnderscore
      remaining = remaining.substring(nextDashIndex + 1)
    } else {
      // 디렉토리가 없으면 다음 '-'까지 포함해서 하나의 부분으로 처리
      // 예: claude-code-web 같은 경우
      let foundValid = false
      let searchIndex = nextDashIndex + 1
      
      while (searchIndex < remaining.length) {
        const nextSearchIndex = remaining.indexOf('-', searchIndex)
        if (nextSearchIndex === -1) {
          // 끝까지 검색
          const testPart = remaining
          const testPath = join(currentPath, testPart)
          const testPartWithUnderscore = testPart.replace(/-/g, '_')
          const testPathWithUnderscore = join(currentPath, testPartWithUnderscore)
          
          if (existsSync(testPath)) {
            parts.push(testPart)
            currentPath = testPath
            remaining = ''
            foundValid = true
          } else if (existsSync(testPathWithUnderscore)) {
            parts.push(testPartWithUnderscore)
            currentPath = testPathWithUnderscore
            remaining = ''
            foundValid = true
          }
          break
        }
        
        // 다음 '-'까지 포함해서 테스트
        const testPart = remaining.substring(0, nextSearchIndex)
        const testPath = join(currentPath, testPart)
        
        // '_'가 포함된 경로도 테스트
        const testPartWithUnderscore = testPart.replace(/-/g, '_')
        const testPathWithUnderscore = join(currentPath, testPartWithUnderscore)
        
        if (existsSync(testPath)) {
          parts.push(testPart)
          currentPath = testPath
          remaining = remaining.substring(nextSearchIndex + 1)
          foundValid = true
          break
        } else if (existsSync(testPathWithUnderscore)) {
          parts.push(testPartWithUnderscore)
          currentPath = testPathWithUnderscore
          remaining = remaining.substring(nextSearchIndex + 1)
          foundValid = true
          break
        }
        
        searchIndex = nextSearchIndex + 1
      }
      
      if (!foundValid) {
        // 아무것도 매칭되지 않으면 전체를 하나로 처리
        parts.push(remaining)
        currentPath = join(currentPath, remaining)
        break
      }
    }
  }
  
  // 결과 조합
  const result = '/' + parts.join('/')
  
  // 캐시에 저장
  pathCache.set(projectName, result)
  
  return result
}

/**
 * 캐시 초기화
 */
export function clearPathCache(): void {
  pathCache.clear()
}

/**
 * 캐시 상태 확인 (디버깅용)
 */
export function getPathCacheSize(): number {
  return pathCache.size
}

/**
 * 특정 프로젝트의 캐시된 경로 가져오기 (디버깅용)
 */
export function getCachedPath(projectName: string): string | undefined {
  return pathCache.get(projectName)
}