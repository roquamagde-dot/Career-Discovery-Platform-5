import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpenCheck, CircleHelp, Clock3, FileText, Flag, RotateCcw, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { anchorQuestionIds, careers, roadmapStages } from '../data/content';
import { usePrototype } from '../lib/PrototypeContext';
import type { ReportSnapshot } from '../lib/storage';
import { ButtonLink, Eyebrow, InlineNotice, StatusPill } from '../components/Ui';

export function DashboardPage() {
  const { state, updateState, user, saveStatus, saveError, refreshWorkspace } = usePrototype();
  const navigate = useNavigate();
  const hasStarted = state.privacyAccepted || state.sessionStatus !== 'not-started';
  const answered = anchorQuestionIds.filter((id) => state.answers[id] !== undefined).length;
  const progressCareer = careers.find((career) => state.roadmapProgress.some((item) => item.startsWith(`${career.id}:`)));
  const progressCount = progressCareer ? state.roadmapProgress.filter((item) => item.startsWith(`${progressCareer.id}:`)).length : 0;
  const firstName = state.profile.name.trim().split(' ')[0] || user?.displayName?.trim().split(' ')[0] || '';
  const summaryRows = [
    { label: 'Interests', count: ['ANC-INT-01', 'ANC-INT-02'].filter((id) => state.answers[id] !== undefined).length, description: 'activity reflections' },
    { label: 'Self-perception', count: ['ANC-SELF-01', 'ANC-SELF-02'].filter((id) => state.answers[id] !== undefined).length, description: 'confidence reflections' },
    { label: 'Demonstrated evidence', count: ['ANC-EXP-01', 'ANC-EXP-02'].filter((id) => typeof state.answers[id] === 'string' && (state.answers[id] as string).trim()).length, description: 'written examples' },
    { label: 'Work style', count: ['ANC-STYLE-01', 'ANC-STYLE-02'].filter((id) => state.answers[id] !== undefined).length, description: 'preferences' },
    { label: 'Work values', count: Array.isArray(state.answers['ANC-VALUES-01']) ? 1 : 0, description: 'priority ranking' },
  ];

  const startFreshReflection = () => {
    if (state.sessionStatus === 'completed' && state.completedAt) {
      const snapshot: ReportSnapshot = {
        id: `${Date.now()}`,
        completedAt: state.completedAt,
        assessmentVersion: state.assessmentVersion,
        profile: { ...state.profile },
        answers: { ...state.answers },
        evidenceReviews: { ...state.evidenceReviews },
      };
      updateState({
        history: [snapshot, ...state.history.filter((report) => report.completedAt !== snapshot.completedAt)],
        answers: {}, skippedQuestionIds: [], evidenceReviews: {}, sessionStatus: 'in-progress', completedAt: undefined,
      });
      navigate('/assessment');
    }
  };

  const statusText = saveStatus === 'saving' ? 'Saving to your account…' : saveStatus === 'saved' ? 'Saved to your account' : saveStatus === 'error' ? saveError : 'Your account workspace is ready';

  return (
    <div className="content-wrap page-wrap">
      <div className="dashboard-greeting"><div><Eyebrow>YOUR PERSONAL SPACE</Eyebrow><h1>{firstName ? `A little more clarity, ${firstName}.` : 'Keep following the clues.'}</h1><p>Your account workspace for revisiting reflections and choosing a next step.</p></div><StatusPill tone={saveStatus === 'error' ? 'caution' : state.sessionStatus === 'completed' ? 'positive' : 'caution'}>{state.sessionStatus === 'completed' ? 'Reflection complete · draft' : state.sessionStatus === 'paused' ? 'Paused · saved to account' : 'Account workspace'}</StatusPill></div>
      <p className={saveStatus === 'error' ? 'form-error' : 'saved-message'} role="status">{statusText}{saveStatus === 'error' && <> <button type="button" className="text-button" onClick={() => void refreshWorkspace().catch(() => undefined)}>Reload saved workspace</button></>}</p>
      {!hasStarted ? <section className="dashboard-start-card"><div className="dashboard-start-icon"><Sparkles size={23} /></div><div><Eyebrow>YOUR FIRST STEP</Eyebrow><h2>Start with what you’ve already noticed.</h2><p>Answer a few draft questions about interests, confidence, experiences, work style, and values. You can pause whenever you like.</p><ButtonLink to="/onboarding">Begin discovery</ButtonLink></div><div className="dashboard-stamp">10<br /><span>draft anchors</span></div></section> : <div className="dashboard-grid"><section className="dashboard-main-card"><div className="card-top"><Eyebrow>YOUR REFLECTION</Eyebrow><FileText size={19} /></div><h2>{state.sessionStatus === 'completed' ? 'Your discovery notes are ready.' : state.sessionStatus === 'paused' ? 'Pick up where you left off.' : 'Your discovery journey is in progress.'}</h2><p>{state.sessionStatus === 'completed' ? 'Review your five signal dimensions and any provisional directions supported by your answers.' : `${answered} of ${anchorQuestionIds.length} shared anchor questions answered so far. Your latest changes are saved to your account.`}</p><div className="dashboard-card-actions">{state.sessionStatus === 'completed' ? <><ButtonLink to="/report/prototype">View discovery notes</ButtonLink><button className="button button-secondary" type="button" onClick={startFreshReflection}>Start a new reflection <RotateCcw size={15} /></button></> : <Link className="button button-primary" to="/assessment" onClick={() => updateState({ sessionStatus: 'in-progress' })}>{state.sessionStatus === 'paused' ? 'Resume reflection' : 'Continue reflection'} <ArrowRight size={16} /></Link>}<Link className="quiet-link" to="/evidence-review">Review examples</Link></div></section>
          <section className="dashboard-side-card"><div className="card-top"><Eyebrow>ACTIVE ROADMAP</Eyebrow><BookOpenCheck size={18} /></div>{progressCareer ? <><h3>{progressCareer.title}</h3><p>{progressCount} of {roadmapStages.length} sample stages marked complete.</p><Link className="text-link" to={`/roadmaps/${progressCareer.id}`}>Continue roadmap <ArrowRight size={15} /></Link></> : <><h3>No roadmap chosen yet.</h3><p>Explore a sample direction after reviewing your discovery notes.</p><Link className="text-link" to={state.sessionStatus === 'completed' ? '/report/prototype' : '/how-it-works'}>See what comes next <ArrowRight size={15} /></Link></>}</section>
          <section className="dashboard-history"><div className="card-top"><Eyebrow>YOUR REFLECTION HISTORY</Eyebrow><Clock3 size={18} /></div>{state.sessionStatus !== 'completed' && <div className="history-row"><span className="history-mark"><CircleHelp size={16} /></span><div><strong>Current draft</strong><span>Saved in your account workspace</span></div><StatusPill tone="caution">In progress</StatusPill></div>}{state.history.map((report) => <div className="history-row" key={report.id}><span className="history-mark"><FileText size={16} /></span><div><strong>Saved reflection · {report.assessmentVersion}</strong><span>{new Date(report.completedAt).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}</span></div><Link className="text-link" to={`/report/${report.id}`}>View report <ArrowRight size={14} /></Link></div>)}{state.sessionStatus === 'completed' && <div className="history-row"><span className="history-mark"><CircleHelp size={16} /></span><div><strong>Current reflection · draft v1.3</strong><span>{state.completedAt ? new Date(state.completedAt).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Saved to your account'}</span></div><Link className="text-link" to="/report/prototype">View current report <ArrowRight size={14} /></Link></div>}<div className="history-actions"><Link className="text-link" to="/settings">Privacy & data settings <ArrowRight size={15} /></Link><Link className="text-link" to={state.sessionStatus === 'completed' ? '/assessment?edit=1' : '/assessment'}><RotateCcw size={15} /> Revisit answers</Link></div></section>
        </div>}
      {state.sessionStatus === 'completed' && <section className="dashboard-profile-summary"><div className="profile-summary-heading"><div><Eyebrow>PROFILE SNAPSHOT</Eyebrow><h2>Five signals, no scores.</h2><p>A quick view of what you shared so far. This summary is exploratory, not an assessment result.</p></div><Link className="text-link" to="/report/prototype">Read full notes <ArrowRight size={15} /></Link></div><div className="profile-summary-list">{summaryRows.map((row) => <div className="profile-summary-row" key={row.label}><strong>{row.label}</strong><span>{row.count ? `${row.count} ${row.description}` : 'Not explored yet'}</span></div>)}</div></section>}
      <section className="dashboard-reminder"><Flag size={17} /><p><strong>Remember:</strong> This prototype is exploratory, not validated, and its career, market, and licensing examples are not verified.</p></section>
      <InlineNotice tone="caution">Use your own judgment. These draft suggestions are not diagnoses, validated outcomes, or guarantees of employment or success.</InlineNotice>
    </div>
  );
}
