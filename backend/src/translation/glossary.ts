export type SupportedLang = 'ko' | 'en';

/**
 * 전문용어 사전 - LLM이 매번 다르게 번역해서 일관성이 깨지는 걸 막기 위해
 * 텍스트에 등장하는 용어를 미리 찾아 프롬프트에 강제 매핑으로 주입한다.
 */
export interface GlossaryEntry {
  ko: string;
  en: string;
}

export const GLOSSARY: GlossaryEntry[] = [
  { ko: '낙관적 잠금', en: 'optimistic locking' },
  { ko: '비관적 잠금', en: 'pessimistic locking' },
  { ko: '게이트웨이', en: 'gateway' },
  { ko: '지연시간', en: 'latency' },
  { ko: '형상 관리', en: 'version control' },
  { ko: '배포', en: 'deployment' },
  { ko: '헬스체크', en: 'health check' },
  { ko: '엔드포인트', en: 'endpoint' },
  { ko: '캐시 무효화', en: 'cache invalidation' },
];

/** 텍스트에 실제로 등장하는 용어만 골라낸다 (프롬프트 낭비 방지) */
export function matchGlossary(
  text: string,
  sourceLang: SupportedLang,
  targetLang: SupportedLang,
): GlossaryEntry[] {
  if (sourceLang === targetLang) return [];
  return GLOSSARY.filter((entry) => text.includes(entry[sourceLang]));
}
