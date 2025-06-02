import React, { useState, useEffect } from 'react'
import { Clock, MessageSquare, DollarSign } from 'lucide-react'
import { Session } from '@/types'
import { formatTime, formatCurrency } from '@/utils/formatters'
import { useAppStore } from '@/store/appStore'

interface RecentSessionsProps {
  limit?: number
  showProjectInfo?: boolean
}

interface SessionWithProject extends Session {
  projectName: string
  projectPath: string
}

export const RecentSessions: React.FC<RecentSessionsProps> = ({ limit = 10, showProjectInfo = false }) => {
  const [recentSessions, setRecentSessions] = useState<SessionWithProject[]>([])
  const [loading, setLoading] = useState(true)
  const [projectsMap, setProjectsMap] = useState<Record<string, any>>({})
  const { addTab, setActiveTab, setSessionsForProject } = useAppStore()

  useEffect(() => {
    loadRecentSessions()
  }, [])

  const loadRecentSessions = async () => {
    try {
      setLoading(true)
      // Get all projects
      const projects = await window.api.getProjects()
      
      // Create a map of project paths to project objects
      const projMap: Record<string, any> = {}
      projects.forEach(p => {
        projMap[p.path] = p
      })
      setProjectsMap(projMap)
      
      // Get sessions from all projects
      const allSessions: SessionWithProject[] = []
      
      for (const project of projects) {
        const sessions = await window.api.getSessions(project.path)
        // Store sessions for this project
        setSessionsForProject(project.path, sessions)
        const sessionsWithProject = sessions.map(session => ({
          ...session,
          projectName: project.name.split('/').pop() || project.name,
          projectPath: project.path
        }))
        allSessions.push(...sessionsWithProject)
      }
      
      // Sort by start time (most recent first) and limit
      const sorted = allSessions
        .filter(s => s.startTime) // Filter out sessions without startTime
        .sort((a, b) => new Date(b.startTime!).getTime() - new Date(a.startTime!).getTime())
        .slice(0, limit)
      
      setRecentSessions(sorted)
    } catch (error) {
      console.error('Error loading recent sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSessionClick = (session: SessionWithProject) => {
    const tabId = `${session.projectName}-${session.id}`
    const project = projectsMap[session.projectPath] || { name: session.projectPath, path: session.projectPath, sessionCount: 0 }
    addTab(session, project)
    setActiveTab(tabId)
  }

  if (loading) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: 'var(--muted-foreground)'
      }}>
        Loading recent sessions...
      </div>
    )
  }

  if (recentSessions.length === 0) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: 'var(--muted-foreground)'
      }}>
        No sessions found
      </div>
    )
  }

  return (
    <div>
      <h2 style={{
        fontSize: '20px',
        fontWeight: 600,
        marginBottom: '24px',
        color: 'var(--foreground)'
      }}>
        Recent Sessions
      </h2>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
        gap: '16px'
      }}>
        {recentSessions.map((session) => (
          <div
            key={`${session.projectPath}-${session.id}`}
            onClick={() => handleSessionClick(session)}
            style={{
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: 'var(--bg-100)',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
              e.currentTarget.style.borderColor = 'var(--accent)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)'
              e.currentTarget.style.borderColor = 'var(--border)'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '8px'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: 'var(--foreground)',
                  marginBottom: '4px'
                }}>
                  {session.projectName}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: 'var(--muted-foreground)',
                  fontFamily: 'SF Mono, Monaco, Cascadia Code, monospace',
                  opacity: 0.7
                }}>
                  {session.id.substring(0, 8)}
                </div>
              </div>
              <div style={{
                fontSize: '12px',
                color: 'var(--muted-foreground)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Clock size={14} />
                {formatTime(new Date(session.startTime))}
              </div>
            </div>
            
            {session.preview && (
              <div style={{
                fontSize: '13px',
                color: 'var(--text-300)',
                marginBottom: '16px',
                lineHeight: '1.6',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                minHeight: '60px'
              }}>
                {session.preview}
              </div>
            )}
            
            <div style={{
              display: 'flex',
              gap: '16px',
              fontSize: '12px',
              color: 'var(--muted-foreground)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageSquare size={14} />
                <span>{session.messageCount} messages</span>
              </div>
              {session.totalCost > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <DollarSign size={14} />
                  <span>{formatCurrency(session.totalCost)}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}