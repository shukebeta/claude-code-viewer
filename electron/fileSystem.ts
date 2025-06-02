import { promises as fs } from 'fs'
import { join, basename } from 'path'
import { homedir } from 'os'

export interface Project {
  name: string
  path: string
  sessionCount: number
}

export interface Session {
  id: string
  projectPath: string
  filePath: string
  startTime?: Date
  endTime?: Date
  messageCount: number
  totalCost: number
}

export interface Message {
  type: 'user' | 'assistant' | 'tool'
  timestamp: string
  content?: any
  costUSD?: number
  durationMs?: number
  message?: any
}

const CLAUDE_PROJECTS_PATH = join(homedir(), '.claude', 'projects')

export async function getProjects(): Promise<Project[]> {
  try {
    const entries = await fs.readdir(CLAUDE_PROJECTS_PATH, { withFileTypes: true })
    const projects: Project[] = []
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const projectPath = join(CLAUDE_PROJECTS_PATH, entry.name)
        const sessions = await fs.readdir(projectPath)
        const sessionFiles = sessions.filter(f => f.endsWith('.jsonl'))
        
        projects.push({
          name: entry.name.replace(/-/g, '/'),
          path: projectPath,
          sessionCount: sessionFiles.length
        })
      }
    }
    
    return projects
  } catch (error) {
    console.error('Error reading projects:', error)
    return []
  }
}

export async function getSessions(projectName: string): Promise<Session[]> {
  try {
    // projectName이 프로젝트명인지 전체 경로인지 확인
    const projectPath = projectName.startsWith('/') 
      ? projectName 
      : join(CLAUDE_PROJECTS_PATH, projectName.replace(/\//g, '-'))
    
    const files = await fs.readdir(projectPath)
    const sessions: Session[] = []
    
    for (const file of files) {
      if (file.endsWith('.jsonl')) {
        const filePath = join(projectPath, file)
        const content = await fs.readFile(filePath, 'utf-8')
        const lines = content.trim().split('\n')
        
        let startTime: Date | undefined
        let endTime: Date | undefined
        let messageCount = 0
        let totalCost = 0
        const recentMessages: string[] = []
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line)
            if (data.timestamp) {
              const timestamp = new Date(data.timestamp)
              if (!startTime || timestamp < startTime) startTime = timestamp
              if (!endTime || timestamp > endTime) endTime = timestamp
            }
            if (data.type === 'user' || data.type === 'assistant') {
              messageCount++
              
              // Collect message text
              let messageText = ''
              if (data.message?.content) {
                if (typeof data.message.content === 'string') {
                  messageText = data.message.content
                } else if (Array.isArray(data.message.content)) {
                  const textContent = data.message.content.find((item: any) => item.type === 'text')
                  if (textContent?.text) {
                    messageText = textContent.text
                  }
                }
              } else if (data.content) {
                messageText = typeof data.content === 'string' ? data.content : ''
              }
              
              if (messageText) {
                // Keep only last 3 messages
                recentMessages.push(messageText.substring(0, 150))
                if (recentMessages.length > 3) {
                  recentMessages.shift()
                }
              }
            }
            if (data.costUSD) {
              totalCost += data.costUSD
            }
          } catch (e) {
            // Skip invalid lines
          }
        }
        
        // Use the last messages as preview
        const preview = recentMessages.join('\n').substring(0, 200)
        
        // 세션 ID 추출 - jsonl 파일에서 실제 sessionId 찾기
        let sessionId = basename(file, '.jsonl')
        
        // 첫 번째 줄에서 실제 sessionId 찾기
        if (lines.length > 0) {
          try {
            const firstLine = JSON.parse(lines[0])
            if (firstLine.sessionId) {
              sessionId = firstLine.sessionId
            }
          } catch (e) {
            // 기본값 사용
          }
        }
        
        sessions.push({
          id: sessionId,
          projectPath: projectPath,
          filePath,
          startTime,
          endTime,
          messageCount,
          totalCost,
          preview
        })
      }
    }
    
    return sessions.sort((a, b) => {
      if (!a.startTime || !b.startTime) return 0
      return b.startTime.getTime() - a.startTime.getTime()
    })
  } catch (error) {
    console.error('Error reading sessions:', error)
    return []
  }
}

export async function readSessionFile(filePath: string): Promise<Message[]> {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const lines = content.trim().split('\n')
    const messages: Message[] = []
    
    for (const line of lines) {
      try {
        const data = JSON.parse(line)
        messages.push(data)
      } catch (e) {
        // Skip invalid lines
      }
    }
    
    return messages
  } catch (error) {
    console.error('Error reading session file:', error)
    return []
  }
}