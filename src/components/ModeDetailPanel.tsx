import type { StructuredMockResult, StudyMode } from '../data/studyModes'
import type { MasteryLevel, MistakeReason } from '../types/study'

const masteryOptions: { level: MasteryLevel; label: string }[] = [
  { level: 0, label: '0 完全不会' },
  { level: 1, label: '1 看答案能懂' },
  { level: 2, label: '2 能套模板做标准题' },
  { level: 3, label: '3 能独立做变式题' },
  { level: 4, label: '4 能限时做对并检查' },
]

const mistakeReasons: MistakeReason[] = [
  '题意错误',
  '公式选择错误',
  '模型建立错误',
  '计算错误',
  '表达/步骤错误',
  '不会检查',
]

type ModeDetailPanelProps = {
  mode: StudyMode
  inputValue: string
  masteryLevel: MasteryLevel
  mistakeReason: MistakeReason
  generatedResult: StructuredMockResult | null
  showResult: boolean
  saveMessage: string
  onInputChange: (value: string) => void
  onMasteryLevelChange: (level: MasteryLevel) => void
  onMistakeReasonChange: (reason: MistakeReason) => void
  onGenerate: () => void
}

const v0LimitText =
  '当前为 v0 前端演示版：不真实解析 PDF，不接真实 AI，不自动验证课件内容；仅展示学习闭环和结构化输出。'

export function ModeDetailPanel({
  mode,
  inputValue,
  masteryLevel,
  mistakeReason,
  generatedResult,
  showResult,
  saveMessage,
  onInputChange,
  onMasteryLevelChange,
  onMistakeReasonChange,
  onGenerate,
}: ModeDetailPanelProps) {
  const isMistakeMode = mode.assistantMode === 'mistake-diagnosis'

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-5">
        <p className="text-sm font-semibold text-blue-600">当前选中模式</p>
        <h2 className="text-2xl font-bold text-slate-950">{mode.name}</h2>
        <p className="text-base leading-7 text-slate-700">{mode.purpose}</p>
      </div>

      <div className="mt-5 grid gap-4 text-sm leading-6 md:grid-cols-2">
        <InfoBlock title="输入内容" text={mode.input} />
        <InfoBlock title="输出内容" text={mode.output} />
        <InfoBlock title="下一步进入哪个模式" text={`进入「${mode.nextStep}」`} />
        <InfoBlock title="v0 限制提示" text={v0LimitText} />
      </div>

      <form className="mt-6 space-y-3" onSubmit={(event) => event.preventDefault()}>
        <label className="block text-sm font-semibold text-slate-950" htmlFor="mode-input">
          简单占位表单
        </label>
        <textarea
          className="min-h-32 w-full resize-y rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
          id="mode-input"
          placeholder={mode.formPlaceholder}
          value={inputValue}
          onChange={(event) => onInputChange(event.target.value)}
        />

        <fieldset className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <legend className="text-sm font-semibold text-slate-950">掌握度自评</legend>
          <div className="grid gap-2 md:grid-cols-2">
            {masteryOptions.map((option) => (
              <label
                className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition ${
                  masteryLevel === option.level
                    ? 'border-blue-500 bg-blue-50 text-blue-800'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
                key={option.level}
              >
                <input
                  checked={masteryLevel === option.level}
                  className="h-4 w-4"
                  name="mastery-level"
                  type="radio"
                  onChange={() => onMasteryLevelChange(option.level)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        {isMistakeMode && (
          <label className="block text-sm font-semibold text-slate-950" htmlFor="mistake-reason">
            错误原因
            <select
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              id="mistake-reason"
              value={mistakeReason}
              onChange={(event) => onMistakeReasonChange(event.target.value as MistakeReason)}
            >
              {mistakeReasons.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </label>
        )}

        <button
          className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
          type="button"
          onClick={onGenerate}
        >
          生成结构化结果
        </button>
      </form>

      {saveMessage && (
        <p className="mt-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
          {saveMessage}
        </p>
      )}

      {showResult && generatedResult && (
        <section className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-5">
          <h3 className="text-lg font-bold text-emerald-950">模拟结构化结果</h3>
          <div className="mt-4 grid gap-3 text-sm leading-6 md:grid-cols-2">
            <InfoBlock title="结论" text={generatedResult.conclusion} />
            <InfoBlock title="事实" text={generatedResult.facts} />
            <InfoBlock title="推断" text={generatedResult.inference} />
            <InfoBlock title="建议" text={generatedResult.suggestion} />
            <InfoBlock title="【不确定】" text={generatedResult.uncertainty} />
            <InfoBlock title="如何验证" text={generatedResult.verification} />
            <InfoBlock title="建议下一步" text={generatedResult.nextAction} />
          </div>
        </section>
      )}
    </section>
  )
}

type InfoBlockProps = {
  title: string
  text: string
}

function InfoBlock({ title, text }: InfoBlockProps) {
  return (
    <section className="rounded-md bg-slate-50 p-4">
      <h3 className="font-semibold text-slate-950">{title}</h3>
      <p className="mt-1 text-slate-600">{text}</p>
    </section>
  )
}
