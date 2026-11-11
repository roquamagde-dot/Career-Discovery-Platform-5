import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Pause, Save } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { dimensionLabels, questions, type Answer, type Question } from '../data/content';
import { getAnchorCoverage, getEligibleQuestions, getNextQuestion } from '../features/assessment/engine';
import { usePrototype } from '../lib/PrototypeContext';
import { Eyebrow, InlineNotice, ProgressBar, StatusPill } from '../components/Ui';

function ScaleChoices({ question, value, onChange }: { question: Question; value: number | undefined; onChange: (value: number) => void }) {
  const labels = question.type === 'rating' ? ['Not interested', 'A little', 'Somewhat', 'Quite interested', 'Very interested'] : ['Not confident', 'A little', 'Somewhat', 'Quite confident', 'Very confident'];
  return <div className="scale-options" role="radiogroup" aria-label={question.type === 'rating' ? 'Interest level from 1 to 5' : 'Confidence level from 1 to 5'}>{[1, 2, 3, 4, 5].map((number) => <button className={`scale-option ${value === number ? 'selected' : ''}`} key={number} type="button" role="radio" aria-checked={value === number} onClick={() => onChange(number)}><span>{number}</span><small>{labels[number - 1]}</small></button>)}</div>;
}

export function AssessmentPage() {
  const { state, updateState } = usePrototype();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editing = searchParams.get('edit') === '1';
  const [editIndex, setEditIndex] = useState(0);
  const [rating, setRating] = useState<number>();
  const [example, setExample] = useState('');
  const [text, setText] = useState('');
  const [ranked, setRanked] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const editQuestions = useMemo(() => getEligibleQuestions(state.answers, state.skippedQuestionIds), [state.answers, state.skippedQuestionIds]);

  useEffect(() => {
    if (!state.privacyAccepted) navigate('/onboarding', { replace: true });
    if (state.sessionStatus === 'completed' && !editing) navigate('/evidence-review', { replace: true });
  }, [editing, navigate, state.privacyAccepted, state.sessionStatus]);

  const questionSet = useMemo(() => getEligibleQuestions(state.answers, state.skippedQuestionIds), [state.answers, state.skippedQuestionIds]);
  const question = editing ? editQuestions[editIndex] : getNextQuestion(state.answers, state.skippedQuestionIds);
  const coverage = getAnchorCoverage(state.answers, state.skippedQuestionIds);
  const answerCount = questionSet.filter((item) => state.answers[item.id] !== undefined || state.skippedQuestionIds.includes(item.id)).length;
  const progressValue = editing ? Math.round(((editIndex + 1) / editQuestions.length) * 100) : questionSet.length ? Math.round((answerCount / questionSet.length) * 100) : 0;

  useEffect(() => {
    if (!question) return;
    const current = state.answers[question.id];
    if (typeof current === 'number') setRating(current);
    else if (current && typeof current === 'object' && !Array.isArray(current) && 'rating' in current) {
      setRating(current.rating);
      setExample(current.example);
    } else setRating(undefined);
    if (typeof current === 'string') setText(current); else setText('');
    if (Array.isArray(current)) setRanked(current); else setRanked([]);
    setMessage('');
  }, [question?.id, state.answers, question]);

  const finishIfDone = (answers: Record<string, Answer>, skipped: string[]) => {
    const next = getNextQuestion(answers, skipped);
    if (!next) {
      updateState({ sessionStatus: 'completed', completedAt: new Date().toISOString() });
      navigate('/evidence-review');
    }
  };

  const saveAnswer = () => {
    if (!question) return;
    let value: Answer;
    if (question.type === 'rating') {
      if (!rating) return setMessage('Choose the response that feels closest.');
      value = rating;
    } else if (question.type === 'self-rating') {
      if (!rating) return setMessage('Choose a confidence level, or skip this question.');
      value = { rating, example: example.trim() };
    } else if (question.type === 'narrative') {
      if (!text.trim()) return setMessage('Add a few words, or use Skip this question.');
      value = text.trim();
    } else if (question.type === 'ranking') {
      if (ranked.length !== 3) return setMessage('Choose exactly three factors, in order.');
      value = ranked;
    } else {
      if (!text) return setMessage('Choose an option, or skip this question.');
      value = text;
    }
    const answers = { ...state.answers, [question.id]: value };
    let skipped = state.skippedQuestionIds.filter((id) => id !== question.id);
    const evidenceReviews = { ...state.evidenceReviews };
    const responseChanged = JSON.stringify(state.answers[question.id]) !== JSON.stringify(value);
    if (editing && question.type === 'narrative' && responseChanged) {
      delete evidenceReviews[question.id];
      questions.filter((item) => item.followUpFor === question.id).forEach((item) => {
        delete answers[item.id];
        delete evidenceReviews[item.id];
        skipped = skipped.filter((id) => id !== item.id);
      });
    }
    if (editing) {
      const next = getNextQuestion(answers, skipped);
      const isLastEdit = editIndex >= editQuestions.length - 1;
      updateState({ answers, skippedQuestionIds: skipped, evidenceReviews, sessionStatus: isLastEdit && next ? 'in-progress' : state.sessionStatus });
      if (!isLastEdit) setEditIndex((current) => current + 1);
      else if (next) navigate('/assessment');
      else navigate('/evidence-review');
      return;
    }
    updateState({ answers, skippedQuestionIds: skipped, sessionStatus: 'in-progress' });
    finishIfDone(answers, skipped);
  };

  const skipQuestion = () => {
    if (!question) return;
    if (editing) {
      const answers = { ...state.answers };
      const evidenceReviews = { ...state.evidenceReviews };
      delete answers[question.id];
      delete evidenceReviews[question.id];
      let skipped = [...new Set([...state.skippedQuestionIds, question.id])];
      questions.filter((item) => item.followUpFor === question.id).forEach((item) => {
        delete answers[item.id];
        delete evidenceReviews[item.id];
        skipped = skipped.filter((id) => id !== item.id);
      });
      const next = getNextQuestion(answers, skipped);
      const isLastEdit = editIndex >= editQuestions.length - 1;
      updateState({ answers, skippedQuestionIds: skipped, evidenceReviews, sessionStatus: isLastEdit && next ? 'in-progress' : state.sessionStatus });
      if (!isLastEdit) setEditIndex((current) => current + 1);
      else if (next) navigate('/assessment');
      else navigate('/evidence-review');
      return;
    }
    const skipped = [...new Set([...state.skippedQuestionIds, question.id])];
    updateState({ skippedQuestionIds: skipped, sessionStatus: 'in-progress' });
    finishIfDone(state.answers, skipped);
  };

  const pause = () => {
    if (!editing) updateState({ sessionStatus: 'paused' });
    navigate('/dashboard');
  };

  const chooseRanked = (value: string) => {
    setRanked((current) => current.includes(value) ? current.filter((item) => item !== value) : current.length < 3 ? [...current, value] : current);
  };

  if (!state.privacyAccepted || (!editing && state.sessionStatus === 'completed')) return null;
  if (!question) return <div className="content-wrap page-wrap"><p>Preparing your next step…</p></div>;

  return (
    <div className="content-wrap assessment-wrap">
      <div className="assessment-top"><button className="back-link button-quiet" type="button" onClick={pause}><span className="back-arrow">‹</span> {editing ? 'Save and leave' : 'Save and leave'}</button><StatusPill>{editing ? 'Reviewing your answers' : 'Draft reflection · v1.3'}</StatusPill></div>
      <ProgressBar value={progressValue} label={editing ? `Reviewing answer ${editIndex + 1} of ${editQuestions.length}` : `Question ${Math.min(answerCount + 1, questionSet.length)} of ${questionSet.length}`} />
      <div className="assessment-layout">
        <aside className="assessment-rail"><Eyebrow>YOUR JOURNEY</Eyebrow><ol>{['Interests', 'Self-perceived skills', 'Demonstrated experience', 'Work style', 'Work values'].map((dimension, index) => <li className={dimensionLabels[question.dimension as keyof typeof dimensionLabels] === dimension ? 'current' : ''} key={dimension}><span>{String(index + 1).padStart(2, '0')}</span>{dimension}</li>)}</ol><div className="rail-note"><span className="tiny-dot" />{coverage.answered} of 10 shared anchor questions answered</div></aside>
        <section className="question-panel" aria-live="polite">
          <div className="question-kicker"><Eyebrow>{dimensionLabels[question.dimension]}</Eyebrow><span className="question-id">{question.id}</span></div>
          <h1>{question.prompt}</h1><p className="question-helper">{question.helper}</p>
          {question.rationale && <p className="followup-note"><span>WHY THIS FOLLOW-UP</span>{question.rationale}</p>}
          {(question.type === 'rating' || question.type === 'self-rating') && <ScaleChoices question={question} value={rating} onChange={setRating} />}
          {question.type === 'self-rating' && <label className="field question-extra"><span>Would you like to add an example? <small>Optional</small></span><textarea value={example} onChange={(event) => setExample(event.target.value)} rows={3} placeholder="A moment that comes to mind…" /></label>}
          {question.type === 'narrative' && <label className="field question-extra"><span>Your response</span><textarea autoFocus value={text} onChange={(event) => setText(event.target.value)} rows={6} placeholder="Start wherever it feels easiest. You can keep this brief." /></label>}
          {question.type === 'choice' && <div className="choice-list">{question.options?.map((option) => <button type="button" className={`choice-option ${text === option.value ? 'selected' : ''}`} onClick={() => setText(option.value)} key={option.value}><span className="choice-radio" /><span><strong>{option.label}</strong>{option.description && <small>{option.description}</small>}</span></button>)}</div>}
          {question.type === 'ranking' && <div className="rank-options">{question.options?.map((option) => { const position = ranked.indexOf(option.value); return <button className={`rank-option ${position >= 0 ? 'selected' : ''}`} type="button" onClick={() => chooseRanked(option.value)} key={option.value}><span className="rank-num">{position >= 0 ? position + 1 : '+'}</span>{option.label}</button>; })}<p className="field-note">{ranked.length} of 3 selected. Select them in your preferred order.</p></div>}
          {message && <p className="form-error" role="alert">{message}</p>}
          <InlineNotice>There are no right answers. Your answer is a clue to explore, not a permanent label.</InlineNotice>
          <div className="question-actions"><button className="button button-primary" type="button" onClick={saveAnswer}>{editing && editIndex === editQuestions.length - 1 ? 'Save and return' : 'Save and continue'} <ArrowRight size={16} /></button><button className="button button-quiet" type="button" onClick={skipQuestion}>{editing ? 'Clear this answer' : 'Skip this question'}</button><button className="button button-quiet pause-button" type="button" onClick={pause}><Pause size={15} /> {editing ? 'Leave review' : 'Pause for now'}</button></div>
          <div className="autosave-note"><Save size={14} /> Progress saves in this browser only.</div>
        </section>
      </div>
    </div>
  );
}
