import React from 'react'
import { useAppStore } from '@/store/appStore'
import { Folder, FileText } from 'lucide-react'
import { RecentSessions } from '../RecentSessions/RecentSessions'

export const Dashboard: React.FC = () => {
  const { projects } = useAppStore()
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'auto'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '48px 48px 24px 48px'
      }}>
        <div style={{
          marginBottom: '32px',
          color: 'var(--muted-foreground)'
        }}>
          <FileText size={64} style={{ opacity: 0.5 }} />
        </div>
        
        <h1 style={{
          fontSize: '24px',
          fontWeight: 600,
          marginBottom: '16px',
          color: 'var(--foreground)'
        }}>
          Claude Session Viewer
        </h1>
        
        <p style={{
          fontSize: '16px',
          color: 'var(--muted-foreground)',
          marginBottom: '32px',
          maxWidth: '400px',
          lineHeight: 1.6
        }}>
          Browse and view your Claude Code sessions. Select a project from the sidebar to get started.
        </p>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          background: 'var(--secondary)',
          borderRadius: '6px',
          fontSize: '14px',
          color: 'var(--muted-foreground)'
        }}>
          <Folder size={16} />
          <span>{projects.length} projects found</span>
        </div>
      </div>
      
      <div style={{
        maxWidth: '800px',
        width: '100%',
        margin: '0 auto',
        padding: '0 48px 48px 48px'
      }}>
        <RecentSessions limit={20} />
      </div>
    </div>
  )
}