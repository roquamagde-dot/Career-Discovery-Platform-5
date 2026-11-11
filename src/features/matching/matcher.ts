import { careers, type Answer, type Career } from '../../data/content';
import type { EvidenceReview } from '../../lib/storage';

export interface CareerMatch {
  career: Career;
  supportingSignals: string[];
  signalGroups: {
    interests: string[];
    selfPerception: string[];
    demonstratedEvidence: string[];
    taskSkillAlignment: string[];
    workStyle: string[];
    workValues: string[];
  };
  status: 'PROVISIONAL';
  developmentGaps: string[];
  limitations: string[];
  marketStatus: 'NOT_VERIFIED';
}

function rating(answer: Answer | undefined): number | undefined {
  if (typeof answer === 'number') return answer;
  if (answer && typeof answer === 'object' && !Array.isArray(answer) && 'rating' in answer) return answer.rating;
  return undefined;
}

export function findCareerMatches(answers: Record<string, Answer>, evidenceReviews: Record<string, EvidenceReview>): CareerMatch[] {
  const selectedValues = Array.isArray(answers['ANC-VALUES-01']) ? answers['ANC-VALUES-01'] as string[] : [];
  const style = answers['ANC-STYLE-01'];
  const collaboration = answers['ANC-STYLE-02'];
  const confirmedReviews = Object.values(evidenceReviews).filter((review) => review.status === 'confirmed');
  const signals: Record<string, boolean> = {
    'interest:investigation': (rating(answers['ANC-INT-01']) ?? 0) >= 4,
    'interest:helping': (rating(answers['ANC-INT-02']) ?? 0) >= 4,
    'self:planning': (rating(answers['ANC-SELF-01']) ?? 0) >= 4,
    'self:systems': (rating(answers['ANC-SELF-02']) ?? 0) >= 4,
    'style:structure': style === 'structure' || style === 'combination',
    'style:exploration': style === 'exploration' || style === 'combination',
    'style:collaborative': collaboration === 'collaborative' || collaboration === 'mix',
    'values:stability': selectedValues.includes('stability') || answers['ANC-VALUES-02'] === 'stability',
    'values:flexibility': answers['ANC-VALUES-02'] === 'flexibility',
    'values:growth': selectedValues.includes('growth'),
    'values:impact': selectedValues.includes('impact'),
    'values:relationships': selectedValues.includes('relationships'),
    'task:investigation': confirmedReviews.some((review) => review.taskTags?.includes('investigation')),
    'task:planning': confirmedReviews.some((review) => review.taskTags?.includes('planning')),
    'task:communication': confirmedReviews.some((review) => review.taskTags?.includes('communication')),
    'task:coordination': confirmedReviews.some((review) => review.taskTags?.includes('coordination')),
    'task:process-improvement': confirmedReviews.some((review) => review.taskTags?.includes('process-improvement')),
  };
  const labels: Record<string, string> = {
    'interest:investigation': 'You reported strong interest in investigating how things work.',
    'interest:helping': 'You reported strong interest in helping someone understand or learn.',
    'self:planning': 'You reported confidence in turning a goal into clear steps; this is not a performance measure.',
    'self:systems': 'You reported confidence in learning a new tool; this is not proof of tool proficiency.',
    'style:structure': 'You prefer some structure when working.',
    'style:exploration': 'You prefer room to explore or adapt methods.',
    'style:collaborative': 'You prefer working with other people or a mix of settings.',
    'values:stability': 'You selected stability among your current priorities.',
    'values:flexibility': 'You currently prefer more flexibility over predictability.',
    'values:growth': 'You selected growth among your current priorities.',
    'values:impact': 'You selected impact among your current priorities.',
    'values:relationships': 'You selected relationships among your current priorities.',
  };
  const taskLabels: Record<string, string> = {
    'investigation': 'investigating a question or pattern',
    'planning': 'planning and organizing steps',
    'communication': 'explaining or teaching something',
    'coordination': 'coordinating people, tasks, or timing',
    'process-improvement': 'improving a process or system',
  };
  const foundationalSignals = ['interest:investigation', 'interest:helping', 'self:planning', 'self:systems'];
  const textFor = (key: string): string => {
    if (!key.startsWith('task:')) return labels[key] ?? '';
    const tag = key.slice(5);
    const label = taskLabels[tag] ?? 'a task';
    const count = confirmedReviews.filter((review) => review.taskTags?.includes(tag)).length;
    const countText = count > 1 ? ` across ${count} confirmed notes` : ' in one confirmed note';
    return `You linked an example to ${label}${countText}. This is self-reported, not a verified skill.`;
  };

  return careers
    .map((career) => {
      const activeKeys = career.signalKeys.filter((key) => signals[key]);
      const activeGroups = new Set(activeKeys.map((key) => key.split(':')[0]));
      return {
        career,
        supportingSignals: activeKeys.map(textFor).filter(Boolean),
        signalGroups: {
          interests: activeKeys.filter((key) => key.startsWith('interest:')).map(textFor),
          selfPerception: activeKeys.filter((key) => key.startsWith('self:')).map(textFor),
          demonstratedEvidence: confirmedReviews.length
            ? [`You confirmed ${confirmedReviews.length} answer-linked note(s). Confirmation applies to your account of an experience, not a verified ability.`]
            : ['No example note has been confirmed; demonstrated skill remains unknown.'],
          taskSkillAlignment: activeKeys.filter((key) => key.startsWith('task:')).map(textFor),
          workStyle: activeKeys.filter((key) => key.startsWith('style:')).map(textFor),
          workValues: activeKeys.filter((key) => key.startsWith('values:')).map(textFor),
        },
        status: 'PROVISIONAL' as const,
        developmentGaps: career.developmentGaps,
        limitations: [career.evidenceNote, 'This is a transparent prototype heuristic, not a validated measure of career fit.', 'Written experience examples do not establish skill; only a user-confirmed task tag creates a possible task/skill link.'],
        marketStatus: 'NOT_VERIFIED' as const,
        hasFoundationalSignal: activeKeys.some((key) => foundationalSignals.includes(key)),
        hasDistinctSignalGroups: activeGroups.size >= 2,
      };
    })
    .filter((match) => match.hasFoundationalSignal && match.hasDistinctSignalGroups && match.supportingSignals.length > 0)
    .sort((a, b) => b.supportingSignals.length - a.supportingSignals.length)
    .slice(0, 3)
    .map(({ hasFoundationalSignal: _hasFoundationalSignal, hasDistinctSignalGroups: _hasDistinctSignalGroups, ...match }) => match);
}

export function getCareerById(id: string): Career | undefined {
  return careers.find((career) => career.id === id);
}
