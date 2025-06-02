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
  preview?: string
}

export interface Message {
  type: 'user' | 'assistant' | 'tool'
  timestamp: string
  uuid: string
  parentUuid?: string
  content?: any
  costUSD?: number
  durationMs?: number
  message?: {
    role?: string
    content?: any
  }
  toolUseResult?: string
}

export interface Tab {
  id: string
  sessionId: string
  sessionName: string
  projectName: string
}

export interface AppState {
  projects: Project[]
  selectedProjectPath: string | null
  sessions: Session[]
  sessionsByProject: Record<string, Session[]>  // 프로젝트별 세션 저장
  selectedSessionId: string | null
  tabs: Tab[]
  activeTabId: string | null
  messages: Record<string, Message[]>
  sidebarCollapsed: boolean
  theme: 'light' | 'dark'
}