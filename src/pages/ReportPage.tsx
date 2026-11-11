import { ArrowUpRight, CheckCircle2, CircleDashed, Compass, FileCheck2, HeartHandshake, Layers3, Sparkles } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { dimensionLabels, questions, valuesLabels } from '../data/content';
import { defaultEvidenceNote } from '../features/assessment/engine';
import { findCareerMatches } from '../features/matching/matcher';
import { usePrototype } from '../lib/PrototypeContext';
import { ButtonLink, Eyebrow, InlineNotice, PageIntro, StatusPill } from '../components/Ui';
import { NotFoundPage } from './NotFoundPage';

const evidenceIds = ['ANC-EXP-01', 'ANC-EXP-02', 'FU-EXP-01-OWNERSHIP', 'FU-EXP-02-ACTION'];

export function ReportPage() {
  const { state } = usePrototype();
  const { id = 'prototype' } = useParams();
  const historical = id === 'prototype' ? undefined : state.history.find((report) => report.id === id);
  if (id !== 'prototype' && !historical) return <NotFoundPage />;
  const answers = historical?.answers ?? state.answers;
  const profile = historical?.profile ?? state.profile;
  const evidenceReviews = historical?.evidenceReviews ?? state.evidenceReviews;
  const matches = findCareerMatches(answers, evidenceReviews);
  const narrativeCount = ['ANC-EXP-01', 'ANC-EXP-02'].filter((key) => typeof answers[key] === 'string' && (answers[key] as string).trim().length > 0).length;
  const interestCount = ['ANC-INT-01', 'ANC-INT-02'].filter((key) => answers[key] !== undefined).length;
  const selfCount = ['ANC-SELF-01', 'ANC-SELF-02'].filter((key) => answers[key] !== undefined).length;
  const styleCount = ['ANC-STYLE-01', 'ANC-STYLE-02'].filter((key) => answers[key] !== undefined).length;
  const valueAnswer = answers['ANC-VALUES-01'];
  const topValues = Array.isArray(valueAnswer) ? valueAnswer.map((value) => valuesLabels[value] ?? value) : [];
  const evidenceItems = evidenceIds.flatMap((questionId) => {
    const answer = answers[questionId];
    if (typeof answer !== 'string' || !answer.trim()) return [];
    const question = questions.find((item) => item.id === questionId);
    if (!question) return [];
    const review = evidenceReviews[questionId];
    return [{ id: questionId, prompt: question.prompt, answer, note: review?.note ?? defaultEvidenceNote(questionId, answer), taskTags: review?.taskTags ?? [], status: review?.status ?? 'needs-review' as const }];
  });
  const dimensions = [
    { title: dimensionLabels.interest, icon: Compass, status: interestCount ? `${interestCount} reflection${interestCount > 1 ? 's' : ''} shared` : 'Not explored yet', description: interestCount ? 'Your answers show activities you may find engaging. Interest is not a measure of skill.' : 'There is not enough information to describe this signal yet.' },
    { title: dimensionLabels['self-perception'], icon: Sparkles, status: selfCount ? `${selfCount} confidence signal${selfCount > 1 ? 's' : ''}` : 'Not explored yet', description: selfCount ? 'These are your current confidence ratings. They are not evidence of demonstrated ability.' : 'There is not enough information to describe this signal yet.' },
    { title: dimensionLabels['demonstrated-evidence'], icon: FileCheck2, status: narrativeCount ? `${narrativeCount} example${narrativeCount > 1 ? 's' : ''} shared` : 'Needs more evidence', description: narrativeCount > 1 ? 'Repeated self-reported examples provide more context and may strengthen a skill hypothesis, but are not independent certification. They do not increase career matches automatically.' : narrativeCount === 1 ? 'A specific self-reported example may support a skill hypothesis after your review, but it does not certify ability or increase a match automatically.' : 'No written example was shared, so skill evidence remains unknown.' },
    { title: dimensionLabels['work-style'], icon: Layers3, status: styleCount ? `${styleCount} preference${styleCount > 1 ? 's' : ''} shared` : 'Not explored yet', description: styleCount ? 'Your preferences can vary by task and context. They are not permanent work-style labels.' : 'There is not enough information to describe this signal yet.' },
    { title: dimensionLabels['work-values'], icon: HeartHandshake, status: topValues.length ? 'Current priorities shared' : 'Not explored yet', description: topValues.length ? `Your selected priorities, in order: ${topValues.join(' · ')}. Values can shift over time.` : 'There is not enough information to describe this signal yet.' },
  ];

  return (
    <div className="content-wrap page-wrap">
      <div className="report-topline"><Link className="back-link" to="/dashboard">Back to My space</Link><StatusPill tone="caution">{matches.length ? 'Provisional exploration directions' : 'More reflection may help'}</StatusPill></div>
      <PageIntro eyebrow={historical ? 'SAVED DISCOVERY NOTES' : 'YOUR DISCOVERY NOTES'} title={profile.name ? `${profile.name}, here’s what your answers suggest.` : 'Here’s what your answers suggest—so far.'} description={historical ? `A saved draft from ${new Date(historical.completedAt).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}. This version is read-only; your current reflection may be different.` : 'A working reflection, not a score or a verdict. You can revise your examples and revisit this profile as you learn more.'} aside={<span className="report-stamp">{historical ? `SAVED · ${historical.assessmentVersion.toUpperCase()}` : 'DRAFT REPORT · v1.3'}</span>} />
      <div className="report-layout">
        <div className="report-main">
          <section className="report-section"><div className="section-heading"><div><Eyebrow>YOUR PROFILE</Eyebrow><h2>Five signals, kept distinct.</h2></div>{!historical && <Link className="text-link" to="/evidence-review">Review evidence <ArrowUpRight size={15} /></Link>}</div><div className="signal-list">{dimensions.map(({ title, icon: Icon, status, description }, index) => <article className="signal-row" key={title}><span className="signal-icon"><Icon size={18} /></span><div className="signal-content"><div className="signal-heading"><h3>{title}</h3><span>{status}</span></div><p>{description}</p></div>{index < 3 ? <CheckCircle2 className="signal-mark" size={17} /> : <CircleDashed className="signal-mark muted" size={17} />}</article>)}</div></section>
          <section className="report-section evidence-report"><div className="section-heading"><div><Eyebrow>ANSWER-LINKED NOTES</Eyebrow><h2>What you actually shared</h2><p>Original examples remain visible beside the editable note. No example is treated as certification.</p></div></div>{evidenceItems.length ? <div className="evidence-list">{evidenceItems.map((item) => <article className="evidence-card" key={item.id}><div className="evidence-card-head"><span className="evidence-index">SELF-REPORTED EXAMPLE · {item.id}</span><StatusPill tone={item.status === 'confirmed' ? 'positive' : item.status === 'disputed' ? 'caution' : 'subtle'}>{item.status === 'confirmed' ? 'Confirmed by you' : item.status === 'disputed' ? 'Disputed by you' : 'Needs your review'}</StatusPill></div><h3>{item.prompt}</h3><div className="source-answer"><span>ORIGINAL ANSWER</span><p>{item.answer}</p></div><div className="source-answer note-answer"><span>{item.status === 'disputed' ? 'YOUR DISPUTED NOTE' : 'WORKING NOTE'}</span><p>{item.note || 'No interpretation has been added.'}</p></div>{item.taskTags.length > 0 && <div className="confirmed-tags"><strong>{item.status === 'confirmed' ? 'Confirmed task links:' : 'Draft task links:'}</strong> {item.taskTags.join(' · ')} <span>{item.status === 'confirmed' ? 'Self-reported, not independently verified.' : 'Not used in matches until you confirm the note and tags.'}</span></div>}</article>)}</div> : <div className="empty-state inline-empty"><h3>No written example is available yet.</h3><p>Skill evidence remains unknown; interest and confidence signals are not substituted for it.</p></div>}</section>
          <section className="report-section career-results"><div className="section-heading"><div><Eyebrow>OPTIONS TO EXPLORE</Eyebrow><h2>Possible directions</h2><p>No compatibility percentages. Each suggestion is a provisional hypothesis based on visible interest, confidence, confirmed task links, work style, or values—not a demonstrated skill score or market forecast.</p></div></div>
            {matches.length ? <div className="match-list">{matches.map((match, index) => { const groups = [{ title: 'Interest', values: match.signalGroups.interests }, { title: 'Self-perception', values: match.signalGroups.selfPerception }, { title: 'Possible task/skill link', values: match.signalGroups.taskSkillAlignment }, { title: 'Work style', values: match.signalGroups.workStyle }, { title: 'Work values', values: match.signalGroups.workValues }].filter((group) => group.values.length > 0); return <article className="match-card" key={match.career.id}><div className="match-card-top"><span className="match-order">0{index + 1}</span><StatusPill tone="caution">Provisional</StatusPill></div><p className="career-family">{match.career.family}</p><h3>{match.career.title}</h3><p>{match.career.summary}</p><div className="match-explanation"><strong>Why it appeared</strong>{groups.map((group) => <div className="match-signal-group" key={group.title}><span>{group.title}</span><ul>{group.values.map((signal) => <li key={signal}>{signal}</li>)}</ul></div>)}<div className="match-evidence-separation"><strong>Demonstrated evidence stays separate</strong><p>{match.signalGroups.demonstratedEvidence[0]}</p></div></div><div className="match-foot"><span>Market opportunity: <strong>Not verified</strong></span><Link className="text-link" to={`/careers/${match.career.id}`}>Explore direction <ArrowUpRight size={15} /></Link></div></article>; })}</div> : <div className="empty-state inline-empty"><h3>Not enough signal for a supported suggestion yet.</h3><p>That is a useful result, too. Review your answers or explore the sample directions yourself without treating them as matches.</p>{!historical && <Link className="text-link" to="/assessment?edit=1">Review your answers <ArrowUpRight size={15} /></Link>}</div>}
          </section>
        </div>
        <aside className="report-aside"><div className="aside-card"><Eyebrow>WHAT COMES NEXT</Eyebrow><h3>Test an idea in a small way.</h3><p>Choose a low-risk task and notice what the experience teaches you—before making a bigger commitment.</p><ButtonLink to={matches[0] ? `/roadmaps/${matches[0].career.id}` : '/dashboard'} tone="secondary">{matches[0] ? 'View a sample roadmap' : 'Open My space'}</ButtonLink></div><div className="aside-card aside-card-soft"><Eyebrow>YOUR EXAMPLES</Eyebrow><div className="evidence-count">{narrativeCount}<span>/ 2</span></div><p>Draft experience anchors with written responses. Self-ratings are not counted as evidence.</p>{!historical && <Link className="text-link" to="/evidence-review">Review and edit <ArrowUpRight size={15} /></Link>}</div><p className="report-caption">Assessment framework: draft v1.3. Not reviewed by a qualified psychometric or career-guidance specialist.</p></aside>
      </div>
      <InlineNotice tone="caution"><strong>Read this as a set of hypotheses.</strong> These directions are generated by simple, fixed rules and draft examples. There is no validated fit score, and country-specific market, salary, licensing, education, and job-access information is not verified.</InlineNotice>
    </div>
  );
}
