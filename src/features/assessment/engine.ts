import { anchorQuestionIds, questions, type Answer, type Question } from '../../data/content';

export function getEligibleQuestions(answers: Record<string, Answer>, _skipped: string[]): Question[] {
  return questions.filter((question) => {
    if (!question.followUpFor) return true;
    const original = answers[question.followUpFor];
    return typeof original === 'string' && original.trim().length > 0 && original.trim().length < 100;
  });
}

export function getNextQuestion(answers: Record<string, Answer>, skipped: string[]): Question | undefined {
  const ordered = getEligibleQuestions(answers, skipped);
  return ordered.find((question) => answers[question.id] === undefined && !skipped.includes(question.id));
}

export function getAnsweredCount(answers: Record<string, Answer>, skipped: string[]): number {
  return getEligibleQuestions(answers, skipped).filter((question) => answers[question.id] !== undefined || skipped.includes(question.id)).length;
}

export function hasCompletedAnchors(answers: Record<string, Answer>, skipped: string[]): boolean {
  return anchorQuestionIds.every((id) => answers[id] !== undefined || skipped.includes(id));
}

export function getAnchorCoverage(answers: Record<string, Answer>, skipped: string[]): { answered: number; total: number } {
  return { answered: anchorQuestionIds.filter((id) => answers[id] !== undefined && !skipped.includes(id)).length, total: anchorQuestionIds.length };
}

export function defaultEvidenceNote(questionId: string, answer: Answer): string {
  const text = typeof answer === 'string'
    ? answer.trim()
    : typeof answer === 'object' && !Array.isArray(answer) && 'example' in answer
      ? answer.example.trim()
      : '';
  if (!text) return '';
  if (questionId === 'ANC-EXP-01') return `You described this experience: “${text}”`;
  return `You described how you responded when something changed: “${text}”`;
}
