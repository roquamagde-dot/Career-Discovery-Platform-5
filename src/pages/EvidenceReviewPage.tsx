import { useMemo, useState } from 'react';
import { ArrowRight, Check, CircleHelp, RotateCcw, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { questions, taskSkillOptions } from '../data/content';
import { defaultEvidenceNote } from '../features/assessment/engine';
import { usePrototype } from '../lib/PrototypeContext';
import { ButtonLink, Eyebrow, InlineNotice, PageIntro, StatusPill } from '../components/Ui';

const evidenceIds = ['ANC-EXP-01', 'ANC-EXP-02', 'FU-EXP-01-OWNERSHIP', 'FU-EXP-02-ACTION'];

export function EvidenceReviewPage() {
  const { state, updateState } = usePrototype();
  const [savedMessage, setSavedMessage] = useState('');
  const items = useMemo(() => evidenceIds.flatMap((id) => {
    const answer = state.answers[id];
    if (typeof answer !== 'string' || !answer.trim()) return [];
    const question = questions.find((item) => item.id === id);
    if (!question) return [];
    const saved = state.evidenceReviews[id];
    return [{ id, prompt: question.prompt, answer, note: saved?.note ?? defaultEvidenceNote(id, answer), taskTags: saved?.taskTags ?? [], status: saved?.status ?? 'needs-review' as const }];
  }), [state.answers, state.evidenceReviews]);

  const updateReview = (id: string, note: string, status: 'needs-review' | 'confirmed' | 'disputed', taskTags?: string[]) => {
    updateState((current) => {
      const previous = current.evidenceReviews[id];
      return { ...current, evidenceReviews: { ...current.evidenceReviews, [id]: { note, status, taskTags: taskTags ?? previous?.taskTags ?? [] } } };
    });
    setSavedMessage('Your review is saved in this browser.');
  };

  return (
    <div className="content-wrap page-wrap narrow-wrap">
      <Link className="back-link" to="/assessment?edit=1"><RotateCcw size={14} /> Review your answers</Link>
      <PageIntro eyebrow="YOUR EXAMPLES, YOUR CALL" title="Review what you shared." description="These notes are linked to your answers. Edit, confirm, or dispute them before they appear in your discovery summary." aside={<StatusPill tone="caution">Not an AI interpretation</StatusPill>} />
      <InlineNotice>Only your written examples appear here. A confidence rating or an interest choice is not treated as evidence of ability. A task tag is your own proposed link to an example—not a verified skill.</InlineNotice>
      {items.length === 0 ? <div className="empty-state"><div className="empty-state-icon"><CircleHelp size={22} /></div><h2>No written examples to review yet.</h2><p>You can still see your reflection summary. If you want, return to the questions and add a concrete example; recommendations may stay provisional without one.</p><Link className="text-link" to="/assessment?edit=1">Review your answers <ArrowRight size={15} /></Link></div> : <div className="evidence-list">{items.map((item, index) => <article className="evidence-card" key={item.id}><div className="evidence-card-head"><span className="evidence-index">Example {String(index + 1).padStart(2, '0')}</span><StatusPill tone={item.status === 'confirmed' ? 'positive' : item.status === 'disputed' ? 'caution' : 'subtle'}>{item.status === 'needs-review' ? 'Needs your review' : item.status === 'confirmed' ? 'Confirmed by you' : 'Disputed by you'}</StatusPill></div><h3>{item.prompt}</h3><div className="source-answer"><span>YOUR ORIGINAL ANSWER</span><p>{item.answer}</p></div><label className="field"><span>What should your report say about this?</span><textarea id={`note-${item.id}`} rows={3} value={item.note} onChange={(event) => updateReview(item.id, event.target.value, 'needs-review', item.taskTags)} /></label><fieldset className="task-tag-fieldset"><legend>Which task connection, if any, might this example show?</legend><p>Optional. Only task tags you confirm are considered as a possible task/skill link; they remain self-reported.</p><div className="task-tag-list">{taskSkillOptions.map((option) => <label className="task-tag-option" key={option.value}><input type="checkbox" checked={item.taskTags.includes(option.value)} onChange={() => { const taskTags = item.taskTags.includes(option.value) ? item.taskTags.filter((tag) => tag !== option.value) : [...item.taskTags, option.value]; updateReview(item.id, item.note, 'needs-review', taskTags); }} /><span>{option.label}</span></label>)}</div></fieldset><div className="evidence-actions"><button className="button button-small button-secondary" type="button" onClick={() => updateReview(item.id, item.note, 'confirmed', item.taskTags)}><Check size={15} /> Confirm note and tags</button><button className="button button-small button-quiet" type="button" onClick={() => updateReview(item.id, item.note, 'disputed', item.taskTags)}><X size={15} /> Dispute note</button></div></article>)}</div>}
      {savedMessage && <p className="saved-message" role="status">{savedMessage}</p>}
      <section className="review-next"><div><Eyebrow>WHEN YOU’RE READY</Eyebrow><h2>Move forward with what feels true.</h2><p>Your report keeps evidence and interpretation separate—and shows when there is not enough information.</p></div><ButtonLink to="/report/prototype">View discovery summary</ButtonLink></section>
    </div>
  );
}
