import React, { useEffect } from 'react'
import { TabBar } from './TabBar'
import { Sidebar } from './Sidebar'
import { SessionViewer } from '../SessionViewer/SessionViewer'
import { SessionListView } from '../SessionViewer/SessionListView'
import { Dashboard } from '../Dashboard/Dashboard'
import { useAppStore } from '@/store/appStore'

export const Layout: React.FC = () => {
  const { sidebarCollapsed, sidebarWidth, toggleSidebar, activeTabId, tabs } = useAppStore()
  
  useEffect(() => {
    // Handle menu events from Electron
    window.api?.onMenuAction?.((action: string) => {
      switch (action) {
        case 'new-tab': {
          // Instead of creating an empty tab, navigate to dashboard
          const { setActiveTab } = useAppStore.getState()
          setActiveTab('dashboard')
          break
        }
        case 'close-tab': {
          if (activeTabId && tabs.length > 0) {
            const { removeTab } = useAppStore.getState()
            removeTab(activeTabId)
          }
          break
        }
        case 'toggle-sidebar':
          toggleSidebar()
          break
        case 'zoom-in': {
          const currentZoom = parseFloat(document.documentElement.style.fontSize || '16px')
          const newZoom = Math.min(currentZoom + 1, 24)
          document.documentElement.style.fontSize = `${newZoom}px`
          break
        }
        case 'zoom-out': {
          const currentZoom = parseFloat(document.documentElement.style.fontSize || '16px')
          const newZoom = Math.max(currentZoom - 1, 10)
          document.documentElement.style.fontSize = `${newZoom}px`
          break
        }
        case 'zoom-reset':
          document.documentElement.style.fontSize = '16px'
          break
      }
    })
  }, [toggleSidebar, activeTabId, tabs.length])
  
  useEffect(() => {
    // Handle keyboard shortcuts
    const handleKeydown = (e: KeyboardEvent) => {
      
      // Note: Cmd+T, Cmd+N, Cmd+W, Cmd+B are now handled by Electron menu
      // Only handle shortcuts that aren't in the menu
      
      // - to zoom out (decrease font size)
      if (e.key === '-' && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
        e.preventDefault()
        const currentZoom = parseFloat(document.documentElement.style.fontSize || '16px')
        const newZoom = Math.max(currentZoom - 1, 10)
        document.documentElement.style.fontSize = `${newZoom}px`
      }
      
      // + or = to zoom in (increase font size)
      if ((e.key === '+' || e.key === '=') && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
        e.preventDefault()
        const currentZoom = parseFloat(document.documentElement.style.fontSize || '16px')
        const newZoom = Math.min(currentZoom + 1, 24)
        document.documentElement.style.fontSize = `${newZoom}px`
      }
      
      // Note: Zoom shortcuts are now handled by Electron menu
    }
    
    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [toggleSidebar, activeTabId, tabs.length])
  
  const isDashboard = activeTabId === 'dashboard'
  const isNewTab = activeTabId?.startsWith('new-tab-')
  const isProjectTab = activeTabId?.startsWith('project-')
  const activeTab = tabs.find(t => t.id === activeTabId)
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <TabBar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <main style={{
          flex: 1,
          marginLeft: sidebarCollapsed ? '0' : `${sidebarWidth}px`,
          marginTop: '40px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          transition: 'margin-left 0.2s ease'
        }}>
          {isDashboard || isNewTab ? (
            <Dashboard />
          ) : isProjectTab || !activeTab ? (
            <SessionListView />
          ) : (
            <SessionViewer tab={activeTab} />
          )}
        </main>
      </div>
    </div>
  )
}