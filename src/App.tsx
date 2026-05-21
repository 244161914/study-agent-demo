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

  function handleSelectMode(modeId: number) {
    setSelectedModeId(modeId)
    setGeneratedModeId(null)
    setGeneratedResult(null)
    setFormInput('')
    setSaveMessage('')
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

  const latestRun = course.runs.at(-1)
  const latestTask = course.tasks.at(-1)
  const latestRuns = getLatestItems(course.runs)
  const latestTasks = getLatestItems(course.tasks)
  const latestMistakes = getLatestItems(course.mistakes)
  const latestMasteryRecords = getLatestItems(course.mastery)

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

        <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-5">
            <h2 className="text-base font-bold text-blue-950">学习闭环顺序</h2>
            <p className="mt-3 text-sm leading-7 text-blue-900">{workflowText}</p>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
            <h2 className="text-base font-bold text-amber-950">v0 限制提示</h2>
            <p className="mt-3 text-sm leading-7 text-amber-900">
              当前为 v0 前端演示版：不真实解析 PDF，不接真实 AI，不自动验证课件内容；仅展示学习闭环和结构化输出。
            </p>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 pb-4">
            <p className="text-sm font-semibold text-blue-600">本地学习记录</p>
            <h2 className="text-xl font-bold text-slate-950">{course.name}</h2>
          </div>
          <div className="mt-4 grid gap-4 text-sm leading-6 md:grid-cols-3 xl:grid-cols-6">
            <RecordItem label="已保存结果" value={`${course.runs.length} 条`} />
            <RecordItem label="任务数" value={`${course.tasks.length} 个`} />
            <RecordItem label="错题数" value={`${course.mistakes.length} 条`} />
            <RecordItem label="掌握度记录数" value={`${course.mastery.length} 条`} />
            <RecordItem
              label="最新生成模式"
              value={latestRun ? getModeName(latestRun.mode) : '暂无记录'}
            />
            <RecordItem label="最新任务" value={latestTask?.title ?? '暂无任务'} />
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
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <LocalList title="最近生成记录" emptyText="暂无生成记录">
              {latestRuns.map((run) => (
                <RunListItem key={run.id} run={run} />
              ))}
            </LocalList>

            <LocalList title="下一步任务" emptyText="暂无任务">
              {latestTasks.map((task) => (
                <TaskListItem key={task.id} task={task} onUpdateStatus={handleUpdateTaskStatus} />
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
    <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="font-bold text-slate-950">{title}</h3>
      <div className="mt-3 space-y-3">
        {hasChildren ? children : <p className="text-sm text-slate-500">{emptyText}</p>}
      </div>
    </section>
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
  onUpdateStatus: (taskId: string, status: StudyTask['status']) => void
}

function TaskListItem({ task, onUpdateStatus }: TaskListItemProps) {
  return (
    <article className="rounded-md bg-white p-4 text-sm leading-6 shadow-sm">
      <p className="font-semibold text-slate-950">{task.title}</p>
      <p className="text-slate-600">来源模式：{getModeName(task.sourceMode)}</p>
      <p className="text-slate-600">下一步模式：{getModeName(task.nextMode)}</p>
      <p className="text-slate-600">状态：{task.status}</p>
      <div className="mt-3 flex flex-wrap gap-2">
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

type RecordItemProps = {
  label: string
  value: string
}

function RecordItem({ label, value }: RecordItemProps) {
  return (
    <div className="rounded-md bg-slate-50 p-4">
      <p className="font-semibold text-slate-950">{label}</p>
      <p className="mt-1 text-slate-600">{value}</p>
    </div>
  )
}
