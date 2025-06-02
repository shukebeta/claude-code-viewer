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
    // Handle keyboard shortcuts
    const handleKeydown = (e: KeyboardEvent) => {
      // Ctrl+B for sidebar toggle
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault()
        toggleSidebar()
      }
      
      // Ctrl+W to close current tab
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault()
        if (activeTabId && tabs.length > 0) {
          const { removeTab } = useAppStore.getState()
          removeTab(activeTabId)
        }
      }
      
      // Ctrl+N to create new tab
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        const { addTab, setActiveTab } = useAppStore.getState()
        const newTabId = `new-tab-${Date.now()}`
        addTab(
          { id: newTabId, filePath: '', projectPath: '', messageCount: 0, totalCost: 0 } as any,
          { name: 'New Tab', path: '', sessionCount: 0 }
        )
        setActiveTab(newTabId)
      }
      
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
      
      // Cmd/Ctrl + 0 to reset zoom
      if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        document.documentElement.style.fontSize = '16px'
      }
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