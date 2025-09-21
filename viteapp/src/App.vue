<template>
  <div class="app-root">
    <h1>Claude Vite App</h1>
    <div class="layout">
      <div class="col projects-col">
        <Projects @select-project="onSelectProject" />
      </div>
      <div class="col sessions-col">
        <Sessions v-if="project" :project="project" @select-session="onSelectSession" />
      </div>
      <main class="main">
        <TwoColumnViewer v-if="sessionFile" :file="sessionFile" />
        <div v-else class="placeholder">Select a session to view</div>
      </main>
    </div>
  </div>
</template>

<script>
import Projects from './components/Projects.vue'
import Sessions from './components/Sessions.vue'
import TwoColumnViewer from './components/TwoColumnViewer.vue'

export default {
  components: { Projects, Sessions, TwoColumnViewer },
  data() {
    return { project: null, sessionFile: null }
  },
  methods: {
    onSelectProject(p) {
      this.project = p
      this.sessionFile = null
    },
    onSelectSession(file) {
      this.sessionFile = file
    }
  }
}
</script>

<style>
.app-root { display: flex; flex-direction: column; height: 100vh }
.app-root h1 { margin: 12px 16px }
.layout { display: flex; gap: 16px; flex: 1; min-height: 0 }
.col { padding: 8px; box-sizing: border-box; min-height: 0 }
.projects-col { width: 260px; border-right: 1px solid #eee }
.sessions-col { width: 320px; border-right: 1px solid #eee }
.main { flex: 1; padding-left: 12px; min-width: 0; min-height: 0 }
.col, .main { overflow: auto }
.placeholder { color: #666 }
</style>
