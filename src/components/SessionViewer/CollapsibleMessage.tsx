import React, { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface CollapsibleMessageProps {
  content: string
  maxLines?: number
}

export const CollapsibleMessage: React.FC<CollapsibleMessageProps> = ({
  content,
  maxLines = 5
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const lines = content.split('\n')
  const shouldCollapse = lines.length > maxLines
  
  const displayContent = shouldCollapse && !isExpanded 
    ? lines.slice(0, maxLines).join('\n')
    : content

  if (!shouldCollapse) {
    return (
      <div style={{ 
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
      }}>
        {content}
      </div>
    )
  }

  return (
    <div>
      <div style={{ 
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
      }}>
        {displayContent}
      </div>
      
      {shouldCollapse && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginTop: '8px',
            padding: '4px 8px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            color: 'var(--muted-foreground)',
            fontSize: '11px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
          }}
        >
          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          {isExpanded 
            ? 'Show less' 
            : `Show ${lines.length - maxLines} more lines`
          }
        </button>
      )}
    </div>
  )
}