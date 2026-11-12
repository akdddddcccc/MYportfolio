// The standalone page imports the same static module. Keep it out of the
// portfolio's initial bundle: no canvas or sample photo is needed on the grid.
// A fully qualified same-origin URL keeps the dev server from rewriting this
// public ESM entry to a bundled "?import" request that won't exist on disk.
const workbenchUrl = new URL("/apps/focus-filter/workbench.mjs", window.location.origin).href;

export default {
  name: "FocusFilterWorkbench",
  props: { lang: { type: String, required: true } },
  data() {
    return { phase: "loading" };
  },
  mounted() {
    this.start();
  },
  beforeUnmount() {
    this.disposeWorkbench?.();
  },
  methods: {
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
