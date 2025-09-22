<template>
  <div class="message-renderer">
    <div v-if="isTodoWrite" class="todo-container">
      <div class="todo-list" v-html="todoHtml"></div>
      <div v-if="systemNote" class="system-note" v-html="escapeHtml(systemNote)"></div>
    </div>
    <div v-else v-html="html"></div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { marked } from 'marked'

const props = defineProps({ content: { type: [Object, Array, String], required: true } })


function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function renderPlain(c) {
  if (typeof c === 'string') return escapeHtml(c)
  if (Array.isArray(c)) return c.map(renderPlain).join('<br/>')
  if (c && typeof c === 'object') return escapeHtml(c.text || JSON.stringify(c))
  return ''
}

function renderCode(c) {
  const code = (c && (c.code || c.text)) || ''
  return `<pre class="code-block"><code>${escapeHtml(code)}</code></pre>`
}

function renderToolResult(c) {
  const v = c && (c.content || c.text) || ''
  if (!v) return ''
  // if looks like JSON
  try {
    const parsed = JSON.parse(v)
    return `<pre class="tool-result">${escapeHtml(JSON.stringify(parsed, null, 2))}</pre>`
  } catch (e) {
    // fallback: render as markdown if it seems markdown-y, else plain
    if (String(v).includes('\n') || /\[[ x\-]\]|#{1,6} /m.test(String(v))) {
      return `<div class="tool-result">${marked.parse(String(v))}</div>`
    }
    return `<pre class="tool-result">${escapeHtml(String(v))}</pre>`
  }
}

function renderJson(c) {
  try {
    const obj = c && (c.value || c.content) || c
    return `<pre class="json-content">${escapeHtml(JSON.stringify(obj, null, 2))}</pre>`
  } catch (e) { return `<pre class="json-content">${escapeHtml(String(c))}</pre>` }
}

function renderImage(c) {
  const src = c && (c.url || c.src || c.content) || ''
  return `<div class="image-content"><img src="${escapeHtml(src)}" alt="image"/></div>`
}

function renderMarkdown(c) {
  const src = (c && (c.text || c.content)) || ''
  return marked.parse(String(src))
}

function renderTodoWrite(c) {
  // Expecting structure like: { input: { todos: [ { id, content, status } ] } }
  const todos = (c && c.input && c.input.todos) || (c && c.todos) || null
  if (!Array.isArray(todos)) return ''
  const lines = todos.map(t => {
    const status = (t.status || '').toLowerCase()
    const marker = status === 'completed' || status === 'done' || status === 'x' ? '[x]' : (status === 'in_progress' || status === 'doing' || status === 'doing' ? '[-]' : '[ ]')
    return `${marker} ${String(t.content || t.text || t.title || '').trim()}`
  })
  return marked.parse(lines.join('\n'))
}

function renderReadTool(c) {
  // Expecting structure like: { input: { path, content } } or { result: { content } }
  const asContent = (c && (c.result && c.result.content)) || (c && (c.content || c.text)) || (c && c.input && c.input.content) || ''
  // If content is an object with code field, prefer that
  const code = (typeof asContent === 'object' && (asContent.code || asContent.text)) ? (asContent.code || asContent.text) : asContent
  // Render inside a code block; try to preserve language if provided
  const lang = (c && c.language) || (c && c.input && c.input.language) || ''
  const escaped = escapeHtml(String(code || ''))
  return `<pre class="code-block"><code${lang ? ` class="language-${escapeHtml(lang)}"` : ''}>${escaped}</code></pre>`
}

function contentToHtml(c) {
  if (Array.isArray(c)) return c.map(contentToHtml).join('<br/>')

  // If it's a plain string, check special cases first (interruptions/commands)
  if (typeof c === 'string') {
    const s = c.trim()
    if (/request interrupted by user/i.test(s)) return `<div class="interruption">- user interruption -</div>`
    const mcmd = s.match(/<command-message>(.*?)<\/command-message>/i) || s.match(/<command-name>(.*?)<\/command-name>/i)
    if (mcmd && mcmd[1]) {
      const cmd = mcmd[1].trim()
      return `<div class="command-msg">command: ${escapeHtml(cmd.startsWith('/') ? cmd : '/' + cmd)}</div>`
    }
    return escapeHtml(c)
  }
  if (!c || typeof c !== 'object') return escapeHtml(String(c))

  // Extract a flat textual representation for special-case checks
  const flat = (c && ((c.text && String(c.text)) || (c.content && typeof c.content === 'string' && c.content) || (c.message && (c.message.content || c.message.text)))) || ''
  if (typeof flat === 'string' && /request interrupted by user/i.test(flat)) {
    return `<div class="interruption">- user interruption -</div>`
  }

  const t = c.type || (c.message && c.message.type) || null
  if (t === 'text' || t === 'message' || t === 'paragraph') return renderPlain(c)
  if (t === 'code' || t === 'program' || c.language) return renderCode(c)
  if (t === 'tool_result') return renderToolResult(c)
  // tool_use specific handlers
  if ((c.name === 'TodoWrite' || c.toolName === 'TodoWrite' || (c.message && c.message.name === 'TodoWrite')) ) {
    return renderTodoWrite(c)
  }
  // read tool: auto-expand and show code block
  if ((c.name === 'Read' || c.toolName === 'Read' || (c.action && c.action === 'read') || (c.message && c.message.name === 'Read') || (c.type === 'read'))) {
    return renderReadTool(c)
  }
  if (t === 'image') return renderImage(c)
  if (t === 'json' || t === 'object') return renderJson(c)
  if (t === 'markdown') return renderMarkdown(c)

  // Heuristics: tool_result-like structures
  if (c.type === 'tool_result' || (c.content && typeof c.content === 'string' && c.content.trim().startsWith('{'))) {
    return renderToolResult(c)
  }

  // Special-case: command-message blocks
  // e.g. <command-message>clear</command-message>
  if (typeof flat === 'string' && /<command-message>(.*?)<\/command-message>/i.test(flat)) {
    const m = flat.match(/<command-message>(.*?)<\/command-message>/i)
    const cmd = m && m[1] ? m[1].trim() : ''
    return `<div class="command-msg">command: ${escapeHtml(cmd.startsWith('/') ? cmd : '/' + cmd)}</div>`
  }

  // fallback: if has content array, render recursively
  if (c.content && Array.isArray(c.content)) return contentToHtml(c.content)

  // final fallback
  return escapeHtml(c.text || c.content || JSON.stringify(c))
}

const html = computed(() => contentToHtml(props.content))

// cleaned up: tool-use summary/expand logic removed

const detailHtml = computed(() => {
  // render full content using contentToHtml but prefer markdown for tool_result
  const c = props.content
  if (!c) return ''
  // if it contains a textual content that looks like markdown, use marked
  const text = (c.content || c.text || (c.message && (c.message.content || c.message.text)))
  if (typeof text === 'string' && (text.includes('\n') || /\[[ x\-]\]|#{1,6} /m.test(text))) {
    return marked.parse(text)
  }
  return contentToHtml(c)
})

const isTodoWrite = computed(() => {
  const c = props.content
  if (!c) return false
  return (c.name === 'TodoWrite' || c.toolName === 'TodoWrite' || (c.message && c.message.name === 'TodoWrite'))
})

const todoHtml = computed(() => {
  const c = props.content
  if (!c) return ''
  return renderTodoWrite(c)
})

const systemNote = computed(() => {
  const c = props.content
  if (!c) return ''
  // look for a free-text note outside the todos
  const text = (c.content || c.text || (c.message && (c.message.content || c.message.text)) || '')
  if (!text) return ''
  // if text contains the 'Todos have been' phrase or is short confirmation-like, treat as system note
  if (/Todos? have|modified|successfully|modified successfully/i.test(text)) return String(text)
  return ''
})
</script>

<style scoped>
.message-renderer { white-space: pre-wrap; }
.code-block { background: #f5f5f5; padding: 8px; border-radius: 4px; overflow-x: auto }
.tool-result { background: #fff9c4; padding: 8px; border-radius: 4px }
.json-content { background: #f0f7ff; padding: 8px; border-radius: 4px }
.image-content img { max-width: 100%; height: auto }
.tool-use { border: 1px solid #eee; padding: 8px; border-radius: 6px; margin-bottom: 8px }
.tool-summary { display:flex; justify-content:space-between; align-items:center }
.tool-summary .left { flex:1 }
.tool-summary .meta { color: #666; font-size: 12px }
.tool-detail { margin-top: 8px }
.todo-container { border: 1px solid #eee; padding: 8px; border-radius: 6px; background: #fff }
.todo-list ul { padding-left: 20px }
.system-note { color: #666; font-size: 12px; margin-top: 8px; display: none }
.todo-list:hover + .system-note, .todo-container:hover .system-note { display: block }
.interruption { color: #666; font-style: italic; }
.command-msg { color: #666; font-weight: 600 }
</style>
