const resultSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'conclusion',
    'facts',
    'inferences',
    'suggestions',
    'uncertainty',
    'verificationMethod',
    'nextStep',
  ],
  properties: {
    conclusion: { type: 'string' },
    facts: { type: 'string' },
    inferences: { type: 'string' },
    suggestions: { type: 'string' },
    uncertainty: { type: 'string' },
    verificationMethod: { type: 'string' },
    nextStep: { type: 'string' },
  },
}

const modeNames: Record<string, string> = {
  'exercise-filter': '习题导向筛选',
  'lecture-quick-understand': '课件范围速懂',
  'single-question': '单题讲解',
  'mistake-diagnosis': '错题定位',
  'exam-planner': '期末复习规划',
}

type Provider = 'openai' | 'deepseek'
type StudyResult = {
  conclusion: string
  facts: string
  inferences: string
  suggestions: string
  uncertainty: string
  verificationMethod: string
  nextStep: string
}

const resultKeys = [
  'conclusion',
  'facts',
  'inferences',
  'suggestions',
  'uncertainty',
  'verificationMethod',
  'nextStep',
] as const
const maxFieldLength = 900

function sendJson(res: any, statusCode: number, data: unknown) {
  res.status(statusCode).json(data)
}

function getOutputText(response: any) {
  if (typeof response.output_text === 'string') {
    return response.output_text
  }

  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === 'output_text' && typeof content.text === 'string') {
        return content.text
      }
    }
  }

  return ''
}

function getChatCompletionText(response: any) {
  return response.choices?.[0]?.message?.content ?? ''
}

function trimField(value: string) {
  const trimmedValue = value.trim()

  return trimmedValue.length > maxFieldLength
    ? `${trimmedValue.slice(0, maxFieldLength)}...`
    : trimmedValue
}

function normalizeField(value: unknown) {
  if (typeof value === 'string') {
    return trimField(value)
  }

  if (Array.isArray(value)) {
    return trimField(
      value
        .map((item) => (typeof item === 'string' ? item : JSON.stringify(item)))
        .join('\n'),
    )
  }

  if (value && typeof value === 'object') {
    return trimField(JSON.stringify(value))
  }

  return null
}

function validateAndNormalizeStudyResult(value: unknown): StudyResult {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('AI 返回格式无效：结果必须是 JSON 对象。')
  }

  const result = value as Record<string, unknown>
  const receivedKeys = Object.keys(result)
  const extraKeys = receivedKeys.filter((key) => !resultKeys.includes(key as (typeof resultKeys)[number]))

  if (extraKeys.length > 0) {
    throw new Error(`AI 返回格式无效：包含多余字段 ${extraKeys.join('、')}。`)
  }

  if (receivedKeys.length !== resultKeys.length) {
    throw new Error('AI 返回格式不完整：字段数量不正确。')
  }

  const normalizedResult = {} as StudyResult

  for (const key of resultKeys) {
    if (!(key in result)) {
      throw new Error(`AI 返回格式不完整：缺少字段 ${key}。`)
    }

    const normalizedField = normalizeField(result[key])

    if (!normalizedField) {
      throw new Error(`AI 返回格式无效：字段 ${key} 必须是非空字符串、数组或对象。`)
    }

    normalizedResult[key] = normalizedField
  }

  return normalizedResult
}

function parseStudyResult(outputText: string) {
  const result = JSON.parse(outputText)

  return validateAndNormalizeStudyResult(result)
}

function createPrompt(modeName: string, input: string, masteryLevel: unknown, mistakeReason: unknown) {
  const mistakeReasonText = mistakeReason ? `\n错题原因：${mistakeReason}` : ''

  return `模式：${modeName}
掌握度自评：${masteryLevel ?? '未提供'}${mistakeReasonText}

用户粘贴文本：
${input}

请生成学习闭环结构化结果。
必须遵守：
- Return only valid JSON.
- Return exactly these 7 keys: conclusion, facts, inferences, suggestions, uncertainty, verificationMethod, nextStep.
- Every value must be a plain string.
- Do not return arrays.
- Do not return nested objects.
- Do not return markdown.
- Do not wrap JSON in code fences.

JSON example:
{
  "conclusion": "string",
  "facts": "string",
  "inferences": "string",
  "suggestions": "string",
  "uncertainty": "string",
  "verificationMethod": "string",
  "nextStep": "string"
}`
}

async function generateWithOpenAI(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('缺少 OPENAI_API_KEY。请先在 Vercel 环境变量中配置 OpenAI API Key。')
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
      instructions:
        '你是一个中文学习任务管理助手。只处理用户粘贴的文本，不声称读取、解析或验证 PDF、文件、课件原文。输出必须是简洁中文，并严格符合 JSON schema。',
      input: [
        {
          role: 'user',
          content: [{ type: 'input_text', text: prompt }],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'study_result',
          strict: true,
          schema: resultSchema,
        },
      },
    }),
  })
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data?.error?.message ?? 'OpenAI AI 生成失败，请稍后重试，或切换到 Mock 演示。')
  }

  return parseStudyResult(getOutputText(data))
}

async function generateWithDeepSeek(prompt: string) {
  const apiKey = process.env.DEEPSEEK_API_KEY

  if (!apiKey) {
    throw new Error('缺少 DEEPSEEK_API_KEY。请先在 Vercel 环境变量中配置 DeepSeek API Key。')
  }

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash',
      messages: [
        {
          role: 'system',
          content:
            '你是一个中文学习任务管理助手。只处理用户粘贴的文本，不声称读取、解析或验证 PDF、文件、课件原文。必须只输出合法 JSON。每个字段值都必须是普通字符串，不能是数组、对象、markdown 或代码块。',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    }),
  })
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data?.error?.message ?? 'DeepSeek AI 生成失败，请稍后重试，或切换到 Mock 演示。')
  }

  return parseStudyResult(getChatCompletionText(data))
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: '只支持 POST 请求。' })
    return
  }

  const { provider, mode, input, masteryLevel, mistakeReason } = req.body ?? {}
  const trimmedInput = typeof input === 'string' ? input.trim() : ''

  if (!trimmedInput) {
    sendJson(res, 400, { error: '请输入要处理的粘贴文本。' })
    return
  }

  if (provider !== 'openai' && provider !== 'deepseek') {
    sendJson(res, 400, { error: '请选择有效的 AI 提供方：OpenAI 或 DeepSeek。' })
    return
  }

  const modeName = modeNames[mode] ?? '学习任务'
  const prompt = createPrompt(modeName, trimmedInput, masteryLevel, mistakeReason)

  try {
    const result =
      provider === 'openai'
        ? await generateWithOpenAI(prompt)
        : await generateWithDeepSeek(prompt)

    sendJson(res, 200, { result })
  } catch (error) {
    sendJson(res, 500, {
      error:
        error instanceof Error
          ? error.message
          : 'AI 生成失败，请检查网络或稍后重试，也可以使用 Mock 演示。',
    })
  }
}
