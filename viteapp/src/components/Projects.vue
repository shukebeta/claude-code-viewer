<template>
  <div>
    <h2>Projects</h2>
    <ul>
      <li v-for="p in projects" :key="p.name">
        <div class="project-card" @click="$emit('select-project', p)">
          <div class="project-title">{{ displayName(p) }}</div>
          <div class="project-path">{{ displayPath(p) }}</div>
          <div class="project-meta">{{ p.sessionCount }} sessions</div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  data() {
    return { projects: [] }
  },
  async mounted() {
    try {
      const res = await fetch('/api/projects')
      this.projects = await res.json()
    } catch (e) {
      console.error(e)
    }
  },
  methods: {
    // project.name is the sanitized name like '-home-davidwei-AndroidStudioProjects-happy-notes'
    displayName(p) {
      const raw = p.name || ''
      // If backend already resolved to a filesystem path, show the basename
      if (raw.includes('/') || raw.includes('\\')) {
        const parts = raw.split(/\\|\//).filter(Boolean)
        return parts.length ? parts[parts.length - 1] : raw
      }
      // fallback: take last segment after '-' and replace dashes with spaces
      const parts = raw.split('-').filter(Boolean)
      return parts.length ? parts[parts.length - 1].replace(/-/g, ' ') : raw
    },
    displayPath(p) {
      // show the resolved name (which may already be a full path) or fallback to stored path
      if (p.name && (p.name.includes('/') || p.name.includes('\\'))) return p.name.replace(/\\/g, '/')
      if (p.path) return p.path.replace(/\\/g, '/')
      return p.name
    }
  }
}
</script>

<style>
.project-card { padding: 8px; border: 1px solid #eee; border-radius: 6px; margin-bottom: 8px; cursor: pointer }
.project-title { font-weight: 600 }
.project-path { font-size: 12px; color: #666; margin-top: 4px }
.project-meta { font-size: 12px; color: #888; margin-top: 6px }
</style>
