<template>
  <div class="two-col">
    <div class="left">
      <h3>Users</h3>
      <div v-if="loading">Loading...</div>
      <ul v-else>
        <li v-for="u in users" :key="u.id" class="user-item" :class="{ selected: selectedUser && selectedUser.id === u.id }">
          <button class="user-preview" @click="selectUser(u)">
            <MessageRenderer :content="u.content || u.preview || ''" />
          </button>
        </li>
      </ul>
    </div>
    <div class="right">
      <h3>Assistant Replies</h3>
      <div v-if="!selectedUser">Select a user message</div>
      <ul v-else>
        <li v-for="a in mapping[selectedUser.id] || []" :key="a.id" class="assistant-item">
          <div class="assistant-card card" style="position:relative">
            <button class="copy-btn" :class="{ copied: a._copied }" @click.prevent="copyReply(a)" :title="a._copied ? 'Copied' : 'Copy reply'">
              <svg v-if="!a._copied" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
            </button>
            <div class="assistant-full"><MessageRenderer :content="a.content" /></div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import MessageRenderer from './MessageRenderer.vue'

export default {
  components: { MessageRenderer },
  props: ['file'],
  data() {
    return { users: [], mapping: {}, loading: false, selectedUser: null, es: null }
  },
  async mounted() { await this.load() },
  watch: { file: { immediate: true, handler() { this.load() } } },
  methods: {
    async load() {
      if (!this.file) return
      this.loading = true
      try {
        const res = await fetch('/api/session-mapping?file=' + encodeURIComponent(this.file))
        const json = await res.json()
        this.users = json.users || []
        this.mapping = json.mapping || {}
        this.selectedUser = null
        // setup SSE
        this.cleanupEventSource()
        try {
          this.es = new EventSource('/api/events?file=' + encodeURIComponent(this.file))
          this.es.addEventListener('session_appended', (ev) => {
            try {
              const d = JSON.parse(ev.data)
              // d: { file, line }
              const m = JSON.parse(d.line)
              // Re-map single appended message
              this.integrateMessage(m)
            } catch (e) { console.error('SSE parse error', e) }
          })
        } catch (e) { console.error('EventSource error', e) }
      } catch (e) { console.error(e) }
      this.loading = false
    },
    cleanupEventSource() {
      if (this.es) {
        try { this.es.close() } catch (e) {}
        this.es = null
      }
    },
  integrateMessage(m) {
      // Normalize similar to server mapping: determine id, type, content
      const id = m.uuid || (m.message && m.message.id) || `i_${Date.now()}`
      let rawType = m.type
      let type = rawType

      // If message type indicates a tool, treat as assistant
      if (type === 'tool_use' || type === 'tool_result' || type === 'tool') type = 'assistant'
      if (!type && m.message && m.message.role) type = m.message.role

      // If message content contains tool entries, treat as assistant
      const contentCandidate = (m.message && m.message.content) || m.content
      if (Array.isArray(contentCandidate)) {
        for (const item of contentCandidate) {
          if (item && (item.type === 'tool_result' || item.type === 'tool_use' || item.type === 'tool')) {
            type = 'assistant'
            break
          }
        }
      }

      const content = (m.message && (m.message.content || m.message)) || m.content || m

      // If rawType starts with 'tool', force assistant
      if (typeof rawType === 'string' && rawType.startsWith('tool')) type = 'assistant'

      if (type === 'user') {
        const preview = (typeof content === 'string' ? content : JSON.stringify(content)).substring(0,200)
        const userObj = { id, preview, content, timestamp: m.timestamp }
  this.users.push(userObj)
  this.mapping[id] = []
      } else {
        // If this is a tool_result that references a parent assistant, try to merge
        if (rawType === 'tool_result' && m.parentUuid) {
          // find assistant in mappings by id or raw.uuid
          let found = null
          for (const [k, arr] of Object.entries(this.mapping)) {
            found = arr.find(a => a.id === m.parentUuid || (a.raw && a.raw.uuid === m.parentUuid))
            if (found) {
              // append to found.content
              if (Array.isArray(found.content)) found.content.push(content)
              else found.content = [found.content, content]
              return
            }
          }
        }

        // assign to explicit parent user or fall back to last user
        let assigned = null
        if (m.parentUuid) assigned = this.users.find(u => u.id === m.parentUuid)
        if (!assigned && this.users.length > 0) assigned = this.users[this.users.length - 1]
  const assistantOut = { id, content, timestamp: m.timestamp, raw: m }
        if (assigned) {
          const arr = this.mapping[assigned.id] || []
          arr.push(assistantOut)
          this.mapping[assigned.id] = arr
        } else {
          const key = '__no_user__'
          const arr = this.mapping[key] || []
          arr.push(assistantOut)
          this.mapping[key] = arr
        }
      }
    },
    selectUser(u) { this.selectedUser = u }
      ,
    async copyReply(a) {
      // optimistic feedback: set copied state immediately
      try {
  const txt = this.extractText(a.content)
  a._copied = true
        // attempt standard clipboard API
            if (navigator.clipboard && navigator.clipboard.writeText) {
          try {
            await navigator.clipboard.writeText(txt)
          } catch (err) {
            // fallback to legacy approach
            this.fallbackCopyTextToClipboard(txt)
          }
        } else {
          this.fallbackCopyTextToClipboard(txt)
        }
      } catch (e) {
  console.error('copy failed', e)
  a._copied = false
      } finally {
        setTimeout(() => { a._copied = false }, 1500)
      }
    },
    extractText(c) {
      if (!c) return ''
      if (typeof c === 'string') return c
      if (Array.isArray(c)) return c.map(item => this.extractText(item)).join('\n')
      if (typeof c === 'object') {
        if (c.text) return c.text
        if (c.content && typeof c.content === 'string') return c.content
        if (c.input && c.input.todos) return c.input.todos.map(t => (t.status ? `[${t.status}] ` : '') + (t.content||t.text||t.title||'')).join('\n')
        if (c.result && c.result.content) return typeof c.result.content === 'string' ? c.result.content : JSON.stringify(c.result.content)
        return JSON.stringify(c)
      }
      return String(c)
    },
    // fallback copy method
    fallbackCopyTextToClipboard(text) {
      const textArea = document.createElement('textarea')
      textArea.value = text
      // Avoid scrolling to bottom
      textArea.style.top = '0'
      textArea.style.left = '0'
      textArea.style.position = 'fixed'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        document.execCommand('copy')
      } catch (err) {
        console.error('fallback: Oops, unable to copy', err)
      }
      document.body.removeChild(textArea)
    },
    // preview/expand logic removed: assistant messages render fully by default
  }
}
</script>

<style>
.two-col { display: flex; gap: 12px; height: 100%; min-height: 0 }
.left { width: 320px; height: 100%; min-height: 0; overflow: auto }
.left ul { padding: 0; margin: 0; list-style: none }
.left li { margin-bottom: 6px }
.left button { display: block; width: 100%; text-align: left; padding: 8px; border: 1px solid #eee; border-radius: 4px; background: white; box-sizing: border-box }
.left button:hover { background: #fafafa }
.left li.selected .user-preview { background: rgba(37,99,235,0.08); border-color: rgba(37,99,235,0.12) }
.right { flex: 1; min-width: 0; height: 100%; min-height: 0; overflow: auto }
.right ul { padding: 0; margin: 0; list-style: none }
pre { white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere; margin: 0; }

/* compact dashed separator between assistant replies */
.right ul li.assistant-item { padding-top: 6px; }
.right ul li.assistant-item + li.assistant-item { border-top: 1px dashed rgba(15,23,36,0.06); margin-top: 6px; padding-top: 6px; }

/* assistant card copy button */
.assistant-card { padding: 8px; position: relative }
.copy-btn { position: absolute; top: 6px; right: 6px; border: none; background: rgba(255,255,255,0.02); color: inherit; padding:6px; border-radius:6px; cursor:pointer }
.copy-btn svg { display:block }
.copy-btn:hover { background: rgba(255,255,255,0.04) }
.copy-btn.copied { background: rgba(52,211,153,0.16); color: var(--success) }
</style>
