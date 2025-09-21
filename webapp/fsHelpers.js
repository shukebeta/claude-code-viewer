const fs = require('fs').promises
const path = require('path')
const os = require('os')

const CLAUDE_PROJECTS_PATH = path.join(os.homedir(), '.claude', 'projects')

async function getProjects() {
  try {
    const entries = await fs.readdir(CLAUDE_PROJECTS_PATH, { withFileTypes: true })
    const projects = []
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const projectPath = path.join(CLAUDE_PROJECTS_PATH, entry.name)
        const sessions = await fs.readdir(projectPath)
        const sessionFiles = sessions.filter(f => f.endsWith('.jsonl'))
        projects.push({ name: entry.name, path: projectPath, sessionCount: sessionFiles.length })
      }
    }
    return projects
  } catch (e) {
    return []
  }
}

async function getSessions(projectName) {
  try {
    const projectPath = path.isAbsolute(projectName)
      ? projectName
      : path.join(CLAUDE_PROJECTS_PATH, projectName.replace(/\//g, '-'))

    const files = await fs.readdir(projectPath)
    const sessions = []

    for (const file of files) {
      if (file.endsWith('.jsonl')) {
        const filePath = path.join(projectPath, file)
        const stats = await fs.stat(filePath)
        const content = await fs.readFile(filePath, 'utf8')
        const lines = content.trim().split('\n')

        let startTime, endTime
        let messageCount = 0
        let totalCost = 0
        const recentMessages = []

        for (const line of lines) {
          try {
            const data = JSON.parse(line)
            if (data.timestamp) {
              const ts = new Date(data.timestamp)
              if (!startTime || ts < startTime) startTime = ts
              if (!endTime || ts > endTime) endTime = ts
            }
            if (data.type === 'user' || data.type === 'assistant') {
              messageCount++
              let messageText = ''
              if (data.message && data.message.content) {
                if (typeof data.message.content === 'string') messageText = data.message.content
                else if (Array.isArray(data.message.content)) {
                  const t = data.message.content.find(i => i.type === 'text')
                  if (t && t.text) messageText = t.text
                }
              } else if (data.content) {
                messageText = typeof data.content === 'string' ? data.content : ''
              }
              if (messageText) {
                recentMessages.push(messageText.substring(0, 150))
                if (recentMessages.length > 3) recentMessages.shift()
              }
            }
            if (data.costUSD) totalCost += data.costUSD
          } catch (e) {
            // skip
          }
        }

        let sessionId = path.basename(file, '.jsonl')
        if (lines.length > 0) {
          try {
            const first = JSON.parse(lines[0])
            if (first.sessionId) sessionId = first.sessionId
          } catch (e) {}
        }

        sessions.push({
          id: sessionId,
          projectPath,
          filePath,
          startTime: startTime ? startTime.toISOString() : undefined,
          endTime: endTime ? endTime.toISOString() : undefined,
          mtime: stats.mtime,
          messageCount,
          totalCost,
          preview: recentMessages.join('\n').substring(0, 200)
        })
      }
    }

    sessions.sort((a, b) => {
      if (!a.mtime || !b.mtime) return 0
      return b.mtime.getTime() - a.mtime.getTime()
    })

    return sessions
  } catch (e) {
    return []
  }
}

async function readSessionFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8')
    const lines = content.trim().split('\n')
    const messages = []
    for (const line of lines) {
      try { messages.push(JSON.parse(line)) } catch (e) {}
    }
    return messages
  } catch (e) {
    return []
  }
}

module.exports = { getProjects, getSessions, readSessionFile }
