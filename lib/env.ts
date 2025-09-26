/**
 * 환경 변수 검증 및 타입 안전성 보장
 */

export function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue
  if (!value) {
    throw new Error(`환경 변수 ${key}가 설정되지 않았습니다.`)
  }
  return value
}

export const env = {
  GEMINI_API_KEY: getEnvVar('GEMINI_API_KEY'),
  LLM_MODEL: getEnvVar('LLM_MODEL', 'gemini-2.0-flash-001'),
  NODE_ENV: getEnvVar('NODE_ENV', 'development'),
} as const
