import React, { useState, useEffect } from 'react'
import { Message } from '@/types'
import { User, Bot } from 'lucide-react'

interface SessionPreviewProps {
  sessionId: string
  sessionFilePath: string
  position: { x: number; y: number; width: number; height: number }
  onClose: () => void
}

export const SessionPreview: React.FC<SessionPreviewProps> = ({ 
  sessionId, 
  sessionFilePath, 
  position, 
  onClose 
}) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSessionPreview()
  }, [sessionFilePath])

  const loadSessionPreview = async () => {
    try {
      setLoading(true)
      const sessionMessages = await window.api.readFile(sessionFilePath)
      
      // Get recent messages for preview (last 8)
      const recentMessages = sessionMessages
        .filter((msg: Message) => msg.type === 'user' || msg.type === 'assistant')
        .slice(-8)
      
      setMessages(recentMessages)
    } catch (error) {
      console.error('Error loading session preview:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate smart positioning
  const getSmartPosition = () => {
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const previewWidth = 450
    const previewHeight = 300
    
    let left = position.x
    let top = position.y + position.height // Default: below the card
    
    // Check if preview would go off right edge
    if (left + previewWidth > viewportWidth - 20) {
      left = position.x + position.width - previewWidth // Right align
    }
    
    // Check if preview would go off bottom edge
    if (top + previewHeight > viewportHeight - 20) {
      top = position.y - previewHeight // Above the card
    }
    
    // Ensure we don't go off left edge
    if (left < 20) {
      left = 20
    }
    
    // Ensure we don't go off top edge
    if (top < 20) {
      top = position.y + position.height // Force below if no room above
    }
    
    return { left, top }
  }

  const renderMessageContent = (message: Message) => {
    let content = ''
    
    if (message.message?.content) {
      if (typeof message.message.content === 'string') {
        content = message.message.content
      } else if (Array.isArray(message.message.content)) {
        const textContent = message.message.content.find((item: any) => item.type === 'text')
        content = textContent?.text || ''
      }
    } else if (message.content) {
      content = typeof message.content === 'string' ? message.content : ''
    }
    
    // Truncate long content
    return content.length > 150 ? content.substring(0, 150) + '...' : content
  }

  const smartPos = getSmartPosition()

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        left: smartPos.left,
        top: smartPos.top,
        zIndex: 2000,
        backgroundColor: 'var(--background)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '12px 16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
        fontSize: '12px',
        color: 'var(--muted-foreground)'
      }}>
        Loading preview...
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: smartPos.left,
        top: smartPos.top,
        zIndex: 2000,
        backgroundColor: 'var(--background)',
        border: '2px solid var(--accent)',
        borderRadius: '8px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08)',
        width: '450px',
        maxHeight: '300px',
        overflow: 'hidden',
        fontSize: '11px'
      }}
      onMouseEnter={() => {
        // Cancel any pending close when mouse enters preview
      }}
      onMouseLeave={onClose}
    >
      {/* Messages - matching SessionViewer design */}
      <div style={{
        maxHeight: '300px',
        overflowY: 'auto',
        padding: '12px'
      }}>
        {messages.length === 0 ? (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: 'var(--muted-foreground)',
            fontSize: '12px'
          }}>
            No messages to preview
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={message.uuid || index}
              style={{
                marginBottom: '12px',
                display: 'flex',
                gap: '8px',
                fontSize: '11px'
              }}
            >
              {/* Avatar */}
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '10px',
                backgroundColor: message.type === 'user' ? 'var(--accent)' : 'var(--muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '2px'
              }}>
                {message.type === 'user' ? (
                  <User size={10} color="white" />
                ) : (
                  <Bot size={10} color="var(--foreground)" />
                )}
              </div>
              
              {/* Message content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '10px',
                  fontWeight: 500,
                  color: message.type === 'user' ? 'var(--accent)' : 'var(--foreground)',
                  marginBottom: '2px'
                }}>
                  {message.type === 'user' ? 'You' : 'Claude'}
                </div>
                <div style={{
                  fontSize: '10px',
                  lineHeight: '1.4',
                  color: 'var(--foreground)',
                  opacity: 0.9,
                  wordBreak: 'break-word'
                }}>
                  {renderMessageContent(message)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}