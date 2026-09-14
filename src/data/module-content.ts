import raw from '@/data/module-content.json'
export interface ModuleContent { code: string; summary: string; objectives: string[]; keyPoints: string[]; scgExample: string; practiceTask: string; commonMistakes: string[]; quickCheck: { question: string; options: string[]; correct: number; why: string }[]; coachPrompt: string }
export const MODULE_CONTENT = raw as Record<string, ModuleContent>
export const moduleContent = (code: string): ModuleContent | null => MODULE_CONTENT[code] ?? null
