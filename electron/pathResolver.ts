import { existsSync } from 'fs'
import { join } from 'path'

// Map for caching
const pathCache = new Map<string, string>()

/**
 * Restore Claude project folder name to actual file system path
 * Example: -Users-lullu-mainpy-claude-code-web → /Users/lullu/mainpy/claude-code-web
 * 
 * Algorithm:
 * 1. Start by replacing the first '-' with '/'
 * 2. For each '-', check if directory exists when replaced with '/'
 * 3. If exists, continue; otherwise keep '-' as is
 */
export function resolveProjectPath(projectName: string): string {
  // Check cache
  if (pathCache.has(projectName)) {
    return pathCache.get(projectName)!
  }

  // Empty string or only '-' case
  if (!projectName || projectName === '-') {
    const result = '/'
    pathCache.set(projectName, result)
    return result
  }

  // First '-' is always '/'
  if (!projectName.startsWith('-')) {
    // Already in path format
    pathCache.set(projectName, projectName)
    return projectName
  }

  // Array to construct result path
  const parts: string[] = []
  
  // Remove first '-' as it represents root
  let remaining = projectName.substring(1)
  
  // Handle empty directory names (starting with --)
  while (remaining.startsWith('-')) {
    // Consecutive '-' means empty directory
    parts.push('')
    remaining = remaining.substring(1)
  }
  
  // Path constructed so far
  let currentPath = '/'
  
  while (remaining.length > 0) {
    // Find next '-' position
    let nextDashIndex = remaining.indexOf('-')
    
    if (nextDashIndex === -1) {
      // If no more '-', treat the rest as one part
      parts.push(remaining)
      currentPath = join(currentPath, remaining)
      break
    }
    
    // Check path when '-' is replaced with '/'
    const possiblePart = remaining.substring(0, nextDashIndex)
    const possiblePathAsSlash = join(currentPath, possiblePart)
    
    // Also check path when '-' is replaced with '_'
    const possiblePathAsUnderscore = join(currentPath, possiblePart.replace(/-/g, '_'))
    
    if (existsSync(possiblePathAsSlash)) {
      // If directory exists, separate with '/'
      parts.push(possiblePart)
      currentPath = possiblePathAsSlash
      remaining = remaining.substring(nextDashIndex + 1)
    } else if (existsSync(possiblePathAsUnderscore)) {
      // If exists when replaced with '_', process with '_'
      parts.push(possiblePart.replace(/-/g, '_'))
      currentPath = possiblePathAsUnderscore
      remaining = remaining.substring(nextDashIndex + 1)
    } else {
      // If directory doesn't exist, include up to next '-' as one part
      // Example: claude-code-web case
      let foundValid = false
      let searchIndex = nextDashIndex + 1
      
      while (searchIndex < remaining.length) {
        const nextSearchIndex = remaining.indexOf('-', searchIndex)
        if (nextSearchIndex === -1) {
          // Search to the end
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
        
        // Test including up to next '-'
        const testPart = remaining.substring(0, nextSearchIndex)
        const testPath = join(currentPath, testPart)
        
        // Also test path with '_'
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
        // If nothing matches, treat the whole as one
        parts.push(remaining)
        currentPath = join(currentPath, remaining)
        break
      }
    }
  }
  
  // Combine result
  const result = '/' + parts.join('/')
  
  // Save to cache
  pathCache.set(projectName, result)
  
  return result
}

/**
 * Clear cache
 */
export function clearPathCache(): void {
  pathCache.clear()
}

/**
 * Check cache status (for debugging)
 */
export function getPathCacheSize(): number {
  return pathCache.size
}

/**
 * Get cached path for specific project (for debugging)
 */
export function getCachedPath(projectName: string): string | undefined {
  return pathCache.get(projectName)
}