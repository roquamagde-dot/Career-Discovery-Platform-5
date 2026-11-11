import { useState } from 'react';
import { ArrowLeft, Check, Circle, RotateCcw } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { roadmapStages } from '../data/content';
import { getCareerById } from '../features/matching/matcher';
import { usePrototype } from '../lib/PrototypeContext';
import { ButtonLink, Eyebrow, InlineNotice, PageIntro, ProgressBar } from '../components/Ui';
import { NotFoundPage } from './NotFoundPage';

export function RoadmapPage() {
  const { id = '' } = useParams();
  const { state, updateState } = usePrototype();
  const career = getCareerById(id);
  const [justUpdated, setJustUpdated] = useState(false);
  if (!career) return <NotFoundPage />;
  const complete = roadmapStages.filter((stage) => state.roadmapProgress.includes(`${id}:${stage.id}`)).length;
  const toggle = (stageId: string) => {
    const key = `${id}:${stageId}`;
    const next = state.roadmapProgress.includes(key) ? state.roadmapProgress.filter((item) => item !== key) : [...state.roadmapProgress, key];
    updateState({ roadmapProgress: next });
    setJustUpdated(true);
  };

  return (
    <div className="content-wrap page-wrap">
      <Link className="back-link" to={`/careers/${id}`}><ArrowLeft size={15} /> Back to {career.title}</Link>
      <PageIntro eyebrow="A SAMPLE LEARNING PATH" title="Make the next step small." description={`An illustrative roadmap for exploring ${career.title}. Choose what feels useful; this is not a required sequence or a promise of employment.`} aside={<span className="report-stamp">SAMPLE · NOT VERIFIED</span>} />
      <div className="roadmap-summary"><div><Eyebrow>YOUR EXPERIMENTAL PATH</Eyebrow><h2>{career.title}</h2><p>Four reflection and practice stages. Use trusted providers and check availability, cost, and quality before choosing a resource.</p></div><div className="roadmap-progress"><div className="roadmap-progress-number">{complete}<span> / {roadmapStages.length}</span></div><span>stages completed</span></div></div>
      <ProgressBar value={Math.round((complete / roadmapStages.length) * 100)} label="Roadmap progress · stored in this browser" />
      <div className="roadmap-list">{roadmapStages.map((stage, index) => { const done = state.roadmapProgress.includes(`${id}:${stage.id}`); return <article className={`roadmap-stage ${done ? 'is-done' : ''}`} key={stage.id}><div className="stage-rail"><span className="stage-dot">{done ? <Check size={14} /> : String(index + 1).padStart(2, '0')}</span>{index < roadmapStages.length - 1 && <span className="stage-line" />}</div><div className="stage-content"><div className="stage-heading"><div><span className="stage-kind">{stage.kind}</span><h3>{stage.title}</h3></div><button className={`stage-toggle ${done ? 'done' : ''}`} type="button" onClick={() => toggle(stage.id)} aria-pressed={done}>{done ? <><Check size={15} /> Done</> : <><Circle size={15} /> Mark complete</>}</button></div><p>{stage.detail}</p>{stage.id === 'try' && <div className="resource-sample"><Eyebrow>SAMPLE EXPERIMENT · NOT AN EXTERNAL RESOURCE</Eyebrow><p>{career.experiment}</p></div>}{stage.id === 'learn' && <div className="resource-sample"><Eyebrow>LEARNING RESOURCE NOTE</Eyebrow><p>No provider or course has been verified in this prototype. Choose a trusted resource that fits your language, budget, and goal.</p></div>}</div></article>; })}</div>
      {justUpdated && <p className="saved-message" role="status">Progress updated locally.</p>}
      <div className="roadmap-end"><span><RotateCcw size={16} /> Revisit this direction after each experiment.</span><ButtonLink to="/dashboard" tone="secondary">Back to My space</ButtonLink></div>
      <InlineNotice tone="caution">Example content only. The roadmap does not include verified qualifications, courses, provider terms, country requirements, or current labor-market data.</InlineNotice>
    </div>
  );
}
