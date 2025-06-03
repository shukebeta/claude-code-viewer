import React, { useState } from 'react'
import { Message } from '@/types'
import { MessageBlock } from './MessageBlock'
import { ChevronDown, ChevronRight, Layers } from 'lucide-react'
import { formatTime } from '@/utils/formatters'

interface ToolGroupProps {
  messages: Message[]
}

export const ToolGroup: React.FC<ToolGroupProps> = ({ messages }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Always show the latest 1 tool
  const ALWAYS_VISIBLE_COUNT = 1
  const hiddenCount = Math.max(0, messages.length - ALWAYS_VISIBLE_COUNT)
  const visibleMessages = isExpanded ? messages : messages.slice(-ALWAYS_VISIBLE_COUNT)
  
  // Get timestamp from the first message
  const firstTimestamp = messages[0]?.timestamp
  
  // Get total cost
  const totalCost = messages.reduce((sum, msg) => sum + (msg.costUSD || 0), 0)
  
  return (
    <div className="message-container">
      {/* Tool Group Header - like User/Assistant */}
      <div className="message-header">
        <div className="message-dot tool" />
        <span style={{ 
          textTransform: 'capitalize', 
          color: 'hsl(var(--text-000))',
          fontWeight: 600,
          fontSize: '13px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif'
        }}>
          Tool Sequence
        </span>
        <span className="message-timestamp">
          {firstTimestamp && formatTime(new Date(firstTimestamp))}
        </span>
        {totalCost > 0 && (
          <span className="message-cost">
            ${totalCost.toFixed(4)}
          </span>
        )}
      </div>
      
      {/* Tool Group Content */}
      <div className="message-content tool">
        {/* Collapsed state - show summary */}
        {!isExpanded && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 0',
            cursor: 'pointer',
            color: 'hsl(var(--text-400))',
            transition: 'all 0.15s ease',
            fontSize: '14px',
            lineHeight: '1.6',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif'
          }}
          onClick={() => setIsExpanded(true)}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'hsl(var(--text-000))'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'hsl(var(--text-400))'
          }}
          >
            <ChevronRight size={16} />
            <span>
              {messages.length} tool{messages.length > 1 ? 's' : ''} used
            </span>
          </div>
        )}
        
        {/* Expanded state - show collapse button */}
        {isExpanded && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 0',
            cursor: 'pointer',
            color: 'var(--muted-foreground)',
            transition: 'all 0.2s',
            marginBottom: '8px',
            fontSize: '14px',
            lineHeight: '1.6'
          }}
          onClick={() => setIsExpanded(false)}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'hsl(var(--text-000))'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'hsl(var(--text-400))'
          }}
          >
            <ChevronDown size={16} />
            <span>
              Collapse tools
            </span>
          </div>
        )}
      
        {/* Tool items with sub-dots */}
        <div style={{ paddingLeft: '32px', position: 'relative' }}>
          {/* Ellipsis for hidden tools */}
          {!isExpanded && hiddenCount > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '12px 0 8px 0',
              color: 'hsl(var(--text-400))',
              opacity: 0.4
            }}>
              <div style={{ 
                width: '3px', 
                height: '3px', 
                borderRadius: '50%', 
                background: 'hsl(var(--text-400))', 
                opacity: 0.6 
              }} />
              <div style={{ 
                width: '3px', 
                height: '3px', 
                borderRadius: '50%', 
                background: 'hsl(var(--text-400))', 
                opacity: 0.6 
              }} />
              <div style={{ 
                width: '3px', 
                height: '3px', 
                borderRadius: '50%', 
                background: 'hsl(var(--text-400))', 
                opacity: 0.6 
              }} />
            </div>
          )}
          
          {/* Show all tools when expanded */}
          {isExpanded && hiddenCount > 0 && (
            <>
              {/* Earlier tools */}
              {messages.slice(0, hiddenCount).map((message, index) => (
                <div key={message.uuid || index} style={{ position: 'relative', marginBottom: '6px' }}>
                  <MessageBlock message={{...message, isInToolGroup: true}} />
                </div>
              ))}
              
            </>
          )}
        
          {/* Always visible tool (latest 1) */}
          {(!isExpanded && hiddenCount > 0 ? visibleMessages : messages.slice(-ALWAYS_VISIBLE_COUNT)).map((message, index) => (
            <div key={message.uuid || index} style={{ position: 'relative', marginBottom: '6px' }}>
              <MessageBlock message={{...message, isInToolGroup: true}} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}