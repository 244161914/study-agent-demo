# study-agent-demo

A local-first Chinese study task manager demo that turns exercises, mistakes, mastery, and review planning into a closed-loop workflow.

## 中文简介

`study-agent-demo` 是一个 React + Vite + TypeScript + Tailwind CSS 前端作品集项目。它面向学生的复习场景，把“做题、看课件、讲解、纠错、期末规划”整理成一个可点击、可保存、可导出的本地学习闭环。

当前版本不接真实 AI、不解析 PDF、不上传文件、不做云同步。当前版本用于展示本地学习闭环和结构化学习任务管理。

## 在线 Demo

[https://study-agent-demo.vercel.app/](https://study-agent-demo.vercel.app/)

## GitHub 仓库

[https://github.com/244161914/study-agent-demo](https://github.com/244161914/study-agent-demo)

## Demo 截图

截图文件暂未加入仓库。请将首页截图放在 `public/demo-home.png`，用于展示当前 v0.1.6 本地闭环原型界面。

## 核心问题

很多学生复习时会遇到三个问题：

- 不知道一道题到底对应哪些课件范围。
- 错题只被收藏，没有转化成下一步任务。
- 复习计划和真实薄弱点脱节，缺少可回看的闭环记录。

## 解决方案

本项目把学习过程拆成五个模式，并用 localStorage 保存每次 mock 生成结果、下一步任务、错题原因和掌握度自评。返回页面时，顶部行动区会根据本地记录推荐“当前最该做”的任务。

## 核心流程

1. 习题导向筛选
2. 课件范围速懂
3. 单题讲解
4. 错题定位
5. 期末复习规划

推荐路径：选模式 → 填示例 → 生成结果 → 保存下一步任务。

## 功能特性

- 五个学习模式卡片，支持点击切换当前模式。
- 顶部行动面板推荐下一步任务。
- 每个模式提供“填入示例”按钮。
- 生成结构化 mock 结果，固定包含：结论、事实、推断、建议、【不确定】、如何验证、建议下一步。
- 使用 localStorage 保存本地学习记录。
- 保存 AssistantRun、StudyTask、MistakeRecord、MasteryRecord。
- 支持任务状态切换：待做、进行中、已完成。
- 错题定位模式支持错因选择。
- 掌握度自评使用 0-4 等级。
- 期末复习规划会基于本地任务、错题和掌握度记录生成规则式 mock 计划。
- 本地记录详情支持折叠查看。
- 支持清空本地演示数据。
- 支持导出本地记录为 Markdown。

## 当前限制

- 不接真实 AI。
- 不解析 PDF。
- 不上传文件。
- 不读取或验证课件文件。
- 不提供后端服务。
- 不提供登录、账号、多设备同步或云同步。
- 所有生成结果都是前端规则和 mock 数据，用于展示学习闭环结构。

## 技术栈

- React
- Vite
- TypeScript
- Tailwind CSS
- localStorage

## 本地运行

```bash
npm install
npm run dev
```

构建检查：

```bash
npm run build
```

## 路线图

- v0.1.x：本地闭环学习任务管理
- v0.2：AI 处理粘贴文本
- v0.3：文本课件库
- v0.4：PDF 文本提取与页码切片
- v1.0：上传课件 + AI + 页码引用 + 复习闭环

## 版本历史

- v0.1.2：新增每个模式的填入示例。
- v0.1.3：优化首次使用路径，让新用户更快到达输入区。
- v0.1.4：新增行动面板，让返回用户看到下一步推荐。
- v0.1.5：优化行动面板文案、空状态和模式卡片选中态。
- v0.1.6：补充作品集展示信息、路线图、在线 Demo 和 GitHub 链接。
