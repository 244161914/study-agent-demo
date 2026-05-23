import type { StudyMode } from '../data/studyModes'

type ModeCardProps = {
  mode: StudyMode
  isActive: boolean
  onSelect: () => void
}

export function ModeCard({ mode, isActive, onSelect }: ModeCardProps) {
  return (
    <button
      className={`flex h-full w-full flex-col rounded-lg border p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-100 ${
        isActive
          ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200'
          : 'border-slate-200 bg-white'
      }`}
      type="button"
      aria-pressed={isActive}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-600">模式 {mode.id}</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">{mode.name}</h2>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            isActive ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700'
          }`}
        >
          {isActive ? '已选中' : 'v0 演示'}
        </span>
      </div>

      <p className="mt-4 text-base leading-7 text-slate-700">{mode.purpose}</p>

      <div className="mt-5 rounded-md bg-slate-50 p-4 text-sm leading-6">
        <h3 className="font-semibold text-slate-950">下一步</h3>
        <p className="mt-1 text-slate-600">进入「{mode.nextStep}」</p>
      </div>
    </button>
  )
}
