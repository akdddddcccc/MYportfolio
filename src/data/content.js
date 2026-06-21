export const content = {
  home: {
    logo: "/images/Group 12.png",
    en: {
      label: "ENGLISH",
      href: "#/en/projects/all",
      line: "-It's a blessing to be able to appreciate many arts"
    },
    zh: {
      label: "中文",
      href: "#/zh/projects/all",
      line: "-很感激对设计的学习让我得以欣赏到如此多的艺术形式作品"
    }
  },
  nav: {
    en: {
      about: "ABOUT ME",
      artwork: "ARTWORK",
      contact: "CONNECT"
    },
    zh: {
      about: "个人相关",
      artwork: "作品产出",
      contact: "联系方式"
    }
  },
  projectFilters: {
    en: [
      { key: "all", label: "All" },
      { key: "visual", label: "Visual Design" },
      { key: "ui", label: "UI Design" },
      { key: "product", label: "Industrial Product" },
      { key: "others", label: "Others" },
      { key: "unpublished", label: "Unpublished" },
      { key: "vibe-coding", label: "Vibe Coding" }
    ],
    zh: [
      { key: "all", label: "全部" },
      { key: "visual", label: "视觉设计" },
      { key: "ui", label: "UI 设计" },
      { key: "product", label: "工业产品设计" },
      { key: "others", label: "其他" },
      { key: "unpublished", label: "未公开" },
      { key: "vibe-coding", label: "vibe coding" }
    ]
  },
  about: {
    image: "/images/Mask Group.webp",
    en: {
      name: "陈沐阳",
      romanName: "CHEN MUYANG",
      sentence: "-Grateful that studying design has allowed me to appreciate so many art forms!",
      sections: [
        {
          title: "experience",
          body: "Graduated from Tianjin Nankai High School and studied at Jiangnan University."
        },
        {
          title: "skill tools",
          body: "-Figma, AI, PS   -Arduino, TouchDesigner\n-PR, AE   -Rhino, KeyShot\n-Procreate\n-Rap, basketball, photography, product photography"
        }
      ]
    },
    zh: {
      name: "陈沐阳",
      romanName: "CHEN MUYANG",
      sentence: "-很感激对设计的学习让我得以欣赏到如此多的艺术形式作品",
      sections: [
        {
          title: "经历",
          body: "毕业于天津南开中学，就读于江南大学。"
        },
        {
          title: "技能工具",
          body: "-Figma、AI、PS   -Arduino、TouchDesigner\n-PR、AE   -Rhino、KeyShot\n-Procreate\n-Rap、篮球、摄影、产品摄影"
        }
      ]
    }
  },
  contact: {
    image: "/images/concept-portrait-hd.png",
    items: [
      { label: "WeChat", value: "wxsbsdwlsjxy" },
      { label: "ins", value: "justinyang265" },
      { label: "Email", value: "278513492@qq.com" }
    ]
  }
};

export { projects, projectsByCategory, findProject } from './projects.js';
