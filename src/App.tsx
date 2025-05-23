import React, { useEffect } from 'react'
import { ThemeProvider } from 'next-themes'
import { Layout } from '@/components/Layout/Layout'
import { useAppStore } from '@/store/appStore'
import './styles/globals.css'

function App(): JSX.Element {
  const { setProjects } = useAppStore()
  
  useEffect(() => {
    // Load projects on app start
    loadProjects()
  }, [])
  
  const loadProjects = async () => {
    try {
      const projects = await window.api.readDirectory('projects')
      setProjects(projects)
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }
  
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Layout />
    </ThemeProvider>
  )
}

export default App