import { create } from 'zustand'
import { Project, Session, Message, Tab, AppState } from '@/types'

interface AppStore extends AppState {
  // Actions
  setProjects: (projects: Project[]) => void
  selectProject: (path: string | null) => void
  setSessions: (sessions: Session[]) => void
  selectSession: (id: string | null) => void
  setMessages: (sessionId: string, messages: Message[]) => void
  appendMessage: (sessionId: string, message: Message) => void
  
  // Tab actions
  addTab: (session: Session, project: Project) => void
  removeTab: (tabId: string) => void
  setActiveTab: (tabId: string) => void
  
  // UI actions
  toggleSidebar: () => void
  setTheme: (theme: 'light' | 'dark') => void
}

export const useAppStore = create<AppStore>((set) => ({
  // Initial state
  projects: [],
  selectedProjectPath: null,
  sessions: [],
  selectedSessionId: null,
  tabs: [],
  activeTabId: null,
  messages: {},
  sidebarCollapsed: false,
  theme: 'light',
  
  // Actions
  setProjects: (projects) => set({ projects }),
  
  selectProject: (path) => set({ selectedProjectPath: path, sessions: [], selectedSessionId: null }),
  
  setSessions: (sessions) => set({ sessions }),
  
  selectSession: (id) => set({ selectedSessionId: id }),
  
  setMessages: (sessionId, messages) => 
    set((state) => ({
      messages: { ...state.messages, [sessionId]: messages }
    })),
  
  appendMessage: (sessionId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [sessionId]: [...(state.messages[sessionId] || []), message]
      }
    })),
  
  addTab: (session, project) =>
    set((state) => {
      // project.name이 슬래시를 포함할 수 있으므로 안전한 ID 생성
      const projectDisplayName = project.path.split('/').pop() || 'project'
      const tabId = `${projectDisplayName}-${session.id}`
      const existingTab = state.tabs.find(t => t.id === tabId)
      
      if (existingTab) {
        return { activeTabId: tabId }
      }
      
      return {
        tabs: [...state.tabs, {
          id: tabId,
          sessionId: session.id,
          sessionName: session.id.substring(0, 8),
          projectName: projectDisplayName
        }],
        activeTabId: tabId
      }
    }),
  
  removeTab: (tabId) =>
    set((state) => {
      const tabs = state.tabs.filter(t => t.id !== tabId)
      let activeTabId = state.activeTabId
      
      if (activeTabId === tabId) {
        const removedIndex = state.tabs.findIndex(t => t.id === tabId)
        if (tabs.length > 0) {
          activeTabId = tabs[Math.min(removedIndex, tabs.length - 1)].id
        } else {
          activeTabId = null
        }
      }
      
      return { tabs, activeTabId }
    }),
  
  setActiveTab: (tabId) => set({ activeTabId: tabId }),
  
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  
  setTheme: (theme) => set({ theme })
}))