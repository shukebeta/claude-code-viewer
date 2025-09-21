async function fetchJSON(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Fetch error')
  return res.json()
}

function el(tag, txt) { const e = document.createElement(tag); if (txt) e.textContent = txt; return e }

async function loadProjects() {
  const container = document.getElementById('projects')
  container.innerHTML = 'Loading...'
  try {
    const projects = await fetchJSON('/api/projects')
    container.innerHTML = ''
    projects.forEach(p => {
      const b = el('button', `${p.name} (${p.sessionCount})`)
      b.style.display = 'block'
      b.onclick = () => loadSessions(p.name)
      container.appendChild(b)
    })
    if (projects.length === 0) container.textContent = 'No projects found'
  } catch (e) { container.textContent = 'Error loading projects' }
}

async function loadSessions(projectName) {
  const container = document.getElementById('sessions')
  container.innerHTML = 'Loading...'
  try {
    const sessions = await fetchJSON(`/api/sessions?project=${encodeURIComponent(projectName)}`)
    container.innerHTML = ''
    sessions.forEach(s => {
      const btn = el('button', `${s.id} — ${s.messageCount} msgs`)
      btn.style.display = 'block'
      btn.onclick = () => loadSessionMessages(s.filePath)
      const meta = el('div', s.preview || '')
      meta.style.fontSize = '12px'
      container.appendChild(btn)
      container.appendChild(meta)
    })
    if (sessions.length === 0) container.textContent = 'No sessions'
  } catch (e) { container.textContent = 'Error loading sessions' }
}

async function loadSessionMessages(filePath) {
  const container = document.getElementById('messages')
  container.innerHTML = 'Loading...'
  try {
    const msgs = await fetchJSON(`/api/session?file=${encodeURIComponent(filePath)}`)
    container.innerHTML = ''
    msgs.forEach(m => {
      const box = document.createElement('div')
      box.style.borderBottom = '1px solid #eee'
      box.style.padding = '8px'
      const who = el('div', m.type + ' — ' + (m.timestamp || ''))
      who.style.fontWeight = '600'
      const content = el('pre', JSON.stringify(m.message || m.content || m, null, 2))
      box.appendChild(who)
      box.appendChild(content)
      container.appendChild(box)
    })
    if (msgs.length === 0) container.textContent = 'No messages'
  } catch (e) { container.textContent = 'Error loading messages' }
}

loadProjects()
