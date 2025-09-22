<template>
  <div class="two-col">
    <div class="left">
      <h3>Users</h3>
      <div v-if="loading">Loading...</div>
      <ul v-else>
        <li v-for="u in users" :key="u.id">
          <button @click="selectUser(u)">{{ u.preview }}</button>
        </li>
      </ul>
    </div>
    <div class="right">
      <h3>Assistant Replies</h3>
      <div v-if="!selectedUser">Select a user message</div>
      <ul v-else>
        <li v-for="a in mapping[selectedUser.id] || []" :key="a.id" class="assistant-item">
          <div class="assistant-full"><MessageRenderer :content="a.content" /></div>
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
        const userObj = { id, preview, timestamp: m.timestamp }
        this.users.push(userObj)
        this.$set(this.mapping, id, [])
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
          this.$set(this.mapping, assigned.id, arr)
        } else {
          const key = '__no_user__'
          const arr = this.mapping[key] || []
          arr.push(assistantOut)
          this.$set(this.mapping, key, arr)
        }
      }
    },
    selectUser(u) { this.selectedUser = u }
      ,
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
.right { flex: 1; min-width: 0; height: 100%; min-height: 0; overflow: auto }
.right ul { padding: 0; margin: 0; list-style: none }
pre { white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere; margin: 0; }
</style>
