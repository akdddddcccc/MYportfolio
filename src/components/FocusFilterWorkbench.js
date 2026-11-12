// The standalone page imports the same static module. Keep it out of the
// portfolio's initial bundle: no canvas or sample photo is needed on the grid.
// A fully qualified same-origin URL keeps the dev server from rewriting this
// public ESM entry to a bundled "?import" request that won't exist on disk.
const workbenchUrl = new URL("/apps/focus-filter/workbench.js", window.location.origin).href;

export default {
  name: "FocusFilterWorkbench",
  props: { lang: { type: String, required: true } },
  data() {
    return { phase: "loading", savingOffline: false, offlineError: false };
  },
  mounted() {
    this.start();
  },
  beforeUnmount() {
    this.disposeWorkbench?.();
  },
  methods: {
    async saveOffline() {
      if (this.savingOffline) return;
      this.savingOffline = true; this.offlineError = false;
      try {
        const url = new URL("./offline.js", workbenchUrl).href;
        const { downloadOffline } = await import(/* @vite-ignore */ url);
        await downloadOffline(this.lang);
      } catch { this.offlineError = true; }
      finally { this.savingOffline = false; }
    },
    async start() {
      const host = this.$refs.surface;
      this.phase = "loading";
      try {
        const { mountFocusFilter } = await import(/* @vite-ignore */ workbenchUrl);
        if (this.$refs.surface !== host || !host.isConnected) return;
        this.disposeWorkbench = mountFocusFilter(host, { lang: this.lang });
        this.phase = "ready";
      } catch {
        if (this.$refs.surface === host) this.phase = "failed";
      }
    }
  },
  template: `
    <div class="focus-filter-workbench" :aria-busy="phase === 'loading'">
      <div ref="surface"></div>
      <div v-if="phase === 'ready'" class="focus-filter-offline">
        <button type="button" :disabled="savingOffline" @click="saveOffline">{{ lang === 'zh' ? '保存离线版' : 'Save offline copy' }}</button>
        <span v-if="offlineError" role="alert">{{ lang === 'zh' ? '打包失败，请联网后重试。' : 'Could not save. Reconnect and try again.' }}</span>
      </div>
      <p v-if="phase === 'loading'" class="focus-filter-status" role="status">
        {{ lang === 'zh' ? '正在打开照片工具…' : 'Opening the photo tool…' }}
      </p>
      <p v-else-if="phase === 'failed'" class="focus-filter-status" role="alert">
        {{ lang === 'zh' ? '照片工具未能加载。' : 'The photo tool could not be loaded.' }}
        <button type="button" @click="start">{{ lang === 'zh' ? '重试' : 'Try again' }}</button>
      </p>
    </div>
  `
};
