import React, { useEffect, useState, useRef } from 'react'
import { useAppStore } from '@/store/appStore'
import { Message, Tab } from '@/types'
import { MessageBlock } from './MessageBlock'
import { Timeline } from './Timeline'

interface SessionViewerProps {
  tab: Tab
}

export const SessionViewer: React.FC<SessionViewerProps> = ({ tab }) => {
  const { messages, setMessages, sessionsByProject } = useAppStore()
  const [isLive, setIsLive] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)
  const [currentMessageIndex, setCurrentMessageIndex] = useState<number | undefined>()
  const containerRef = useRef<HTMLDivElement>(null)
  const messageRefs = useRef<(HTMLDivElement | null)[]>([])
  const sessionMessages = messages[tab.sessionId] || []
  
  // Find the session details from all project sessions
  let session = null
  for (const projectPath in sessionsByProject) {
    const projectSessions = sessionsByProject[projectPath]
    const found = projectSessions.find(s => s.id === tab.sessionId)
    if (found) {
      session = found
      break
    }
  }
  
  console.log('[SessionViewer] Looking for session:', tab.sessionId)
  console.log('[SessionViewer] Available sessions by project:', sessionsByProject)
  console.log('[SessionViewer] Found session:', session)
  
  useEffect(() => {
    if (!session) return
    
    // Load initial messages
    loadMessages()
    
    // Start watching file for changes
    window.api.watchFile(session.filePath)
    setIsLive(true)
    
    // Listen for file changes
    const handleFileChange = (changedPath: string) => {
      if (changedPath === session.filePath) {
        loadMessages()
      }
    }
    
    window.api.onFileChange(handleFileChange)
    
    return () => {
      window.api.unwatchFile(session.filePath)
      setIsLive(false)
    }
  }, [session])
  
  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [sessionMessages, autoScroll])
  
  const loadMessages = async () => {
    if (!session) return
    
    try {
      const newMessages = await window.api.readFile(session.filePath)
      setMessages(tab.sessionId, newMessages)
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }
  
  const handleTimelineJump = (index: number) => {
    const element = messageRefs.current[index]
    if (element && containerRef.current) {
      const container = containerRef.current
      const elementTop = element.offsetTop
      const elementHeight = element.offsetHeight
      const containerHeight = container.clientHeight
      
      // Center the message in the viewport
      const scrollTop = elementTop - (containerHeight / 2) + (elementHeight / 2)
      container.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      })
      
      setCurrentMessageIndex(index)
      setAutoScroll(false)
    }
  }
  
  // Track visible messages for timeline
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    
    const handleScroll = () => {
      const containerTop = container.scrollTop
      const containerBottom = containerTop + container.clientHeight
      
      // Find the first visible message
      for (let i = 0; i < messageRefs.current.length; i++) {
        const element = messageRefs.current[i]
        if (element) {
          const elementTop = element.offsetTop
          const elementBottom = elementTop + element.offsetHeight
          
          if (elementBottom > containerTop && elementTop < containerBottom) {
            setCurrentMessageIndex(i)
            break
          }
        }
      }
    }
    
    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [sessionMessages])
  
  if (!session) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--muted-foreground)'
      }}>
        Session not found
      </div>
    )
  }
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: 'var(--background)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: '1px solid var(--border)',
        backgroundColor: 'var(--background)'
      }}>
        <div>
          <h1 style={{
            fontSize: '16px',
            fontWeight: 600,
            margin: 0
          }}>
            {tab.projectName} / {tab.sessionName}
          </h1>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          fontSize: '13px'
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            color: 'var(--muted-foreground)'
          }}>
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            Auto-scroll
          </label>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span className={isLive ? 'status-indicator status-live' : 'status-indicator status-offline'} />
            <span style={{ color: 'var(--muted-foreground)' }}>
              {isLive ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
      
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0',
          backgroundColor: 'var(--background)'
        }}
      >
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '40px 24px'
        }}>
          {sessionMessages.map((message, index) => (
            <div 
              key={message.uuid || index}
              ref={el => messageRefs.current[index] = el}
            >
              <MessageBlock message={message} />
            </div>
          ))}
          {sessionMessages.length === 0 && (
            <div style={{
              textAlign: 'center',
              color: 'var(--muted-foreground)',
              marginTop: '64px'
            }}>
              No messages yet...
            </div>
          )}
        </div>
      </div>
      
      {/* Timeline minimap */}
      <div 
        style={{
          position: 'fixed',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          width: '140px',
          height: '450px',
          pointerEvents: 'none',
          padding: '20px'
        }}
        onMouseEnter={(e) => {
          const timeline = e.currentTarget.querySelector('.timeline-container') as HTMLElement
          if (timeline) {
            timeline.style.opacity = '1'
            timeline.style.pointerEvents = 'auto'
            timeline.style.transform = 'translateY(-50%) translateX(0)'
          }
        }}
        onMouseLeave={(e) => {
          const timeline = e.currentTarget.querySelector('.timeline-container') as HTMLElement
          if (timeline) {
            timeline.style.opacity = '0'
            timeline.style.pointerEvents = 'none'
            timeline.style.transform = 'translateY(-50%) translateX(10px)'
          }
        }}
      >
        <Timeline 
          messages={sessionMessages}
          currentIndex={currentMessageIndex}
          onJump={handleTimelineJump}
        />
      </div>
    </div>
  )
}