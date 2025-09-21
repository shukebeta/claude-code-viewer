<template>
  <div>
    <h3>Sessions for {{ project.name }}</h3>
    <div v-if="loading">Loading...</div>
    <ul v-else>
      <li v-for="s in sessions" :key="s.filePath">
        <button @click="$emit('select-session', s.filePath)">{{ s.preview || s.id }} ({{ s.messageCount }})</button>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  props: ['project'],
  data() { return { sessions: [], loading: false } },
  watch: {
    project: {
      immediate: true,
      handler() { this.load() }
    }
  },
  methods: {
    async load() {
      if (!this.project) return
      this.loading = true
      try {
        const key = this.project.id || this.project.name
        const res = await fetch('/api/sessions?project=' + encodeURIComponent(key))
        this.sessions = await res.json()
      } catch (e) { console.error(e) }
      this.loading = false
    }
  }
}
</script>
