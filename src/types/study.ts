export type MasteryLevel = 0 | 1 | 2 | 3 | 4

export type AssistantMode =
  | 'exercise-filter'
  | 'lecture-quick-understand'
  | 'single-question'
  | 'mistake-diagnosis'
  | 'exam-planner'

export type MistakeReason =
  | '题意错误'
  | '公式选择错误'
  | '模型建立错误'
  | '计算错误'
  | '表达/步骤错误'
  | '不会检查'

export type MaterialType = 'lecture' | 'exercise' | 'answer' | 'note'

export type StudyTaskStatus = 'todo' | 'doing' | 'done'

export interface Course {
  id: string
  name: string
  materials: Material[]
  tasks: StudyTask[]
  mistakes: MistakeRecord[]
  mastery: MasteryRecord[]
  runs: AssistantRun[]
  createdAt: string
}

export interface Material {
  id: string
  courseId: string
  title: string
  type: MaterialType
  pageRange: string
  pastedText: string
  createdAt: string
}

export interface StudyTask {
  id: string
  courseId: string
  title: string
  sourceMode: AssistantMode
  nextMode: AssistantMode
  relatedPageRange: string
  status: StudyTaskStatus
  createdAt: string
}

export interface MistakeRecord {
  id: string
  courseId: string
  questionTitle: string
  questionText: string
  myAnswer: string
  correctAnswer: string
  reason: MistakeReason
  topic: string
  pageRange: string
  masteryAfter: MasteryLevel
  nextAction: string
  createdAt: string
}

export interface MasteryRecord {
  id: string
  courseId: string
  topic: string
  level: MasteryLevel
  evidence: string
  updatedAt: string
}

export interface AssistantRun {
  id: string
  courseId: string
  mode: AssistantMode
  input: string
  output: string
  uncertainty: string
  verificationMethod: string
  nextMode: AssistantMode
  createdAt: string
}
