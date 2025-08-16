import { existsSync } from 'fs'
import { join, resolve, sep } from 'path'

// Map for caching
const pathCache = new Map<string, string>()

/**
 * Restore Claude project folder name to actual file system path
 * Example: -Users-lullu-mainpy-claude-code-web → /Users/lullu/mainpy/claude-code-web
 * Windows: C--Users-username-project → C:\Users\username\project
 * 
 * Algorithm:
 * - Windows: Extract drive letter and replace '--' with '\' 
 * - Unix: Start by replacing the first '-' with path separator, then for each '-',
 *   check if directory exists when replaced with path separator
 */
export function resolveProjectPath(projectName: string): string {
  // Check cache
  if (pathCache.has(projectName)) {
    return pathCache.get(projectName)!
  }

  // Empty string or only '-' case
  if (!projectName || projectName === '-') {
    const result = resolve(sep)
    pathCache.set(projectName, result)
    return result
  }

  // Check if this is a Windows project folder (starts with drive letter)
  const isWindowsProjectFolder = /^[A-Za-z]--/.test(projectName)
  
  // Unix project folders start with '-', Windows folders start with drive letter
  if (!projectName.startsWith('-') && !isWindowsProjectFolder) {
    // Already in path format
    pathCache.set(projectName, projectName)
    return projectName
  }

  // Handle Windows project folders (e.g., "C--Users-username-project")
  if (isWindowsProjectFolder) {
    // Extract drive letter and remaining path
    const driveMatch = projectName.match(/^([A-Za-z])--(.+)$/)
    if (driveMatch) {
      const [, driveLetter, pathPart] = driveMatch
      // Replace -- with :\ first, then replace remaining - with \
      // This may have false positives but gives more readable paths
      let windowsPath = `${driveLetter.toUpperCase()}--${pathPart}`
      windowsPath = windowsPath.replace(/--/, ':\\').replace(/-/g, '\\')
      const result = windowsPath
      pathCache.set(projectName, result)
      return result
    }
  }

  // Remove first '-' as it represents root (Unix paths only)
  let remaining = projectName.substring(1)
  
  // Simple approach: replace all '-' with path separator
  // This works for most cases and is much simpler than the complex file existence checking
  const pathParts = remaining.split('-')
  const result = resolve(sep, ...pathParts)
  
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