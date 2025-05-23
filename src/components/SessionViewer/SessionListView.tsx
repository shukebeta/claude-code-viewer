import React from 'react'
import { Clock, DollarSign, MessageSquare, Folder } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { formatTime, formatDate, formatCurrency } from '@/utils/formatters'

export const SessionListView: React.FC = () => {
  const { sessions, selectedSessionId, selectSession, addTab, projects, selectedProjectPath } = useAppStore()
  
  const selectedProject = projects.find(p => p.path === selectedProjectPath)
  
  const handleSessionClick = async (session: any) => {
    selectSession(session.id)
    
    if (selectedProject) {
      addTab(session, selectedProject)
    }
  }

  const sessionsByDate = sessions.reduce((acc, session) => {
    const dateKey = session.startTime 
      ? formatDate(new Date(session.startTime))
      : 'Unknown Date'
    
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(session)
    return acc
  }, {} as Record<string, typeof sessions>)
  
  // Sort date keys to ensure "Unknown Date" is last
  const sortedDateKeys = Object.keys(sessionsByDate).sort((a, b) => {
    if (a === 'Unknown Date') return 1
    if (b === 'Unknown Date') return -1
    // Most recent dates first
    return b.localeCompare(a)
  })

  if (!selectedProject) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: 'var(--muted-foreground)',
        textAlign: 'center'
      }}>
        <Folder size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
          Select a Project
        </h2>
        <p style={{ fontSize: '14px' }}>
          Choose a project from the sidebar to view its sessions
        </p>
      </div>
    )
  }

  return (
    <div style={{
      padding: '24px',
      height: '100%',
      overflow: 'auto'
    }}>
      <div style={{
        marginBottom: '24px',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '16px'
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 700,
          marginBottom: '8px',
          color: 'var(--foreground)'
        }}>
          {selectedProject.name}
        </h1>
        <p style={{
          fontSize: '14px',
          color: 'var(--muted-foreground)'
        }}>
          {sessions.length} sessions
        </p>
      </div>

      <div>
        {sortedDateKeys.map(date => (
          <div key={date} style={{ marginBottom: '32px' }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--foreground)',
              marginBottom: '16px',
              padding: '8px 0',
              borderBottom: '1px solid var(--border)'
            }}>
              {date}
            </h3>
            
            <div style={{
              display: 'grid',
              gap: '12px',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))'
            }}>
              {sessionsByDate[date].map((session) => (
                <div
                  key={session.id}
                  onClick={() => handleSessionClick(session)}
                  style={{
                    padding: '16px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: selectedSessionId === session.id ? 'var(--secondary)' : 'var(--background)'
                  }}
                  className="session-card"
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--foreground)'
                    }}>
                      <Clock size={14} />
                      {session.startTime && formatTime(new Date(session.startTime))}
                    </div>
                    <span style={{ 
                      fontSize: '12px', 
                      color: 'var(--muted-foreground)',
                      fontFamily: 'monospace',
                      background: 'var(--secondary)',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {session.id.substring(0, 8)}
                    </span>
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
                    alignItems: 'center',
                    gap: '16px',
                    fontSize: '12px',
                    color: 'var(--muted-foreground)'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MessageSquare size={12} />
                      {session.messageCount} msgs
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <DollarSign size={12} />
                      {formatCurrency(session.totalCost)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}