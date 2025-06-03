import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { execSync } from 'child_process'
import { pathToProjectName } from './projectPathUtils'

interface SessionInfo {
  sessionId: string
  projectPath: string
  jsonlFile: string
  timestamp: string
}

export class SessionFinder {
  private claudeProjectsPath: string

  constructor() {
    this.claudeProjectsPath = path.join(os.homedir(), '.claude', 'projects')
  }

  /**
   * 현재 작업 디렉토리 가져오기
   */
  getCurrentDirectory(): string {
    try {
      return execSync('pwd', { encoding: 'utf-8' }).trim()
    } catch (error) {
      console.error('Failed to get current directory:', error)
      return process.cwd()
    }
  }

  /**
   * 현재 경로에 맞는 프로젝트 폴더 찾기
   */
  findMatchingProject(pwd: string): string | null {
    const projectName = pathToProjectName(pwd)
    const projectPath = path.join(this.claudeProjectsPath, projectName)

    if (fs.existsSync(projectPath) && fs.statSync(projectPath).isDirectory()) {
      return projectPath
    }

    // 디버깅용 - 사용 가능한 프로젝트 출력
    console.log(`Looking for project: ${pathToProjectName(pwd)}`)
    console.log('Available projects:')
    try {
      const projects = fs.readdirSync(this.claudeProjectsPath)
      projects.forEach(project => {
        if (fs.statSync(path.join(this.claudeProjectsPath, project)).isDirectory()) {
          console.log(`  - ${project}`)
        }
      })
    } catch (error) {
      console.error('Failed to list projects:', error)
    }

    return null
  }

  /**
   * 특정 키워드를 포함한 최근 세션 찾기
   */
  findRecentSessionWithKeyword(
    projectDir: string,
    keyword: string,
    seconds: number = 60
  ): SessionInfo | null {
    const cutoffTime = new Date(Date.now() - seconds * 1000)
    const jsonlFiles = fs.readdirSync(projectDir).filter(f => f.endsWith('.jsonl'))

    for (const jsonlFile of jsonlFiles) {
      const filePath = path.join(projectDir, jsonlFile)
      try {
        const content = fs.readFileSync(filePath, 'utf-8')
        const lines = content.split('\n').filter(line => line.trim())

        // 파일을 역순으로 읽어서 최근 메시지부터 확인
        for (let i = lines.length - 1; i >= 0; i--) {
          try {
            const data = JSON.parse(lines[i])

            if (
              data.type === 'user' &&
              data.message &&
              typeof data.message === 'object' &&
              data.message.role === 'user'
            ) {
              const timestamp = new Date(data.timestamp)
              if (timestamp < cutoffTime) continue

              const content = data.message.content || ''
              if (
                typeof content === 'string' &&
                content.includes(`<bash-input>${keyword}`)
              ) {
                return {
                  sessionId: data.sessionId,
                  projectPath: projectDir,
                  jsonlFile: filePath,
                  timestamp: data.timestamp
                }
              }
            }
          } catch (error) {
            // JSON 파싱 에러 무시
            continue
          }
        }
      } catch (error) {
        console.error(`Failed to read file ${filePath}:`, error)
      }
    }

    return null
  }

  /**
   * 가장 최근 활성 세션 찾기 (키워드 없이)
   */
  findMostRecentSession(projectDir: string): SessionInfo | null {
    const jsonlFiles = fs.readdirSync(projectDir).filter(f => f.endsWith('.jsonl'))
    let mostRecent: SessionInfo | null = null
    let mostRecentTime = new Date(0)

    for (const jsonlFile of jsonlFiles) {
      const filePath = path.join(projectDir, jsonlFile)
      try {
        const content = fs.readFileSync(filePath, 'utf-8')
        const lines = content.split('\n').filter(line => line.trim())

        // 마지막 줄부터 확인
        for (let i = lines.length - 1; i >= 0; i--) {
          try {
            const data = JSON.parse(lines[i])
            const timestamp = new Date(data.timestamp)

            if (timestamp > mostRecentTime && data.sessionId) {
              mostRecentTime = timestamp
              mostRecent = {
                sessionId: data.sessionId,
                projectPath: projectDir,
                jsonlFile: filePath,
                timestamp: data.timestamp
              }
              break // 이 파일에서는 더 이상 확인할 필요 없음
            }
          } catch (error) {
            continue
          }
        }
      } catch (error) {
        console.error(`Failed to read file ${filePath}:`, error)
      }
    }

    return mostRecent
  }

  /**
   * 현재 디렉토리의 Claude 세션 찾기
   */
  findCurrentSession(options: { keyword?: string; seconds?: number } = {}): SessionInfo | null {
    const pwd = this.getCurrentDirectory()
    console.log(`Current directory: ${pwd}`)

    const projectDir = this.findMatchingProject(pwd)
    if (!projectDir) {
      console.error('No matching Claude project found for current directory')
      return null
    }

    console.log(`Found project: ${projectDir}`)

    // 키워드가 있으면 키워드로 검색, 없으면 가장 최근 세션
    if (options.keyword) {
      const session = this.findRecentSessionWithKeyword(
        projectDir,
        options.keyword,
        options.seconds || 60
      )
      if (session) {
        console.log(`Found session with keyword "${options.keyword}": ${session.sessionId}`)
        return session
      }
    }

    // 키워드로 못 찾았거나 키워드가 없으면 가장 최근 세션
    const session = this.findMostRecentSession(projectDir)
    if (session) {
      console.log(`Found most recent session: ${session.sessionId}`)
      return session
    }

    console.error('No active session found')
    return null
  }
}