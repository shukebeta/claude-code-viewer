import React, { useState, useEffect } from 'react'
import { Clock, MessageSquare, DollarSign } from 'lucide-react'
import { Session } from '@/types'
import { formatTime, formatCurrency } from '@/utils/formatters'
import { useAppStore } from '@/store/appStore'

interface RecentSessionsProps {
  limit?: number
}

interface SessionWithProject extends Session {
  projectName: string
  projectPath: string
}

export const RecentSessions: React.FC<RecentSessionsProps> = ({ limit = 10 }) => {
  const [recentSessions, setRecentSessions] = useState<SessionWithProject[]>([])
  const [loading, setLoading] = useState(true)
  const { addTab, setActiveTab } = useAppStore()

  useEffect(() => {
    loadRecentSessions()
  }, [])

  const loadRecentSessions = async () => {
    try {
      setLoading(true)
      // Get all projects
      const projects = await window.api.getProjects()
      
      // Get sessions from all projects
      const allSessions: SessionWithProject[] = []
      
      for (const project of projects) {
        const sessions = await window.api.getSessions(project.path)
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
    addTab(session, { name: session.projectName, path: session.projectPath, sessionCount: 0 })
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
    <div style={{ padding: '20px' }}>
      <h2 style={{
        fontSize: '18px',
        fontWeight: 600,
        marginBottom: '20px',
        color: 'var(--foreground)'
      }}>
        Recent Sessions
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {recentSessions.map((session) => (
          <div
            key={`${session.projectPath}-${session.id}`}
            onClick={() => handleSessionClick(session)}
            style={{
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: 'var(--secondary)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--muted)'
              e.currentTarget.style.borderColor = 'var(--foreground)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--secondary)'
              e.currentTarget.style.borderColor = 'var(--border)'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '8px'
            }}>
              <div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--foreground)',
                  marginBottom: '4px'
                }}>
                  {session.projectName}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: 'var(--muted-foreground)',
                  fontFamily: 'SF Mono, Monaco, Cascadia Code, monospace'
                }}>
                  {session.id}
                </div>
              </div>
              <div style={{
                fontSize: '12px',
                color: 'var(--muted-foreground)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Clock size={12} />
                {formatTime(new Date(session.startTime))}
              </div>
            </div>
            
            {session.preview && (
              <div style={{
                fontSize: '13px',
                color: 'var(--muted-foreground)',
                marginBottom: '12px',
                lineHeight: '1.5',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                opacity: 0.8
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MessageSquare size={12} />
                {session.messageCount} messages
              </div>
              {session.totalCost > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <DollarSign size={12} />
                  {formatCurrency(session.totalCost)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}