import React, { useState, useEffect } from 'react'
import { Message } from '@/types'
import { Clock, MessageSquare, DollarSign, User, Bot } from 'lucide-react'
import { formatTime, formatCurrency } from '@/utils/formatters'

interface SessionPreviewProps {
  sessionId: string
  sessionFilePath: string
  position: { x: number; y: number }
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
  const [stats, setStats] = useState({ messageCount: 0, totalCost: 0, startTime: null as Date | null })

  useEffect(() => {
    loadSessionPreview()
  }, [sessionFilePath])

  const loadSessionPreview = async () => {
    try {
      setLoading(true)
      const sessionMessages = await window.api.readFile(sessionFilePath)
      
      // Calculate stats
      let messageCount = 0
      let totalCost = 0
      let startTime: Date | null = null
      
      sessionMessages.forEach((msg: Message) => {
        if (msg.type === 'user' || msg.type === 'assistant') {
          messageCount++
        }
        if (msg.costUSD) {
          totalCost += msg.costUSD
        }
        if (msg.timestamp) {
          const msgTime = new Date(msg.timestamp)
          if (!startTime || msgTime < startTime) {
            startTime = msgTime
          }
        }
      })
      
      setStats({ messageCount, totalCost, startTime })
      
      // Get recent messages for preview (last 10)
      const recentMessages = sessionMessages
        .filter((msg: Message) => msg.type === 'user' || msg.type === 'assistant')
        .slice(-10)
      
      setMessages(recentMessages)
    } catch (error) {
      console.error('Error loading session preview:', error)
    } finally {
      setLoading(false)
    }
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
    return content.length > 200 ? content.substring(0, 200) + '...' : content
  }

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 2000,
        backgroundColor: 'var(--background)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
        minWidth: '300px',
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
        left: position.x,
        top: position.y,
        zIndex: 2000,
        backgroundColor: 'var(--background)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        boxShadow: '0 12px 48px rgba(0, 0, 0, 0.2)',
        width: '500px',
        maxHeight: '400px',
        overflow: 'hidden',
        fontSize: '11px'
      }}
      onMouseLeave={onClose}
    >
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        backgroundColor: 'var(--bg-100)'
      }}>
        <div style={{
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--foreground)',
          marginBottom: '4px',
          fontFamily: 'SF Mono, Monaco, Cascadia Code, monospace'
        }}>
          {sessionId.substring(0, 12)}...
        </div>
        <div style={{
          display: 'flex',
          gap: '12px',
          fontSize: '10px',
          color: 'var(--muted-foreground)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MessageSquare size={10} />
            {stats.messageCount} messages
          </div>
          {stats.totalCost > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <DollarSign size={10} />
              {formatCurrency(stats.totalCost)}
            </div>
          )}
          {stats.startTime && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={10} />
              {formatTime(stats.startTime)}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={{
        maxHeight: '320px',
        overflowY: 'auto',
        padding: '8px'
      }}>
        {messages.length === 0 ? (
          <div style={{
            padding: '16px',
            textAlign: 'center',
            color: 'var(--muted-foreground)',
            fontSize: '10px'
          }}>
            No messages to preview
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={message.uuid || index}
              style={{
                marginBottom: '6px',
                padding: '6px 8px',
                borderRadius: '6px',
                backgroundColor: message.type === 'user' ? 'var(--secondary)' : 'var(--bg-100)',
                border: '1px solid ' + (message.type === 'user' ? 'var(--border)' : 'transparent')
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginBottom: '2px'
              }}>
                {message.type === 'user' ? (
                  <User size={8} style={{ color: 'var(--accent)' }} />
                ) : (
                  <Bot size={8} style={{ color: 'var(--foreground)' }} />
                )}
                <span style={{
                  fontSize: '9px',
                  fontWeight: 500,
                  color: message.type === 'user' ? 'var(--accent)' : 'var(--foreground)'
                }}>
                  {message.type === 'user' ? 'User' : 'Claude'}
                </span>
                {message.timestamp && (
                  <span style={{
                    fontSize: '8px',
                    color: 'var(--muted-foreground)',
                    marginLeft: 'auto'
                  }}>
                    {new Date(message.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                )}
              </div>
              <div style={{
                fontSize: '10px',
                lineHeight: '1.3',
                color: 'var(--foreground)',
                opacity: 0.9
              }}>
                {renderMessageContent(message)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}