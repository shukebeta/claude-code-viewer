import React from 'react'
import { Clock, DollarSign, MessageSquare } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { formatTime, formatDate, formatCurrency } from '@/utils/formatters'

export const SessionList: React.FC = () => {
  const { sessions, selectedSessionId, selectSession, addTab, projects, selectedProjectPath } = useAppStore()
  
  console.log('SessionList render - sessions:', sessions)
  console.log('SessionList render - selectedProjectPath:', selectedProjectPath)
  
  const handleSessionClick = async (session: any) => {
    selectSession(session.id)
    
    const project = projects.find(p => p.path === selectedProjectPath)
    if (project) {
      addTab(session, project)
    }
  }
  
  const sessionsByDate = sessions.reduce((acc, session) => {
    const dateKey = session.startTime 
      ? formatDate(new Date(session.startTime))
      : 'Unknown Date'
    
    console.log('Processing session:', session.id, 'dateKey:', dateKey)
    
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(session)
    return acc
  }, {} as Record<string, typeof sessions>)
  
  console.log('SessionsByDate:', sessionsByDate)
  
  return (
    <div style={{ padding: '4px' }}>
      {Object.entries(sessionsByDate).map(([date, dateSessions]) => (
        <div key={date} style={{ marginBottom: '12px' }}>
          <div style={{
            padding: '8px 12px',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--muted-foreground)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {date}
          </div>
          {dateSessions.map((session) => (
            <div
              key={session.id}
              className={`session-item ${selectedSessionId === session.id ? 'active' : ''}`}
              onClick={() => handleSessionClick(session)}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '4px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: 500
                }}>
                  <Clock size={12} />
                  {session.startTime && formatTime(new Date(session.startTime))}
                </div>
                <span style={{ 
                  fontSize: '11px', 
                  color: 'var(--muted-foreground)',
                  fontFamily: 'monospace'
                }}>
                  {session.id.substring(0, 8)}
                </span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '11px',
                color: 'var(--muted-foreground)'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MessageSquare size={10} />
                  {session.messageCount} msgs
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <DollarSign size={10} />
                  {formatCurrency(session.totalCost)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}