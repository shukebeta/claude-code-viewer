import React, { useState, useRef, useEffect } from 'react'
import { Clock, DollarSign, MessageSquare, Folder } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { formatTime, formatDate, formatCurrency } from '@/utils/formatters'
import { SessionPreview } from './SessionPreview'

export const SessionListView: React.FC = () => {
  const { sessions, selectedSessionId, selectSession, addTab, projects, selectedProjectPath } = useAppStore()
  const [hoveredSession, setHoveredSession] = useState<string | null>(null)
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const hoverTimeoutRef = useRef<NodeJS.Timeout>()
  const [showSessionPreview, setShowSessionPreview] = useState(true)
  
  // Load session preview setting
  useEffect(() => {
    const savedPreviewSetting = localStorage.getItem('claude-viewer-show-session-preview')
    setShowSessionPreview(savedPreviewSetting !== 'false') // Default to true
  }, [])
  
  const selectedProject = projects.find(p => p.path === selectedProjectPath)
  
  const handleSessionClick = async (session: any) => {
    selectSession(session.id)
    
    if (selectedProject) {
      addTab(session, selectedProject)
    }
  }

  const handleMouseEnter = (session: any, event: React.MouseEvent) => {
    if (!showSessionPreview) return // Don't show preview if disabled
    
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    
    // Show preview immediately (no delay)
    const rect = event.currentTarget.getBoundingClientRect()
    setPreviewPosition({
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height
    })
    setHoveredSession(session.id)
  }

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    
    // Longer delay to allow moving to preview
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredSession(null)
    }, 200)
  }

  const handlePreviewClose = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    
    // Immediate close when leaving preview area
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredSession(null)
    }, 100)
  }

  const handlePreviewEnter = () => {
    // Cancel any pending close when mouse enters preview
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
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
                  onMouseEnter={(e) => {
                    handleMouseEnter(session, e)
                    e.currentTarget.style.borderColor = 'var(--accent)'
                    e.currentTarget.style.background = 'var(--secondary)'
                  }}
                  onMouseLeave={(e) => {
                    handleMouseLeave()
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.background = selectedSessionId === session.id ? 'var(--secondary)' : 'var(--background)'
                  }}
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
      
      {/* Session Preview Overlay */}
      {hoveredSession && showSessionPreview && (
        <SessionPreview
          sessionId={hoveredSession}
          sessionFilePath={sessions.find(s => s.id === hoveredSession)?.filePath || ''}
          position={previewPosition}
          onClose={handlePreviewClose}
          onMouseEnter={handlePreviewEnter}
        />
      )}
    </div>
  )
}