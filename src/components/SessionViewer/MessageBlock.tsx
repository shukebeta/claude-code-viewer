import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { CodeBlock } from './CodeBlock'
import { CollapsibleMessage } from './CollapsibleMessage'
import { ToolRenderer } from '../Tools/ToolRenderer'
import { formatTime } from '@/utils/formatters'
import { Message } from '@/types'

interface MessageBlockProps {
  message: Message
}

export const MessageBlock: React.FC<MessageBlockProps> = ({ message }) => {
  const [isToolExpanded, setIsToolExpanded] = useState(false)
  
  const formatTimestamp = (timestamp: string) => {
    return formatTime(new Date(timestamp))
  }

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(4)}`
  }

  const isToolMessage = () => {
    return message.type === 'tool' || 
           message.toolUseResult || 
           (message.message?.content && Array.isArray(message.message.content) && 
            message.message.content.some((item: any) => item.type === 'tool_use'))
  }

  const getMessageContent = () => {
    // Handle tool messages
    if (isToolMessage()) {
      // Extract tool info from message structure
      let toolName = ''
      let parameters = null
      let result = message.toolUseResult
      let error = null

      if (message.message?.content && Array.isArray(message.message.content)) {
        const toolUse = message.message.content.find((item: any) => item.type === 'tool_use')
        if (toolUse) {
          toolName = toolUse.name || ''
          parameters = toolUse.input
        }
      }
      
      // Try to extract tool name from other possible locations
      if (!toolName && message.tool) {
        toolName = message.tool
      }
      if (!toolName && message.toolName) {
        toolName = message.toolName
      }
      if (!toolName && message.name) {
        toolName = message.name
      }
      
      // If still no tool name found, use a generic name
      if (!toolName) {
        toolName = 'Tool'
      }

      return (
        <ToolRenderer
          toolName={toolName}
          parameters={parameters}
          result={result}
          error={error}
          compact={true}
        />
      )
    }

    // Handle user and assistant messages
    let content = ''
    if (message.message?.content) {
      if (Array.isArray(message.message.content)) {
        const textContent = message.message.content.find((item: any) => item.type === 'text')
        content = textContent?.text || ''
      } else if (typeof message.message.content === 'string') {
        content = message.message.content
      }
    }

    if (!content) {
      return <div style={{ color: 'var(--muted-foreground)', fontStyle: 'italic' }}>No content available</div>
    }

    // For user messages, use collapsible component for long text
    if (message.type === 'user') {
      return <CollapsibleMessage content={content} maxLines={6} />
    }

    // For assistant messages, render markdown
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '')
            const language = match ? match[1] : ''
            
            if (!inline && language) {
              return (
                <CodeBlock
                  language={language}
                  value={String(children).replace(/\n$/, '')}
                />
              )
            }
            
            return (
              <code 
                className={className} 
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontSize: '0.875em',
                  fontFamily: 'SF Mono, Monaco, Cascadia Code, monospace'
                }}
                {...props}
              >
                {children}
              </code>
            )
          },
          p: ({ children }) => (
            <p style={{ margin: '0 0 12px 0', lineHeight: 1.6 }}>
              {children}
            </p>
          ),
          h1: ({ children }) => (
            <h1 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 600 }}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 style={{ margin: '16px 0 12px 0', fontSize: '18px', fontWeight: 600 }}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 style={{ margin: '12px 0 8px 0', fontSize: '16px', fontWeight: 600 }}>
              {children}
            </h3>
          ),
          ul: ({ children }) => (
            <ul style={{ 
              margin: '0 0 12px 0', 
              paddingLeft: '24px',
              listStyleType: 'disc',
              listStylePosition: 'outside'
            }}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol style={{ 
              margin: '0 0 12px 0', 
              paddingLeft: '24px',
              listStyleType: 'decimal',
              listStylePosition: 'outside'
            }}>
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li style={{ 
              margin: '4px 0',
              paddingLeft: '4px',
              lineHeight: 1.6
            }}>
              {children}
            </li>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    )
  }

  const getDisplayType = () => {
    if (isToolMessage()) {
      return 'tool'
    }
    return message.type
  }

  const getDisplayLabel = () => {
    if (isToolMessage()) {
      let toolName = ''
      
      // Extract tool name for display
      if (message.message?.content && Array.isArray(message.message.content)) {
        const toolUse = message.message.content.find((item: any) => item.type === 'tool_use')
        if (toolUse) {
          toolName = toolUse.name || ''
        }
      }
      
      // Try to extract tool name from other possible locations
      if (!toolName && message.tool) {
        toolName = message.tool
      }
      if (!toolName && message.toolName) {
        toolName = message.toolName
      }
      if (!toolName && message.name) {
        toolName = message.name
      }
      
      return toolName ? `${toolName}` : 'Tool'
    }
    return message.type
  }

  // Tool messages - just render the content directly, it already has its own UI
  if (isToolMessage()) {
    return (
      <div className="tool-message-compact" style={{ margin: '4px 0' }}>
        {getMessageContent()}
      </div>
    )
  }

  return (
    <div className="message-container">
      <div className="message-header">
        <div className={`message-dot ${getDisplayType()}`} />
        <span style={{ textTransform: 'capitalize', color: 'var(--foreground)' }}>
          {getDisplayLabel()}
        </span>
        <span className="message-timestamp">
          {formatTimestamp(message.timestamp)}
        </span>
        {message.costUSD && (
          <span className="message-cost">
            {formatCost(message.costUSD)}
          </span>
        )}
      </div>
      
      <div className={`message-content ${getDisplayType()}`}>
        {getMessageContent()}
      </div>
    </div>
  )
}