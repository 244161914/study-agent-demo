import type { AssistantMode } from '../types/study'

export type StructuredMockResult = {
  conclusion: string
  facts: string
  inference: string
  suggestion: string
  uncertainty: string
  verification: string
  nextAction: string
}

export type StudyMode = {
  id: number
  assistantMode: AssistantMode
  name: string
  purpose: string
  input: string
  output: string
  nextStep: string
  nextAssistantMode: AssistantMode
  status: string
  formPlaceholder: string
  sampleInput: string
  mockResult: StructuredMockResult
}

export const studyModes: StudyMode[] = [
  {
    id: 1,
    assistantMode: 'exercise-filter',
    name: '习题导向筛选',
    purpose: '从目标习题反推需要优先看的课件范围。',
    input: '手动输入题目、题型、章节线索或老师给出的考点范围。',
    output: '得到建议复习页码、关键概念清单和需要补看的最小范围。',
    nextStep: '课件范围速懂',
    nextAssistantMode: 'lecture-quick-understand',
    status: '前端占位：整理筛选思路',
    formPlaceholder: '例如：第 3 章函数极限相关习题 12、15、18，我不确定应该先看哪些课件页。',
    sampleInput: '第 3 章函数极限相关习题 12、15、18，我不确定应该先看哪些课件页。',
    mockResult: {
      conclusion: '优先从题目反复出现的概念入手，先缩小到最可能相关的课件范围。',
      facts: '题目中出现了章节、题型和考点线索，但当前不会读取课件文件。',
      inference: '这些线索可以帮助学生手动定位到少量页码，再进入速懂阶段。',
      suggestion: '先记录题号、关键词和老师强调的范围，再手动补充页码。',
      uncertainty: '没有看到完整课件和标准答案，页码范围只能作为学习整理示例。',
      verification: '对照课程目录、课堂笔记和题目出处，确认建议范围是否覆盖题目知识点。',
      nextAction: '进入「课件范围速懂」，把确认后的页码范围或重点粘贴进去。',
    },
  },
  {
    id: 2,
    assistantMode: 'lecture-quick-understand',
    name: '课件范围速懂',
    purpose: '把选定课件范围压缩成容易吸收的学习提纲。',
    input: '粘贴课件范围/重点，或手动输入页码范围与课堂笔记。',
    output: '得到概念速览、公式提醒、易混点和本范围的学习顺序。',
    nextStep: '单题讲解',
    nextAssistantMode: 'single-question',
    status: '前端占位：展示速懂结构',
    formPlaceholder: '例如：第 24-31 页，主题是导数定义、求导法则和切线方程，课堂重点是链式法则。',
    sampleInput: '课件 Week 15，页码 12-18，目标是快速知道这些页怎么用于做题。',
    mockResult: {
      conclusion: '这段范围适合先看定义，再看公式，最后用一道典型题检查理解。',
      facts: '你提供的是手动输入的课件范围/重点，不包含自动课件读取。',
      inference: '如果范围内同时有定义和公式，学习顺序会影响后续做题效率。',
      suggestion: '先整理 3 个核心概念，再列出 2 个易混点和 1 道练习题。',
      uncertainty: '没有验证课件原文，重点排序只是前端演示中的结构化示例。',
      verification: '回看课件标题、小节总结和课堂标注，确认速懂提纲没有遗漏关键公式。',
      nextAction: '进入「单题讲解」，选择一道能覆盖该范围的题目进行拆解。',
    },
  },
  {
    id: 3,
    assistantMode: 'single-question',
    name: '单题讲解',
    purpose: '围绕一道题拆解解题路径和对应知识点。',
    input: '手动输入题目、已知条件、自己的解题过程和卡住的位置。',
    output: '得到题目拆解、步骤提示、相关概念和下一道练习建议。',
    nextStep: '错题定位',
    nextAssistantMode: 'mistake-diagnosis',
    status: '前端占位：展示讲解框架',
    formPlaceholder: '例如：题目要求求切线方程，我知道要先求导，但不知道代入哪个点。',
    sampleInput: '已知一个二阶系统传递函数，要求判断稳定性并画出响应趋势。',
    mockResult: {
      conclusion: '这道题可以拆成识别条件、选择公式、代入计算和检查单位四步。',
      facts: '你提供了题目和卡住的位置，当前按钮不会调用真实 AI。',
      inference: '卡点可能来自题目条件和公式变量之间没有建立对应关系。',
      suggestion: '先圈出已知量，再写出目标量，最后把公式中的变量逐个对应。',
      uncertainty: '没有完整题干和答案时，讲解步骤只能作为示例框架。',
      verification: '用同类型题重新做一遍，检查是否能独立说出每一步原因。',
      nextAction: '进入「错题定位」，记录本题的错误步骤和错误原因。',
    },
  },
  {
    id: 4,
    assistantMode: 'mistake-diagnosis',
    name: '错题定位',
    purpose: '把错误归因到具体概念、步骤或审题问题。',
    input: '输入错题、错误答案、正确答案和自己的思路记录。',
    output: '得到错误类型、需要回看的知识点和针对性纠错清单。',
    nextStep: '期末复习规划',
    nextAssistantMode: 'exam-planner',
    status: '前端占位：展示定位维度',
    formPlaceholder: '例如：我把符号写反了，最后答案差一个负号，但不知道是计算错还是概念错。',
    sampleInput: '我把公式选错了，不知道为什么这题不能直接套上一题的方法。',
    mockResult: {
      conclusion: '这类错误需要区分审题、概念、公式选择和计算执行四种来源。',
      facts: '你输入了错误表现和自己的思路记录，系统只展示前端 mock 结果。',
      inference: '如果错误反复出现在同一步，薄弱点可能不是粗心，而是步骤规则不稳定。',
      suggestion: '把错题标记为一个明确错误类型，并补一条防错检查语句。',
      uncertainty: '没有真实批改过程，错误归因不能替代老师或标准答案判断。',
      verification: '隔天重做同题或同类题，确认同一错误是否消失。',
      nextAction: '进入「期末复习规划」，把高频错误类型加入复习优先级。',
    },
  },
  {
    id: 5,
    assistantMode: 'exam-planner',
    name: '期末复习规划',
    purpose: '根据薄弱点安排期末前的复习节奏。',
    input: '输入考试日期、剩余时间、章节优先级和错题集中区域。',
    output: '得到分阶段复习安排、每日任务和考前回顾重点。',
    nextStep: '回到习题导向筛选',
    nextAssistantMode: 'exercise-filter',
    status: '前端占位：展示规划模板',
    formPlaceholder: '例如：距离考试还有 10 天，第 2、4 章错题最多，每天大约有 2 小时复习时间。',
    sampleInput: '考试还有 10 天，每天 5 小时，目标通过补考，基础薄弱。',
    mockResult: {
      conclusion: '复习计划应先覆盖高频错题章节，再安排整卷训练和考前回顾。',
      facts: '你提供了考试时间、薄弱章节和可用时间，当前没有自动验证课件内容。',
      inference: '时间有限时，错题密集区域比平均复习所有章节更值得优先处理。',
      suggestion: '把复习拆成基础回看、错题重做、综合模拟和考前清单四段。',
      uncertainty: '没有真实成绩数据和考试范围，计划只是 v0 演示模板。',
      verification: '每天结束后检查任务完成率和错题复现率，必要时调整章节权重。',
      nextAction: '回到「习题导向筛选」，用新题继续发现需要补看的范围。',
    },
  },
]
