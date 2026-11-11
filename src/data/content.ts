export type Dimension = 'interest' | 'self-perception' | 'demonstrated-evidence' | 'work-style' | 'work-values';
export type QuestionType = 'rating' | 'self-rating' | 'narrative' | 'choice' | 'ranking';

export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
}

export interface Question {
  id: string;
  dimension: Dimension;
  type: QuestionType;
  prompt: string;
  helper: string;
  rationale?: string;
  options?: QuestionOption[];
  followUpFor?: string;
}

export type Answer = string | number | string[] | { rating: number; example: string };

export const taskSkillOptions = [
  { value: 'investigation', label: 'Investigating a question or pattern' },
  { value: 'planning', label: 'Planning and organizing steps' },
  { value: 'communication', label: 'Explaining or teaching something' },
  { value: 'coordination', label: 'Coordinating people, tasks, or timing' },
  { value: 'process-improvement', label: 'Improving a process or system' },
];

const anchorQuestions: Question[] = [
  {
    id: 'ANC-INT-01', dimension: 'interest', type: 'rating',
    prompt: 'How interested are you in investigating why something is not working and testing possible explanations?',
    helper: 'Think about the activity itself—not whether you feel skilled at it.',
  },
  {
    id: 'ANC-INT-02', dimension: 'interest', type: 'rating',
    prompt: 'How interested are you in helping another person understand or learn something difficult?',
    helper: 'You can be interested in this even if you have not taught formally.',
  },
  {
    id: 'ANC-SELF-01', dimension: 'self-perception', type: 'self-rating',
    prompt: 'How confident are you in turning a vague goal into clear tasks and completing them?',
    helper: 'This is your current confidence—not a performance score.',
  },
  {
    id: 'ANC-SELF-02', dimension: 'self-perception', type: 'self-rating',
    prompt: 'How confident are you in learning an unfamiliar tool or system independently?',
    helper: 'Your confidence is useful context, but it is separate from demonstrated experience.',
  },
  {
    id: 'ANC-EXP-01', dimension: 'demonstrated-evidence', type: 'narrative',
    prompt: 'Describe an activity or project where you were responsible for an outcome. What did you personally do?',
    helper: 'A class, volunteer role, hobby, family responsibility, or student activity all count.',
    rationale: 'This helps separate your own actions from the wider group result.',
  },
  {
    id: 'ANC-EXP-02', dimension: 'demonstrated-evidence', type: 'narrative',
    prompt: 'Describe a time something did not go as planned. What actions did you take, and what happened?',
    helper: 'There is no ideal answer. Include what you tried and what you learned, if anything.',
  },
  {
    id: 'ANC-STYLE-01', dimension: 'work-style', type: 'choice',
    prompt: 'Which helps you work best: clear structure, flexible exploration, or a combination?',
    helper: 'Choose what tends to help right now; this can change by task or season.',
    options: [
      { value: 'structure', label: 'Clear structure', description: 'Defined steps and expectations' },
      { value: 'exploration', label: 'Flexible exploration', description: 'Room to adapt as I learn' },
      { value: 'combination', label: 'A combination', description: 'A clear goal with flexible methods' },
    ],
  },
  {
    id: 'ANC-STYLE-02', dimension: 'work-style', type: 'choice',
    prompt: 'For an important task, do you usually prefer working independently, with others, or a mix?',
    helper: 'Choose the setting that usually gives you a good working rhythm.',
    options: [
      { value: 'independent', label: 'Mostly independently' },
      { value: 'collaborative', label: 'Mostly with others' },
      { value: 'mix', label: 'A mix of both' },
    ],
  },
  {
    id: 'ANC-VALUES-01', dimension: 'work-values', type: 'ranking',
    prompt: 'Choose the three factors that matter most to you at this stage, in order.',
    helper: 'Select three. Your first choice will be treated as your current top priority.',
    options: [
      { value: 'stability', label: 'Stability' }, { value: 'autonomy', label: 'Autonomy' },
      { value: 'impact', label: 'Impact' }, { value: 'growth', label: 'Growth' },
      { value: 'recognition', label: 'Recognition' }, { value: 'relationships', label: 'Relationships' },
      { value: 'compensation', label: 'Compensation' },
    ],
  },
  {
    id: 'ANC-VALUES-02', dimension: 'work-values', type: 'choice',
    prompt: 'Which trade-off would you currently prefer?',
    helper: 'Neither is better. This is about your present priorities, not a permanent label.',
    options: [
      { value: 'stability', label: 'More stability', description: 'With less day-to-day flexibility' },
      { value: 'flexibility', label: 'More flexibility', description: 'With less predictability' },
    ],
  },
];

const followUpQuestions: Question[] = [
  {
    id: 'FU-EXP-01-OWNERSHIP', dimension: 'demonstrated-evidence', type: 'narrative',
    prompt: 'What part did you personally handle or decide?',
    helper: 'A few words are enough. We ask this to understand your contribution, not to judge the outcome.',
    rationale: 'Your first example was brief, so this follow-up checks personal ownership.',
    followUpFor: 'ANC-EXP-01',
  },
  {
    id: 'FU-EXP-02-ACTION', dimension: 'demonstrated-evidence', type: 'narrative',
    prompt: 'What happened after you took those actions?',
    helper: 'An outcome can be a result, a change, or something you learned.',
    rationale: 'Your second example was brief, so this follow-up looks for an observable outcome.',
    followUpFor: 'ANC-EXP-02',
  },
];

export const questions = [...anchorQuestions, ...followUpQuestions];
export const anchorQuestionIds = anchorQuestions.map((question) => question.id);
export const dimensionLabels: Record<Dimension, string> = {
  interest: 'Interests',
  'self-perception': 'Self-perceived skills',
  'demonstrated-evidence': 'Demonstrated experience',
  'work-style': 'Work style',
  'work-values': 'Work values',
};

export const valuesLabels: Record<string, string> = {
  stability: 'Stability', autonomy: 'Autonomy', impact: 'Impact', growth: 'Growth',
  recognition: 'Recognition', relationships: 'Relationships', compensation: 'Compensation',
};

export interface Career {
  id: string;
  title: string;
  family: string;
  summary: string;
  typicalActivities: string[];
  skillsToExplore: string[];
  developmentGaps: string[];
  experiment: string;
  signalKeys: string[];
  evidenceNote: string;
}

export const careers: Career[] = [
  {
    id: 'data-analyst', title: 'Data analyst', family: 'Analytical work',
    summary: 'An illustrative direction centered on making sense of information and explaining patterns to support decisions.',
    typicalActivities: ['Organizing information into a useful shape', 'Exploring patterns and checking possible explanations', 'Sharing findings in clear language'],
    skillsToExplore: ['Structured problem framing', 'Data interpretation', 'Clear written communication'],
    developmentGaps: ['Practice with relevant tools', 'Domain knowledge for a chosen industry'],
    experiment: 'Choose a small public dataset, write one question about it, and create a one-page note showing what you explored and what you still do not know.',
    signalKeys: ['interest:investigation', 'self:systems', 'task:investigation', 'task:communication', 'task:process-improvement', 'style:structure', 'values:growth', 'values:stability'], evidenceNote: 'Career tasks and entry requirements vary by role and country; no market or licensing data is verified in this prototype.',
  },
  {
    id: 'user-researcher', title: 'User researcher', family: 'Research & people',
    summary: 'An illustrative direction combining curiosity about how things work with interest in understanding people’s experiences.',
    typicalActivities: ['Preparing neutral questions', 'Listening for needs and points of friction', 'Summarizing patterns without overstating what a few conversations show'],
    skillsToExplore: ['Interviewing', 'Synthesis', 'Ethical handling of information'],
    developmentGaps: ['Research methods', 'Practice separating observation from interpretation'],
    experiment: 'Ask a willing peer about one everyday process they find confusing. With permission, note what they said without recording personal details, then summarize three observations and one open question.',
    signalKeys: ['interest:investigation', 'interest:helping', 'task:investigation', 'task:communication', 'style:collaborative', 'values:impact', 'values:relationships'],
    evidenceNote: 'This is a sample career description, not a verified occupational standard or a recommendation to conduct research on others without consent.',
  },
  {
    id: 'learning-designer', title: 'Learning experience designer', family: 'Learning & communication',
    summary: 'An illustrative direction focused on helping people learn through clear explanations, practice, and useful feedback.',
    typicalActivities: ['Clarifying a learning goal', 'Breaking a topic into manageable steps', 'Creating practice activities and improving them from feedback'],
    skillsToExplore: ['Instructional writing', 'Learning activity design', 'Feedback and iteration'],
    developmentGaps: ['Learning design methods', 'A small portfolio of learning materials'],
    experiment: 'Create a short guide that teaches one small skill you know. Ask one person to use it, then note where they pause or ask questions.',
    signalKeys: ['interest:helping', 'self:planning', 'task:communication', 'task:planning', 'style:collaborative', 'style:exploration', 'values:impact', 'values:growth'],
    evidenceNote: 'Role titles and required qualifications differ across organizations and countries; market and entry requirements are not verified.',
  },
  {
    id: 'project-coordinator', title: 'Project coordinator', family: 'Planning & operations',
    summary: 'An illustrative direction involving turning a shared goal into clear actions, timelines, and follow-through.',
    typicalActivities: ['Clarifying next steps', 'Tracking dependencies and commitments', 'Keeping people informed when plans change'],
    skillsToExplore: ['Planning', 'Coordination', 'Expectation setting'],
    developmentGaps: ['Practice coordinating a small project', 'Tools used in the chosen context'],
    experiment: 'Plan a small event or personal project with three milestones. Track what changes and write a short reflection about how you handled it.',
    signalKeys: ['self:planning', 'task:planning', 'task:coordination', 'task:communication', 'style:structure', 'style:collaborative', 'values:stability', 'values:relationships'],
    evidenceNote: 'This is an illustrative role family; responsibilities and entry routes vary and are not verified for a specific country.',
  },
  {
    id: 'operations-analyst', title: 'Operations analyst', family: 'Systems & improvement',
    summary: 'An illustrative direction exploring how everyday processes work and where small, evidence-based improvements may help.',
    typicalActivities: ['Mapping a process', 'Finding bottlenecks or unclear handoffs', 'Testing a small improvement and observing the result'],
    skillsToExplore: ['Process mapping', 'Systems thinking', 'Basic measurement'],
    developmentGaps: ['Tools and methods used in a selected industry', 'A concrete process-improvement example'],
    experiment: 'Map a routine process you know, mark one point of confusion, and propose a small low-risk change. Do not collect private information.',
    signalKeys: ['interest:investigation', 'self:systems', 'task:investigation', 'task:planning', 'task:process-improvement', 'style:structure', 'values:stability', 'values:growth'],
    evidenceNote: 'The title can mean different work in different organizations; current job-market and qualification information is not verified.',
  },
];

export const roadmapStages = [
  { id: 'notice', title: 'Notice what draws you in', detail: 'Collect a few moments when a task felt interesting, frustrating, or surprisingly satisfying.', kind: 'reflection' },
  { id: 'try', title: 'Try a small real task', detail: 'Choose one low-risk experiment linked to a direction and record what you actually did.', kind: 'experiment' },
  { id: 'learn', title: 'Build one useful skill', detail: 'Select a single skill to practice and look for a learning resource from a provider you trust.', kind: 'learning' },
  { id: 'reflect', title: 'Reflect and adjust', detail: 'Compare your expectations with the experience. Keep, revise, or set aside the direction.', kind: 'reflection' },
];
