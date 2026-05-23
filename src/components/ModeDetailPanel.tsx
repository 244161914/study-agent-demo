import type { StructuredMockResult, StudyMode } from '../data/studyModes'
import type { MasteryLevel, MistakeReason } from '../types/study'

const masteryOptions: { level: MasteryLevel; label: string }[] = [
  { level: 0, label: '0 Again / 完全不会' },
  { level: 1, label: '1 Hard / 看答案才懂' },
  { level: 2, label: '2 Good- / 能套模板' },
  { level: 3, label: '3 Good / 能做变式' },
  { level: 4, label: '4 Easy / 考试可用' },
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
  generationProvider: 'mock' | 'openai' | 'deepseek'
  generatedResult: StructuredMockResult | null
  showResult: boolean
  saveMessage: string
  generationError: string
  isGenerating: boolean
  onInputChange: (value: string) => void
  onMasteryLevelChange: (level: MasteryLevel) => void
  onMistakeReasonChange: (reason: MistakeReason) => void
  onGenerationProviderChange: (provider: 'mock' | 'openai' | 'deepseek') => void
  onGenerate: () => void
}

const v0LimitText =
  '当前 v0.2 支持粘贴文本的 AI 生成，可选择 OpenAI 或 DeepSeek；仍不解析 PDF、不上传文件、不自动验证课件内容。'

export function ModeDetailPanel({
  mode,
  inputValue,
  masteryLevel,
  mistakeReason,
  generationProvider,
  generatedResult,
  showResult,
  saveMessage,
  generationError,
  isGenerating,
  onInputChange,
  onMasteryLevelChange,
  onMistakeReasonChange,
  onGenerationProviderChange,
  onGenerate,
}: ModeDetailPanelProps) {
  const isMistakeMode = mode.assistantMode === 'mistake-diagnosis'
  const isAiProvider = generationProvider !== 'mock'

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
        <InfoBlock title="当前能力边界" text={v0LimitText} />
      </div>

      <form className="mt-6 space-y-3" onSubmit={(event) => event.preventDefault()}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="text-sm font-semibold text-slate-950" htmlFor="mode-input">
            简单占位表单
          </label>
          <button
            className="rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 focus:outline-none focus:ring-4 focus:ring-blue-100"
            type="button"
            onClick={() => onInputChange(mode.sampleInput)}
          >
            填入示例
          </button>
        </div>
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

        <fieldset className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <legend className="text-sm font-semibold text-slate-950">生成提供方</legend>
          <div className="flex flex-wrap gap-2">
            <GenerationProviderButton
              isActive={generationProvider === 'mock'}
              label="Mock 演示"
              onClick={() => onGenerationProviderChange('mock')}
            />
            <GenerationProviderButton
              isActive={generationProvider === 'openai'}
              label="OpenAI AI"
              onClick={() => onGenerationProviderChange('openai')}
            />
            <GenerationProviderButton
              isActive={generationProvider === 'deepseek'}
              label="DeepSeek AI"
              onClick={() => onGenerationProviderChange('deepseek')}
            />
          </div>
          <p className="text-xs leading-5 text-slate-500">
            AI 提供方只处理你粘贴到文本框里的内容；不会上传文件，也不会解析 PDF。默认使用 Mock 演示。
          </p>
        </fieldset>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-400"
            type="button"
            disabled={isGenerating}
            onClick={onGenerate}
          >
            {isGenerating ? '生成中...' : '生成结构化结果'}
          </button>
          {isAiProvider && (
            <span className="text-sm text-slate-500">AI 失败时不会保存记录，可切回 Mock 演示。</span>
          )}
        </div>
      </form>

      {generationError && (
        <div className="mt-4 flex flex-col gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <p>{generationError}</p>
          <button
            className="self-start rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
            type="button"
            onClick={() => onGenerationProviderChange('mock')}
          >
            改用 Mock 演示
          </button>
        </div>
      )}

      {saveMessage && (
        <p className="mt-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
          {saveMessage}
        </p>
      )}

      {showResult && generatedResult && (
        <section className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-5">
          <h3 className="text-lg font-bold text-emerald-950">
            {isAiProvider ? 'AI 结构化结果' : '模拟结构化结果'}
          </h3>
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

type GenerationProviderButtonProps = {
  isActive: boolean
  label: string
  onClick: () => void
}

function GenerationProviderButton({ isActive, label, onClick }: GenerationProviderButtonProps) {
  return (
    <button
      className={`rounded-md border px-4 py-2 text-sm font-semibold transition ${
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
