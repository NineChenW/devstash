import OpenAI from "openai"

// Original OpenAI config — uses Responses API and gpt-5-nano.
// export const AI_MODEL = "gpt-5-nano"

// SiliconFlow (OpenAI-compatible) config — uses Chat Completions API and GLM-4-9B.
export const AI_MODEL = "deepseek-ai/DeepSeek-R1-0528-Qwen3-8B"
export const AI_BASE_URL = "https://api.siliconflow.cn/v1"

let cached: OpenAI | null = null

export function getOpenAI(): OpenAI {
  if (cached) return cached
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error("OPENAI_API_KEY is not set")
  // cached = new OpenAI({ apiKey: key })
  cached = new OpenAI({ apiKey: key, baseURL: AI_BASE_URL })
  return cached
}

export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY)
}
