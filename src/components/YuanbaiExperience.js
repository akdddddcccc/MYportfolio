import "../styles/yuanbai-experience.css";

export default {
  name: "YuanbaiExperience",
  props: { lang: { type: String, default: "zh" } },
  data() { return { active: "game", started: false }; },
  computed: {
    zh() { return this.lang === "zh"; },
    url() { return "https://apps-demo.muyang23333.top/yuanbai/" + (this.active === "game" ? "explore/" : "dialogue/"); }
  },
  methods: { select(mode) { this.active = mode; this.started = false; } },
  template: `
    <section class="yuanbai-experience">
      <div class="yuanbai-experience__intro">
        <article><span>01 / PLAY</span><h2>{{ zh ? '探索元白' : 'Explore Yuanbai' }}</h2>
          <p>{{ zh ? '在有限视野中行走，用同伴提示、直线探测与短暂全景感知未知空间。探索安全格、记住悬崖，在逐渐增长的感知压力中拼出建筑的完整印象。' : 'Navigate with limited visibility, discover safe tiles and remember cliffs. Companion hints, directional probes and brief panoramas help you reconstruct the building under growing perceptual pressure.' }}</p>
        </article>
        <article><span>02 / TALK</span><h2>{{ zh ? '对话元白' : 'Talk to Yuanbai' }}</h2>
          <p>{{ zh ? '将元白楼人格化为温和、沉稳的“元白长者”。通过语音聊建筑、校园与生活，让知识与记忆成为对话；楼体的灯光和动画随声音响应。' : 'Meet Yuanbai as a calm, warm elder. Voice conversations connect architectural and campus knowledge with personal encounters, while the building’s light and motion respond to sound.' }}</p>
        </article>
      </div>
      <div class="yuanbai-experience__toolbar">
        <div role="group" :aria-label="zh ? '选择体验' : 'Choose an experience'">
          <button :aria-pressed="active === 'game'" @click="select('game')">{{ zh ? '探索游戏' : 'Exploration game' }}</button>
          <button :aria-pressed="active === 'agent'" @click="select('agent')">{{ zh ? '对话 Agent' : 'Conversational agent' }}</button>
        </div>
        <a :href="url" target="_blank" rel="noopener noreferrer">{{ zh ? '独立窗口体验 ↗' : 'Open experience ↗' }}</a>
      </div>
      <div class="yuanbai-experience__stage">
        <iframe v-if="started" :key="active" :src="url" :title="active === 'game' ? '探索元白游戏' : '元白对话 Agent'" allow="microphone; autoplay; fullscreen" allowfullscreen></iframe>
        <div v-else class="yuanbai-experience__start">
          <span>{{ active === 'game' ? 'EXPLORE / YUANBAI' : 'DIALOGUE / YUANBAI' }}</span>
          <h2>{{ active === 'game' ? (zh ? '在看不见的地方，重新认识元白。' : 'Discover Yuanbai beyond what you can see.') : (zh ? '让建筑成为可以对话的伙伴。' : 'Let architecture become a conversational companion.') }}</h2>
          <button @click="started = true">{{ zh ? '开始体验 ↗' : 'Start experience ↗' }}</button>
          <p>{{ zh ? '手机和电脑均可体验。对话体验需要允许使用麦克风。' : 'Available on mobile and desktop. Voice conversation requires microphone access.' }}</p>
        </div>
      </div>
      <article class="yuanbai-experience__credit">
        <h2>{{ zh ? '我的工作' : 'My contribution' }}</h2>
        <p>{{ zh ? '对话技术路线验证 · 网页架构搭建落地 · 探索游戏 UI 升级 · Agent 语料库构建 · Logo 设计 · 游戏内部排名系统搭建' : 'Conversation technology validation · Web architecture and implementation · Game UI refinement · Agent knowledge base · Logo design · In-game leaderboard' }}</p>
        <p>{{ zh ? '团队：陈沐阳、郭皓彦、何任选、陈冠霖、董帅。游戏玩法、交互动画、三维模型与汇报由团队协作完成。' : 'Team: Chen Muyang, Guo Haoyan, He Renxuan, Chen Guanlin and Dong Shuai. Gameplay, interaction animation, 3D modelling and presentation were developed collaboratively.' }}</p>
      </article>
    </section>`
};
