# portfolio
https://www.figma.com/design/QH1y3UZqFdc4l5afBv7jEW/personal-website?node-id=0-1&amp;t=MDZdMTAAVNIn6wCS-1
***
![image](https://github.com/akdddddcccc/portfolio/assets/93926035/1099987c-9dc1-4bd6-9bfa-c864ad052bb9)
根据figma设计自学前端制作的作品集网站，仅以此项目记录流程

## 任务拆分工具整合说明

本仓库已新增一个可直接静态部署的任务拆分工具页面：

- 中文入口：`chin-page/task_divide.html`
- 英文入口：`eng-page/task_divide.html`
- 入口卡片已加入中英文工作作品集页。

功能结构参考 `task-divide.vercel.app` 的任务管理核心：新建任务、按步骤拆分、勾选子任务、统计完成度。为了适配 `muyang23333.top` 的常规 UI 风格，页面使用当前作品集的 MiSans / Inter 字体体系、黑白高对比、虚线边框、硬阴影和本地静态资源。

部署方式：本工具没有后端依赖，数据保存在访问者浏览器的 `localStorage` 中。将仓库作为静态站点部署到 Vercel、Netlify、GitHub Pages 或当前域名服务器即可访问新增页面。
