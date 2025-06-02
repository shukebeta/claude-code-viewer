import React from 'react'
import { Folder } from 'lucide-react'
import { useAppStore } from '@/store/appStore'

interface ProjectListProps {
  searchQuery?: string
}

export const ProjectList: React.FC<ProjectListProps> = ({ searchQuery = '' }) => {
  const { projects, selectedProjectPath, selectProject, setSessions, setSessionsForProject, setActiveTab, addTab, tabs } = useAppStore()
  
  // Filter projects based on search query
  const filteredProjects = projects.filter(project => {
    const projectName = project.name.toLowerCase()
    const query = searchQuery.toLowerCase()
    return projectName.includes(query)
  })
  
  const handleProjectClick = async (projectPath: string) => {
    selectProject(projectPath)
    try {
      const sessions = await window.api.getSessions(projectPath)
      setSessions(sessions)
      setSessionsForProject(projectPath, sessions)
      
      // If user clicks the same project again or wants to see session list, 
      // create a new tab or switch to a tab that shows session list
      const project = projects.find(p => p.path === projectPath)
      if (project) {
        // Create a new tab to show session list
        const newTabId = `project-${Date.now()}`
        // For project tabs, we need to pass a special session object that has the project name
        const projectSession = {
          id: newTabId,
          filePath: '',
          projectPath: projectPath,
          messageCount: 0,
          totalCost: 0,
          // Add projectName to use for tab display
          projectName: project.name.split('/').pop() || project.name
        } as any
        addTab(projectSession, project)
        setActiveTab(newTabId)
      }
    } catch (error) {
      console.error('Error loading sessions:', error)
    }
  }
  
  return (
    <div>
      {filteredProjects.map((project) => (
        <div
          key={project.path}
          onClick={() => handleProjectClick(project.path)}
          style={{
            padding: '12px 16px',
            margin: '4px 0',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
            background: selectedProjectPath === project.path ? 'var(--secondary)' : 'transparent',
            border: selectedProjectPath === project.path ? '1px solid var(--border)' : '1px solid transparent'
          }}
          className="project-item"
        >
          <div style={{
            fontSize: '14px',
            fontWeight: 500,
            color: 'var(--foreground)',
            marginBottom: '4px'
          }}>
            {project.name.split('/').pop() || project.name}
          </div>
          <div style={{
            fontSize: '11px',
            color: 'var(--muted-foreground)',
            marginBottom: '2px',
            opacity: 0.7,
            fontFamily: 'SF Mono, Monaco, Cascadia Code, monospace',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {project.name}
          </div>
          <div style={{
            fontSize: '12px',
            color: 'var(--muted-foreground)'
          }}>
            {project.sessionCount}개 세션
          </div>
        </div>
      ))}
    </div>
  )
}