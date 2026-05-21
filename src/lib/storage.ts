import type {
  AssistantRun,
  Course,
  MasteryRecord,
  Material,
  MistakeRecord,
  StudyTask,
} from '../types/study'

const STORAGE_KEY = 'study-agent-demo:courses'

function canUseLocalStorage() {
  return typeof localStorage !== 'undefined'
}

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function createDefaultCourse(): Course {
  return {
    id: createId(),
    name: '默认课程',
    materials: [],
    tasks: [],
    mistakes: [],
    mastery: [],
    runs: [],
    createdAt: new Date().toISOString(),
  }
}

function updateCourse(courseId: string, updater: (course: Course) => Course) {
  const courses = getCourses()
  const courseIndex = courses.findIndex((course) => course.id === courseId)

  if (courseIndex === -1) {
    throw new Error(`Course not found: ${courseId}`)
  }

  const updatedCourse = updater(courses[courseIndex])
  const nextCourses = courses.map((course) =>
    course.id === courseId ? updatedCourse : course,
  )

  saveCourses(nextCourses)

  return updatedCourse
}

export function getCourses(): Course[] {
  if (!canUseLocalStorage()) {
    return []
  }

  const rawCourses = localStorage.getItem(STORAGE_KEY)

  if (!rawCourses) {
    return []
  }

  try {
    const parsedCourses: unknown = JSON.parse(rawCourses)

    if (!Array.isArray(parsedCourses)) {
      return []
    }

    return parsedCourses as Course[]
  } catch {
    return []
  }
}

export function saveCourses(courses: Course[]): void {
  if (!canUseLocalStorage()) {
    return
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(courses))
}

export function saveCourse(course: Course): void {
  const courses = getCourses()
  const courseExists = courses.some((savedCourse) => savedCourse.id === course.id)
  const nextCourses = courseExists
    ? courses.map((savedCourse) => (savedCourse.id === course.id ? course : savedCourse))
    : [...courses, course]

  saveCourses(nextCourses)
}

export function getCourse(courseId: string): Course | undefined {
  return getCourses().find((course) => course.id === courseId)
}

export function deleteCourse(courseId: string): void {
  const nextCourses = getCourses().filter((course) => course.id !== courseId)

  saveCourses(nextCourses)
}

export function getOrCreateDefaultCourse(): Course {
  const courses = getCourses()
  const existingCourse = courses[0]

  if (existingCourse) {
    return existingCourse
  }

  const defaultCourse = createDefaultCourse()
  saveCourse(defaultCourse)

  return defaultCourse
}

export function addMaterial(courseId: string, material: Material): Course {
  return updateCourse(courseId, (course) => ({
    ...course,
    materials: [...course.materials, { ...material, courseId }],
  }))
}

export function addTask(courseId: string, task: StudyTask): Course {
  return updateCourse(courseId, (course) => ({
    ...course,
    tasks: [...course.tasks, { ...task, courseId }],
  }))
}

export function updateTaskStatus(
  courseId: string,
  taskId: string,
  status: StudyTask['status'],
): Course {
  return updateCourse(courseId, (course) => ({
    ...course,
    tasks: course.tasks.map((task) => (task.id === taskId ? { ...task, status } : task)),
  }))
}

export function addMistake(courseId: string, mistake: MistakeRecord): Course {
  return updateCourse(courseId, (course) => ({
    ...course,
    mistakes: [...course.mistakes, { ...mistake, courseId }],
  }))
}

export function addMasteryRecord(courseId: string, mastery: MasteryRecord): Course {
  return updateCourse(courseId, (course) => ({
    ...course,
    mastery: [...course.mastery, { ...mastery, courseId }],
  }))
}

export function addAssistantRun(courseId: string, run: AssistantRun): Course {
  return updateCourse(courseId, (course) => ({
    ...course,
    runs: [...course.runs, { ...run, courseId }],
  }))
}
