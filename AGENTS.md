# AGENTS.md

## Project
This is a React + Vite + TypeScript + Tailwind CSS frontend demo named study-agent-demo.

## Product Goal
Build a Chinese study task manager that turns five learning workflows into a closed-loop study system:
1. 习题导向筛选
2. 课件范围速懂
3. 单题讲解
4. 错题定位
5. 期末复习规划

## Current Version
Current version is v0.1 local closed-loop prototype.

Current implemented capabilities:
- Five clickable study modes.
- Mock structured output generation.
- LocalStorage persistence.
- AssistantRun saving.
- StudyTask saving.
- MistakeRecord saving in 错题定位 mode.
- MasteryRecord saving.
- Local record detail panel.
- Task status update.
- Rule-based 期末复习规划 based on local tasks, mistakes, and mastery records.

## Hard Constraints
- Do not add backend unless explicitly requested.
- Do not add real AI calls unless explicitly requested.
- Do not add PDF parsing unless explicitly requested.
- Do not add file upload unless explicitly requested.
- Do not claim the app can truly read, parse, or verify uploaded lecture files.
- Keep all UI text in Chinese.
- Code comments must be in English only.
- Keep code beginner-friendly and component-based.

## Required Output Behavior
Every generated mock result must include:
1. 结论
2. 事实
3. 推断
4. 建议
5. 【不确定】
6. 如何验证
7. 建议下一步

## Data Rules
Use the existing TypeScript types in:
- src/types/study.ts

Use the existing localStorage helpers in:
- src/lib/storage.ts

Do not rewrite the whole app when a small change is enough.

## Verification
Before finishing any coding task, run:
npm run build
