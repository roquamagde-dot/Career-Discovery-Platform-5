import { ArrowLeft, ArrowRight, BookOpenCheck, BriefcaseBusiness, CircleAlert, FlaskConical, ListChecks } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getCareerById } from '../features/matching/matcher';
import { ButtonLink, Eyebrow, InlineNotice, StatusPill } from '../components/Ui';
import { NotFoundPage } from './NotFoundPage';

export function CareerPage() {
  const { id = '' } = useParams();
  const career = getCareerById(id);
  if (!career) return <NotFoundPage />;

  return (
    <div className="content-wrap page-wrap">
      <Link className="back-link" to="/report/prototype"><ArrowLeft size={15} /> Back to discovery notes</Link>
      <section className="career-hero"><div><Eyebrow>ILLUSTRATIVE CAREER DIRECTION · {career.family.toUpperCase()}</Eyebrow><h1>{career.title}</h1><p>{career.summary}</p><StatusPill tone="caution">Exploration example · not a verified match</StatusPill></div><div className="career-mark"><BriefcaseBusiness size={30} /><span>Explore<br />the work</span></div></section>
      <div className="career-detail-layout"><div className="career-detail-main"><section className="detail-section"><div className="detail-section-title"><ListChecks size={19} /><div><Eyebrow>ILLUSTRATIVE ROLE OUTLINE</Eyebrow><h2>Activities you might encounter</h2></div></div><ul className="check-list">{career.typicalActivities.map((activity) => <li key={activity}><span className="list-check"><ArrowRight size={13} /></span>{activity}</li>)}</ul></section>
        <section className="detail-section"><div className="detail-section-title"><BookOpenCheck size={19} /><div><Eyebrow>SKILLS TO EXPLORE</Eyebrow><h2>Possible areas to practice</h2></div></div><div className="skill-chip-list">{career.skillsToExplore.map((skill) => <span className="skill-chip" key={skill}>{skill}</span>)}</div><p className="detail-note">These are sample development themes, not an official job specification or a judgment of your current ability.</p></section>
        <section className="detail-section"><div className="detail-section-title"><BriefcaseBusiness size={19} /><div><Eyebrow>WORK CONTEXT</Eyebrow><h2>Varies by employer and place</h2></div></div><p className="context-copy">Teams, day-to-day work, entry routes, qualifications, and geographic availability differ across organizations and countries. This prototype has no verified local source for those details, so it does not prescribe a single work environment.</p></section>
        <section className="experiment-card"><div className="experiment-heading"><FlaskConical size={20} /><Eyebrow>A SMALL CAREER EXPERIMENT</Eyebrow></div><h2>Try a piece of the work.</h2><p>{career.experiment}</p><div className="experiment-footer"><span>Low-risk · self-directed · no performance score</span><ButtonLink to={`/roadmaps/${career.id}`} tone="secondary">Add to a sample roadmap</ButtonLink></div></section></div>
        <aside className="career-detail-aside"><div className="aside-card"><Eyebrow>DEVELOPMENT NEEDS</Eyebrow><ul className="gap-list">{career.developmentGaps.map((gap) => <li key={gap}><span>+</span>{gap}</li>)}</ul><p>Gaps are possibilities to build—not automatic reasons to rule out a direction.</p></div><div className="verification-card"><CircleAlert size={18} /><div><strong>Market and requirements</strong><p>Status: <b>Not verified</b></p><p>{career.evidenceNote}</p></div></div><div className="aside-links"><Link className="text-link" to="/privacy">Privacy information <ArrowRight size={14} /></Link></div></aside></div>
      <InlineNotice tone="caution"><strong>Global availability is not global coverage.</strong> Role titles, entry routes, licenses, work arrangements, and market opportunities vary by country and employer. This prototype has no verified country-specific sources.</InlineNotice>
    </div>
  );
}
