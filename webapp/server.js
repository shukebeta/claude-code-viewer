const express = require('express')
const path = require('path')
const cors = require('cors')
const fsHelpers = require('./fsHelpers')

const app = express()
app.use(cors())
app.use(express.json())

const PUBLIC_DIR = path.join(__dirname, 'public')
app.use(express.static(PUBLIC_DIR))

app.get('/api/projects', async (req, res) => {
  const projects = await fsHelpers.getProjects()
  res.json(projects)
})

app.get('/api/sessions', async (req, res) => {
  const project = req.query.project
  if (!project) return res.status(400).json({ error: 'project query required' })
  const sessions = await fsHelpers.getSessions(project)
  res.json(sessions)
})

app.get('/api/session', async (req, res) => {
  const file = req.query.file
  if (!file) return res.status(400).json({ error: 'file query required' })
  const messages = await fsHelpers.readSessionFile(file)
  res.json(messages)
})

app.get('/api/session-mapping', async (req, res) => {
  const file = req.query.file
  if (!file) return res.status(400).json({ error: 'file query required' })
  const mapping = await fsHelpers.mapSessionMessages(file)
  res.json(mapping)
})

const port = process.env.PORT || 5173
app.listen(port, () => console.log(`Claude webapp listening on http://localhost:${port}`))
