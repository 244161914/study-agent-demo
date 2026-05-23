import { useState } from 'react'
import { ModeCard } from './components/ModeCard'
import { ModeDetailPanel } from './components/ModeDetailPanel'
import { studyModes, type StructuredMockResult } from './data/studyModes'
import {
  addAssistantRun,
  addMasteryRecord,
  addMistake,
  addTask,
  deleteCourse,
  getOrCreateDefaultCourse,
  updateTaskStatus,
} from './lib/storage'
import type {
  AssistantMode,
  AssistantRun,
  Course,
  MasteryLevel,
  MasteryRecord,
  MistakeReason,
  MistakeRecord,
  StudyTask,
} from './types/study'

const workflowText = studyModes.map((mode) => mode.name).join(' → ')

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function extractPageRange(input: string) {
  const match = input.match(/第\s*\d+\s*(-|到|至|~|—)\s*\d+\s*页|第\s*\d+\s*页|\d+\s*(-|到|至|~|—)\s*\d+\s*页/)

  return match?.[0] ?? ''
}

function formatStructuredResult(result: StructuredMockResult) {
  return [
    `结论：${result.conclusion}`,
    `事实：${result.facts}`,
    `推断：${result.inference}`,
    `建议：${result.suggestion}`,
    `【不确定】：${result.uncertainty}`,
    `如何验证：${result.verification}`,
    `建议下一步：${result.nextAction}`,
  ].join('\n')
}

function getModeName(mode: AssistantMode) {
  return studyModes.find((studyMode) => studyMode.assistantMode === mode)?.name ?? mode
}

function summarizeInput(input: string) {
  return input.length > 36 ? `${input.slice(0, 36)}...` : input
}

function deriveTopic(modeName: string, input: string) {
  const inputSummary = summarizeInput(input.trim())

  return inputSummary ? `${modeName}：${inputSummary}` : modeName
}

function getLatestItems<T>(items: T[]) {
  return items.slice(-5).reverse()
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function hasUncertainty(run: AssistantRun) {
  return run.output.includes('【不确定】') || run.uncertainty.trim().length > 0
}

function getMostCommonMistakeReason(mistakes: MistakeRecord[]) {
  const reasonCounts = mistakes.reduce<Record<string, number>>((counts, mistake) => {
    counts[mistake.reason] = (counts[mistake.reason] ?? 0) + 1

    return counts
  }, {})

  return Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
}

function getRecentLowMasteryTopic(mastery: MasteryRecord[]) {
  return [...mastery].reverse().find((record) => record.level <= 2)?.topic
}

function getLowestMasteryTopic(mastery: MasteryRecord[]) {
  const lowestRecord = [...mastery].sort((a, b) => a.level - b.level)[0]

  return lowestRecord?.topic
}

function getRecommendedTask(tasks: StudyTask[]) {
  const latestDoingTask = [...tasks].reverse().find((task) => task.status === 'doing')

  if (latestDoingTask) {
    return latestDoingTask
  }

  return [...tasks].reverse().find((task) => task.status === 'todo')
}

function getLatestTaskByStatus(tasks: StudyTask[], status: StudyTask['status']) {
  return [...tasks].reverse().find((task) => task.status === status)
}

function getLatestLowMasteryRecord(mastery: MasteryRecord[]) {
  return [...mastery].reverse().find((record) => record.level <= 1)
}

function getTaskPrompt(task: StudyTask) {
  const pageRangeText = task.relatedPageRange ? `；相关范围：${task.relatedPageRange}` : ''

  return `${task.title}${pageRangeText}`
}

function downloadTextFile(fileName: string, content: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

function createMarkdownExport(course: Course) {
  const lines = [
    '# study-agent-demo 本地学习记录',
    '',
    `课程：${course.name}`,
    `导出时间：${new Date().toLocaleString('zh-CN')}`,
    '',
    '## 生成记录',
    ...formatRunsForExport(course.runs),
    '',
    '## 任务',
    ...formatTasksForExport(course.tasks),
    '',
    '## 错题',
    ...formatMistakesForExport(course.mistakes),
    '',
    '## 掌握度记录',
    ...formatMasteryForExport(course.mastery),
    '',
  ]

  return lines.join('\n')
}

function formatRunsForExport(runs: AssistantRun[]) {
  if (runs.length === 0) {
    return ['暂无生成记录。']
  }

  return runs.map((run, index) =>
    [
      `${index + 1}. ${getModeName(run.mode)}`,
      `   - 创建时间：${formatDateTime(run.createdAt)}`,
      `   - 输入：${run.input}`,
      `   - 输出：${run.output.replace(/\n/g, ' / ')}`,
      `   - 不确定：${run.uncertainty}`,
      `   - 如何验证：${run.verificationMethod}`,
      `   - 下一步：${getModeName(run.nextMode)}`,
    ].join('\n'),
  )
}

function formatTasksForExport(tasks: StudyTask[]) {
  if (tasks.length === 0) {
    return ['暂无任务。']
  }

  return tasks.map((task, index) =>
    [
      `${index + 1}. ${task.title}`,
      `   - 状态：${task.status}`,
      `   - 来源模式：${getModeName(task.sourceMode)}`,
      `   - 下一步模式：${getModeName(task.nextMode)}`,
      `   - 相关范围：${task.relatedPageRange || '暂无'}`,
      `   - 创建时间：${formatDateTime(task.createdAt)}`,
    ].join('\n'),
  )
}

function formatMistakesForExport(mistakes: MistakeRecord[]) {
  if (mistakes.length === 0) {
    return ['暂无错题记录。']
  }

  return mistakes.map((mistake, index) =>
    [
      `${index + 1}. ${mistake.questionTitle}`,
      `   - 错因：${mistake.reason}`,
      `   - 题目摘要：${summarizeInput(mistake.questionText)}`,
      `   - 掌握度：${mistake.masteryAfter}`,
      `   - 下一步行动：${mistake.nextAction}`,
      `   - 创建时间：${formatDateTime(mistake.createdAt)}`,
    ].join('\n'),
  )
}

function formatMasteryForExport(mastery: MasteryRecord[]) {
  if (mastery.length === 0) {
    return ['暂无掌握度记录。']
  }

  return mastery.map((record, index) =>
    [
      `${index + 1}. ${record.topic}`,
      `   - level：${record.level}`,
      `   - evidence：${record.evidence}`,
      `   - updatedAt：${formatDateTime(record.updatedAt)}`,
    ].join('\n'),
  )
}

function createExamPlannerResult(course: Course): StructuredMockResult {
  const unfinishedTasks = course.tasks.filter((task) => task.status !== 'done')
  const mostCommonReason = getMostCommonMistakeReason(course.mistakes)
  const lowMasteryTopic = getRecentLowMasteryTopic(course.mastery)
  const hasLocalData =
    unfinishedTasks.length > 0 || course.mistakes.length > 0 || course.mastery.length > 0
  const nextTaskSuggestions = [
    unfinishedTasks[0]?.title ?? '先补 1 个最容易开始的未完成任务',
    mostCommonReason ? `复盘高频错因：${mostCommonReason}` : '补充 1 条错题记录，用来定位高频错因',
    lowMasteryTopic ? `补低掌握度主题：${lowMasteryTopic}` : '完成 1 次掌握度自评，找出低掌握度 topic',
  ]

  if (!hasLocalData) {
    return {
      conclusion: '当前本地记录还不足，期末规划先从建立任务、错题和掌握度记录开始。',
      facts:
        '当前未完成任务数：0；当前错题数：0；掌握度记录数：0；最常见错因：暂无；最近低掌握度 topic：暂无。',
      inference: '没有本地学习记录时，规划只能给出启动建议，不能基于历史薄弱点排序。',
      suggestion: `建议先建立闭环数据：1. ${nextTaskSuggestions[0]}；2. ${nextTaskSuggestions[1]}；3. ${nextTaskSuggestions[2]}。`,
      uncertainty: '本结果仅根据本地空记录生成，没有真实考试范围、成绩数据或课件验证。',
      verification: '先用任意模式生成 2-3 条记录，再回到期末复习规划，检查计划是否变得更具体。',
      nextAction: '从「习题导向筛选」开始录入一组目标习题，生成第一批本地学习记录。',
    }
  }

  return {
    conclusion: '期末复习应优先处理本地记录里的未完成任务、高频错因和低掌握度主题。',
    facts: `当前未完成任务数：${unfinishedTasks.length}；当前错题数：${course.mistakes.length}；掌握度记录数：${course.mastery.length}；最常见错因：${mostCommonReason ?? '暂无'}；最近低掌握度 topic：${lowMasteryTopic ?? '暂无'}。`,
    inference: '这些本地记录说明复习重点不应平均分配，而应先补最容易继续拖延或反复出错的部分。',
    suggestion: `简单计划：优先完成未完成任务；优先复盘高频错因；优先补低掌握度 topic。下一步任务建议：1. ${nextTaskSuggestions[0]}；2. ${nextTaskSuggestions[1]}；3. ${nextTaskSuggestions[2]}。`,
    uncertainty: '这是基于本地记录的规则式 mock 计划，不是真实 AI 判断，也没有验证考试范围和课件内容。',
    verification: '每天检查未完成任务数是否下降、同类错因是否减少、低掌握度 topic 是否提升到 3 以上。',
    nextAction: lowMasteryTopic
      ? `先安排 30 分钟复盘「${lowMasteryTopic}」，再完成 1 道相关变式题。`
      : '先完成 1 个未完成任务，再记录掌握度变化。',
  }
}

function createResultForMode(
  mode: (typeof studyModes)[number],
  course: Course,
): StructuredMockResult {
  if (mode.assistantMode === 'exam-planner') {
    return createExamPlannerResult(course)
  }

  return mode.mockResult
}

export default function App() {
  const [selectedModeId, setSelectedModeId] = useState(studyModes[0].id)
  const [generatedModeId, setGeneratedModeId] = useState<number | null>(null)
  const [course, setCourse] = useState<Course>(() => getOrCreateDefaultCourse())
  const [formInput, setFormInput] = useState('')
  const [masteryLevel, setMasteryLevel] = useState<MasteryLevel>(2)
  const [mistakeReason, setMistakeReason] = useState<MistakeReason>('题意错误')
  const [generatedResult, setGeneratedResult] = useState<StructuredMockResult | null>(null)
  const [saveMessage, setSaveMessage] = useState('')

  const selectedMode =
    studyModes.find((mode) => mode.id === selectedModeId) ?? studyModes[0]

  function focusInputArea() {
    window.setTimeout(() => {
      const inputElement = document.getElementById('mode-input')

      inputElement?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      inputElement?.focus()
    }, 0)
  }

  function continueWithMode(mode: AssistantMode, prompt: string) {
    const nextMode = studyModes.find((studyMode) => studyMode.assistantMode === mode)

    setSelectedModeId(nextMode?.id ?? studyModes[0].id)
    setGeneratedModeId(null)
    setGeneratedResult(null)
    setFormInput(prompt)
    setSaveMessage('')
    focusInputArea()
  }

  function handleSelectMode(modeId: number) {
    setSelectedModeId(modeId)
    setGeneratedModeId(null)
    setGeneratedResult(null)
    setFormInput('')
    setSaveMessage('')
  }

  function handleStartLearningLoop() {
    continueWithMode('exercise-filter', '')
  }

  function handleContinueLastTask() {
    const task = getRecommendedTask(course.tasks)

    if (!task) {
      handleStartLearningLoop()
      return
    }

    continueWithMode(task.nextMode, getTaskPrompt(task))
  }

  function handleContinueTask(task: StudyTask) {
    continueWithMode(task.nextMode, getTaskPrompt(task))
  }

  function handleContinueMistake(mistake: MistakeRecord) {
    continueWithMode(
      'mistake-diagnosis',
      `复盘这道错题：${summarizeInput(mistake.questionText)}；错因：${mistake.reason}；下一步：${mistake.nextAction}`,
    )
  }

  function handleReviewMastery(record: MasteryRecord) {
    continueWithMode(
      'lecture-quick-understand',
      `复盘低掌握度知识点：${record.topic}；当前掌握度：${record.level}；证据：${record.evidence}`,
    )
  }

  function handleExportMarkdown() {
    downloadTextFile('study-agent-demo-records.md', createMarkdownExport(course))
  }

  function handleGenerateResult() {
    const createdAt = new Date().toISOString()
    const input = formInput.trim() || selectedMode.formPlaceholder
    const result = createResultForMode(selectedMode, course)
    const output = formatStructuredResult(result)
    const topic = deriveTopic(selectedMode.name, input)
    const pageRange = extractPageRange(input)

    let updatedCourse = addAssistantRun(course.id, {
      id: createId(),
      courseId: course.id,
      mode: selectedMode.assistantMode,
      input,
      output,
      uncertainty: result.uncertainty,
      verificationMethod: result.verification,
      nextMode: selectedMode.nextAssistantMode,
      createdAt,
    })

    updatedCourse = addTask(course.id, {
      id: createId(),
      courseId: course.id,
      title: `下一步：${selectedMode.nextStep}`,
      sourceMode: selectedMode.assistantMode,
      nextMode: selectedMode.nextAssistantMode,
      relatedPageRange: pageRange,
      status: 'todo',
      createdAt,
    })

    updatedCourse = addMasteryRecord(course.id, {
      id: createId(),
      courseId: course.id,
      topic,
      level: masteryLevel,
      evidence: `在「${selectedMode.name}」中生成结构化结果；输入摘要：${summarizeInput(input)}`,
      updatedAt: createdAt,
    })

    if (selectedMode.assistantMode === 'mistake-diagnosis') {
      updatedCourse = addMistake(course.id, {
        id: createId(),
        courseId: course.id,
        questionTitle: topic,
        questionText: input,
        myAnswer: '用户暂未填写答案',
        correctAnswer: 'v0 演示版未保存标准答案',
        reason: mistakeReason,
        topic,
        pageRange,
        masteryAfter: masteryLevel,
        nextAction: result.nextAction,
        createdAt,
      })
    }

    setCourse(updatedCourse)
    setGeneratedModeId(selectedMode.id)
    setGeneratedResult(result)
    setSaveMessage('已保存到本地学习记录，并生成下一步任务。')
  }

  function handleUpdateTaskStatus(taskId: string, status: StudyTask['status']) {
    const updatedCourse = updateTaskStatus(course.id, taskId, status)

    setCourse(updatedCourse)
  }

  function handleClearLocalData() {
    const confirmed = window.confirm('确定要清空本地演示数据吗？此操作只会清空当前应用的本地记录。')

    if (!confirmed) {
      return
    }

    deleteCourse(course.id)
    const defaultCourse = getOrCreateDefaultCourse()

    setCourse(defaultCourse)
    setGeneratedModeId(null)
    setGeneratedResult(null)
    setFormInput('')
    setSaveMessage('')
  }

  const recommendedTask = getRecommendedTask(course.tasks)
  const latestDoingTask = getLatestTaskByStatus(course.tasks, 'doing')
  const latestTodoTask = getLatestTaskByStatus(course.tasks, 'todo')
  const latestMistake = course.mistakes.at(-1)
  const latestLowMasteryRecord = getLatestLowMasteryRecord(course.mastery)
  const unfinishedTaskCount = course.tasks.filter((task) => task.status !== 'done').length
  const lowMasteryCount = course.mastery.filter((record) => record.level <= 1).length
  const lowestMasteryTopic = getLowestMasteryTopic(course.mastery)
  const latestRuns = getLatestItems(course.runs)
  const latestTasks = getLatestItems(course.tasks)
  const latestMistakes = getLatestItems(course.mistakes)
  const latestMasteryRecords = getLatestItems(course.mastery)
  const recommendedTaskText = recommendedTask
    ? `${recommendedTask.title}（${recommendedTask.status === 'doing' ? '进行中' : '待做'}）`
    : '暂无任务，建议从习题导向筛选开始'
  const todayAction = latestDoingTask
    ? {
        title: latestDoingTask.title,
        reason: '因为它已经处于进行中，优先继续能减少切换成本。',
        mode: latestDoingTask.nextMode,
        prompt: getTaskPrompt(latestDoingTask),
      }
    : latestTodoTask
      ? {
          title: latestTodoTask.title,
          reason: '因为它是最新待做任务，适合接着推进闭环。',
          mode: latestTodoTask.nextMode,
          prompt: getTaskPrompt(latestTodoTask),
        }
      : latestMistake
        ? {
            title: `复盘错题：${latestMistake.reason}`,
            reason: '因为已有错题记录，先复盘最近错题能补上学习闭环。',
            mode: 'mistake-diagnosis' as AssistantMode,
            prompt: `复盘这道错题：${summarizeInput(latestMistake.questionText)}；错因：${latestMistake.reason}；下一步：${latestMistake.nextAction}`,
          }
        : latestLowMasteryRecord
          ? {
              title: `补低掌握度：${latestLowMasteryRecord.topic}`,
              reason: '因为这个知识点掌握度不高，适合先回看并做一次针对性练习。',
              mode: 'lecture-quick-understand' as AssistantMode,
              prompt: `复盘低掌握度知识点：${latestLowMasteryRecord.topic}；当前掌握度：${latestLowMasteryRecord.level}；证据：${latestLowMasteryRecord.evidence}`,
            }
          : {
              title: '从习题导向筛选开始',
              reason: '因为当前还没有足够本地记录，先用一道题建立第一条闭环。',
              mode: 'exercise-filter' as AssistantMode,
              prompt: '',
            }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-10 sm:px-8 lg:px-10">
        <header className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            study-agent-demo
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 sm:text-5xl">
            题目驱动的中文学习任务管理器
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">
            用习题倒推最少课件页数，再通过速懂、讲解、纠错和复习规划形成学习闭环。
          </p>
          <p className="mt-4 inline-flex rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
            当前课程：{course.name}
          </p>
        </header>

        <section className="rounded-lg border border-emerald-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700">今日学习入口</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">当前最该做：{todayAction.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">推荐原因：{todayAction.reason}</p>
            </div>
            <button
              className="rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200"
              type="button"
              onClick={() => continueWithMode(todayAction.mode, todayAction.prompt)}
            >
              继续这个任务
            </button>
          </div>
        </section>

        <section className="rounded-lg border border-blue-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-blue-600">推荐开始方式</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">第一次使用先跑一遍闭环</h2>
              <p className="mt-3 text-base leading-7 text-slate-700">
                第一次使用建议：点击「开始一次学习闭环」→ 点击「填入示例」→ 点击「生成结构化结果」。
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
                  type="button"
                  onClick={handleStartLearningLoop}
                >
                  开始一次学习闭环
                </button>
                <button
                  className="rounded-md border border-blue-200 bg-blue-50 px-5 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 focus:outline-none focus:ring-4 focus:ring-blue-100"
                  type="button"
                  onClick={handleContinueLastTask}
                >
                  继续上次任务
                </button>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{recommendedTaskText}</p>
            </div>

            <ol className="grid gap-3 text-sm leading-6">
              <li className="rounded-md bg-blue-50 p-4 text-blue-950">
                <span className="font-bold">1. 选模式</span>
              </li>
              <li className="rounded-md bg-slate-50 p-4 text-slate-800">
                <span className="font-bold">2. 填信息或用示例</span>
              </li>
              <li className="rounded-md bg-slate-50 p-4 text-slate-800">
                <span className="font-bold">3. 生成结果并保存下一步任务</span>
              </li>
            </ol>
          </div>
        </section>

        <section aria-label="五个学习模式" className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {studyModes.map((mode) => (
            <ModeCard
              key={mode.id}
              mode={mode}
              isActive={mode.id === selectedMode.id}
              onSelect={() => handleSelectMode(mode.id)}
            />
          ))}
        </section>

        <ModeDetailPanel
          mode={selectedMode}
          inputValue={formInput}
          masteryLevel={masteryLevel}
          mistakeReason={mistakeReason}
          generatedResult={generatedResult}
          showResult={generatedModeId === selectedMode.id}
          saveMessage={saveMessage}
          onInputChange={setFormInput}
          onMasteryLevelChange={setMasteryLevel}
          onMistakeReasonChange={setMistakeReason}
          onGenerate={handleGenerateResult}
        />

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 pb-4">
            <p className="text-sm font-semibold text-blue-600">本地学习记录</p>
            <h2 className="text-xl font-bold text-slate-950">{course.name}</h2>
            <p className="text-sm leading-6 text-slate-600">
              当前记录只保存在本浏览器，不上传云端；清除浏览器数据会丢失记录。
            </p>
          </div>
          <div className="mt-4 grid gap-4 text-sm leading-6 md:grid-cols-2 xl:grid-cols-4">
            <ActionSummaryCard
              actionLabel="继续"
              label="当前最该做的一件事"
              value={todayAction.title}
              onAction={() => continueWithMode(todayAction.mode, todayAction.prompt)}
            />
            <ActionSummaryCard
              actionLabel={recommendedTask ? '继续' : '开始'}
              label="未完成任务"
              value={`${unfinishedTaskCount} 个`}
              onAction={recommendedTask ? () => handleContinueTask(recommendedTask) : handleStartLearningLoop}
            />
            <ActionSummaryCard
              actionLabel={latestMistake ? '复盘' : '查看'}
              label="待复盘错题"
              value={`${course.mistakes.length} 条`}
              onAction={latestMistake ? () => handleContinueMistake(latestMistake) : undefined}
            />
            <ActionSummaryCard
              actionLabel={latestLowMasteryRecord ? '复盘' : '查看'}
              label="低掌握度知识点"
              value={lowestMasteryTopic ?? `${lowMasteryCount} 个`}
              onAction={
                latestLowMasteryRecord
                  ? () => handleReviewMastery(latestLowMasteryRecord)
                  : undefined
              }
            />
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600">本地记录详情</p>
              <h2 className="text-xl font-bold text-slate-950">最近保存的学习数据</h2>
            </div>
            <button
              className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
              type="button"
              onClick={handleClearLocalData}
            >
              清空本地演示数据
            </button>
            <button
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
              type="button"
              onClick={handleExportMarkdown}
            >
              导出本地记录为 Markdown
            </button>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <LocalList title="最近生成记录" emptyText="暂无生成记录">
              {latestRuns.map((run) => (
                <RunListItem key={run.id} run={run} />
              ))}
            </LocalList>

            <LocalList title="下一步任务" emptyText="暂无任务">
              {latestTasks.map((task) => (
                <TaskListItem
                  key={task.id}
                  task={task}
                  onContinueTask={handleContinueTask}
                  onUpdateStatus={handleUpdateTaskStatus}
                />
              ))}
            </LocalList>

            <LocalList title="错题记录" emptyText="暂无错题记录">
              {latestMistakes.map((mistake) => (
                <MistakeListItem key={mistake.id} mistake={mistake} />
              ))}
            </LocalList>

            <LocalList title="掌握度记录" emptyText="暂无掌握度记录">
              {latestMasteryRecords.map((record) => (
                <MasteryListItem key={record.id} record={record} />
              ))}
            </LocalList>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-5">
            <h2 className="text-base font-bold text-blue-950">学习闭环顺序</h2>
            <p className="mt-3 text-sm leading-7 text-blue-900">{workflowText}</p>
          </div>

          <div className="rounded-lg border border-amber-100 bg-amber-50/70 p-5">
            <h2 className="text-base font-bold text-amber-950">v0 限制提示</h2>
            <p className="mt-3 text-sm leading-7 text-amber-900">
              当前为 v0 前端演示版：不真实解析 PDF，不接真实 AI，不自动验证课件内容；仅展示学习闭环和结构化输出。
            </p>
          </div>
        </section>
      </section>
    </main>
  )
}

type LocalListProps = {
  title: string
  emptyText: string
  children: React.ReactNode
}

function LocalList({ title, emptyText, children }: LocalListProps) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children)

  return (
    <details className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <summary className="cursor-pointer font-bold text-slate-950">{title}</summary>
      <div className="mt-3 space-y-3">
        {hasChildren ? children : <p className="text-sm text-slate-500">{emptyText}</p>}
      </div>
    </details>
  )
}

function RunListItem({ run }: { run: AssistantRun }) {
  return (
    <article className="rounded-md bg-white p-4 text-sm leading-6 shadow-sm">
      <p className="font-semibold text-slate-950">{getModeName(run.mode)}</p>
      <p className="text-slate-600">创建时间：{formatDateTime(run.createdAt)}</p>
      <p className="text-slate-600">建议下一步：{getModeName(run.nextMode)}</p>
      <p className="text-slate-600">包含【不确定】：{hasUncertainty(run) ? '是' : '否'}</p>
    </article>
  )
}

type TaskListItemProps = {
  task: StudyTask
  onContinueTask: (task: StudyTask) => void
  onUpdateStatus: (taskId: string, status: StudyTask['status']) => void
}

function TaskListItem({ task, onContinueTask, onUpdateStatus }: TaskListItemProps) {
  return (
    <article className="rounded-md bg-white p-4 text-sm leading-6 shadow-sm">
      <p className="font-semibold text-slate-950">{task.title}</p>
      <p className="text-slate-600">来源模式：{getModeName(task.sourceMode)}</p>
      <p className="text-slate-600">下一步模式：{getModeName(task.nextMode)}</p>
      <p className="text-slate-600">状态：{task.status}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
          type="button"
          onClick={() => onContinueTask(task)}
        >
          继续此任务
        </button>
        <StatusButton
          isActive={task.status === 'todo'}
          label="待做"
          onClick={() => onUpdateStatus(task.id, 'todo')}
        />
        <StatusButton
          isActive={task.status === 'doing'}
          label="进行中"
          onClick={() => onUpdateStatus(task.id, 'doing')}
        />
        <StatusButton
          isActive={task.status === 'done'}
          label="已完成"
          onClick={() => onUpdateStatus(task.id, 'done')}
        />
      </div>
    </article>
  )
}

type StatusButtonProps = {
  isActive: boolean
  label: string
  onClick: () => void
}

function StatusButton({ isActive, label, onClick }: StatusButtonProps) {
  return (
    <button
      className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
        isActive
          ? 'border-blue-500 bg-blue-600 text-white'
          : 'border-slate-300 bg-white text-slate-700 hover:border-blue-300'
      }`}
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  )
}

function MistakeListItem({ mistake }: { mistake: MistakeRecord }) {
  return (
    <article className="rounded-md bg-white p-4 text-sm leading-6 shadow-sm">
      <p className="font-semibold text-slate-950">错因：{mistake.reason}</p>
      <p className="text-slate-600">题目摘要：{summarizeInput(mistake.questionText)}</p>
      <p className="text-slate-600">掌握度：{mistake.masteryAfter}</p>
      <p className="text-slate-600">下一步行动：{mistake.nextAction}</p>
    </article>
  )
}

function MasteryListItem({ record }: { record: MasteryRecord }) {
  return (
    <article className="rounded-md bg-white p-4 text-sm leading-6 shadow-sm">
      <p className="font-semibold text-slate-950">{record.topic}</p>
      <p className="text-slate-600">level：{record.level}</p>
      <p className="text-slate-600">evidence：{record.evidence}</p>
      <p className="text-slate-600">updatedAt：{formatDateTime(record.updatedAt)}</p>
    </article>
  )
}

type ActionSummaryCardProps = {
  actionLabel: string
  label: string
  value: string
  onAction?: () => void
}

function ActionSummaryCard({ actionLabel, label, value, onAction }: ActionSummaryCardProps) {
  return (
    <div className="flex min-h-32 flex-col justify-between rounded-md bg-slate-50 p-4">
      <div>
        <p className="font-semibold text-slate-950">{label}</p>
        <p className="mt-1 text-slate-600">{value}</p>
      </div>
      <button
        className={`mt-4 self-start rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
          onAction
            ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
            : 'cursor-not-allowed border-slate-200 bg-white text-slate-400'
        }`}
        type="button"
        disabled={!onAction}
        onClick={onAction}
      >
        {actionLabel}
      </button>
    </div>
  )
}
