import "../styles/cloud-form-demo.css";

export default {
  name: "CloudFormDemo",
  props: {
    lang: { type: String, required: true },
    returnKind: { type: String, default: "all" }
  },
  mounted() {
    document.body.classList.add("cloud-form-immersive");
  },
  beforeUnmount() {
    document.body.classList.remove("cloud-form-immersive");
  },
  template: `
    <section class="cloud-form-demo" :aria-label="lang === 'zh' ? 'Cloud Form 点云形体实验' : 'Cloud Form point cloud study'">
      <iframe
        class="cloud-form-demo__frame"
        src="/apps/cloud-form/?mode=particles&embed=portfolio"
        :title="lang === 'zh' ? 'Cloud Form 点云形体实验' : 'Cloud Form point cloud study'"
      ></iframe>
      <a class="cloud-form-demo__back" :href="'#/' + lang + '/projects/' + returnKind">
        {{ lang === 'zh' ? '← 返回作品列表' : '← Back to projects' }}
      </a>
    </section>
  `
};
