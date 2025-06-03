import React, { useEffect } from 'react'
import { ThemeProvider } from 'next-themes'
import { Layout } from '@/components/Layout/Layout'
import { useAppStore } from '@/store/appStore'
import { findMatchingProject } from '@/utils/projectPathUtils'
import './styles/globals.css'

function App(): JSX.Element {
  const { setProjects, setSessions, setSessionsForProject, addTab, setActiveTab, selectProject } = useAppStore()
  
  useEffect(() => {
    // Load projects on app start
    loadProjects()
    
    // Create dashboard tab on first load
    const hasInitialized = localStorage.getItem('hasInitialized')
    if (!hasInitialized) {
      setActiveTab('dashboard')
      localStorage.setItem('hasInitialized', 'true')
    } else {
      // Always show dashboard on app start
      setActiveTab('dashboard')
    }
    
    // Handle dev mode URL parameters
    handleDevModeParams()
    
    // Listen for deep link events
    if (window.api && window.api.onDeepLinkOpen) {
      console.log('[App] Setting up deep link listener')
      window.api.onDeepLinkOpen((params) => {
        console.log('[App] Received deep link params:', params)
        handleDeepLink(params)
      })
    }
  }, [])
  
  const handleDeepLink = async (params: { sessionId?: string; projectPath?: string; jsonlFile?: string }) => {
    console.log('[App] handleDeepLink called with:', params)
    
    if (!params.projectPath) {
      console.error('[App] Missing projectPath param:', params)
      return
    }
    
    // 약간의 지연을 주어 앱이 완전히 로드되도록 함
    setTimeout(async () => {
      try {
        // Load projects first if not loaded
        if (window.api && window.api.getProjects) {
          const projects = await window.api.getProjects()
          console.log('[App] Loaded projects:', projects.length)
          setProjects(projects)
          
          // Find the matching project
          const project = findMatchingProject(projects, params.projectPath)
          if (!project) {
            console.error('[App] Project not found:', params.projectPath)
            console.error('[App] Available projects:', projects.map(p => p.path))
            return
          }
          
          // Get sessions for this project
          const sessions = await window.api.getSessions(project.path)
          console.log('[App] Loaded sessions:', sessions.length)
          
          // IMPORTANT: Set sessions in the store for this specific project
          setSessionsForProject(project.path, sessions)
          
          // If sessionId is provided, open that specific session
          if (params.sessionId) {
            // Find the specific session
            const session = sessions.find(s => s.id === params.sessionId)
            if (!session) {
              console.error('[App] Session not found:', params.sessionId)
              console.error('[App] Available sessions:', sessions.map(s => s.id))
              return
            }
            
            console.log('[App] Found session:', session)
            
            // Create and activate tab
            // project.name에 슬래시가 포함되어 있으므로 안전한 ID 생성
            const projectDisplayName = project.path.split('/').pop() || 'project'
            const tabId = `${projectDisplayName}-${session.id}`
            console.log('[App] Creating tab with ID:', tabId)
            console.log('[App] Project info:', { name: project.name, path: project.path, displayName: projectDisplayName })
            
            addTab(session, project)
            
            // 탭이 생성된 후 활성화
            setTimeout(() => {
              console.log('[App] Activating tab:', tabId)
              setActiveTab(tabId)
            }, 100)
            
            console.log('[App] Tab created and activation scheduled')
          } else {
            // If no sessionId, just show the project's session list
            console.log('[App] No sessionId provided, showing project sessions')
            // Select the project to show its sessions in the UI
            selectProject(project.path)
            // The sessions are already loaded and set in the store
            // The UI will automatically show the session list for this project
          }
        }
      } catch (error) {
        console.error('[App] Error handling deep link:', error)
      }
    }, 500) // 500ms 지연
  }
  
  const handleDevModeParams = () => {
    // Check if we're in development mode and have URL parameters
    if (window.location.pathname === '/dev-open') {
      const params = new URLSearchParams(window.location.search)
      const sessionId = params.get('sessionId')
      const projectPath = params.get('projectPath')
      const jsonlFile = params.get('jsonlFile')
      
      console.log('[DEV MODE] Received params:', { sessionId, projectPath, jsonlFile })
      
      if (sessionId && projectPath) {
        // Create a tab for this session
        const projectName = projectPath.split('/').pop() || 'Project'
        const tabId = `${projectName}-${sessionId}`
        
        console.log('[DEV MODE] Opening session:', tabId)
        
        // Add tab and activate it with full project path info
        const mockSession = { 
          id: sessionId, 
          filePath: jsonlFile || '', 
          projectPath: projectPath,
          messageCount: 0,
          totalCost: 0
        } as any
        const mockProject = { 
          name: projectName, 
          path: projectPath, 
          sessionCount: 0 
        }
        addTab(mockSession, mockProject)
        setActiveTab(tabId)
        
        // Clear the URL to avoid re-triggering
        window.history.replaceState({}, '', '/')
      }
    }
  }
  
  const loadProjects = async () => {
    try {
      // Check if window.api exists (Electron environment)
      if (window.api && window.api.readDirectory) {
        const projects = await window.api.readDirectory('projects')
        setProjects(projects)
      } else {
        console.log('[DEV MODE] Running without Electron API')
        // In dev mode without Electron, you might want to load mock data
        // or connect to a development server
      }
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }
  
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Layout />
    </ThemeProvider>
  )
}

export default App