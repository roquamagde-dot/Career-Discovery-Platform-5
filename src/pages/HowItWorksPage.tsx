import { ArrowRight, Compass, FileCheck2, Footprints, Layers3, Scale, Sparkles } from 'lucide-react';
import { ButtonLink, Eyebrow, InlineNotice, PageIntro } from '../components/Ui';

const dimensions = [
  { n: '01', title: 'Interests', copy: 'What kinds of activities draw your attention—not what you are already good at.', icon: Compass },
  { n: '02', title: 'Self-perceived skills', copy: 'How confident you currently feel, kept separate from demonstrated performance.', icon: Sparkles },
  { n: '03', title: 'Demonstrated experience', copy: 'Specific situations, actions you took, and outcomes or learning you can describe.', icon: FileCheck2 },
  { n: '04', title: 'Work style', copy: 'The structure, collaboration, and working conditions that tend to help you.', icon: Layers3 },
  { n: '05', title: 'Work values', copy: 'What matters to you right now—and the trade-offs you may want to explore.', icon: Scale },
];

export function HowItWorksPage() {
  return (
    <div className="content-wrap page-wrap">
      <PageIntro eyebrow="THE METHOD" title="A guided reflection, not a verdict." description="The experience brings several kinds of clues together, then gives you a few possibilities to explore with your own judgment." />
      <section className="method-overview"><div className="method-quote"><span className="quote-mark">“</span><p>Interest is not ability. Confidence is not proof. A recommendation is a question worth exploring.</p><span className="quote-rule" /></div><div className="method-copy"><Eyebrow>WHAT WE LOOK AT</Eyebrow><p>Each dimension answers a different question. Keeping them separate helps avoid turning a single preference or self-rating into a fixed career label.</p><p>Draft examples are reviewed by you before they contribute to your report. You can edit them, dispute them, or decide that the evidence is not enough yet.</p></div></section>
      <section className="dimension-list"><div className="dimension-head"><Eyebrow>FIVE DISTINCT SIGNALS</Eyebrow><p>Not a personality type. Not a score.</p></div>{dimensions.map(({ n, title, copy, icon: Icon }) => <article className="dimension-row" key={title}><span className="dimension-number">{n}</span><span className="dimension-icon"><Icon size={19} /></span><div><h3>{title}</h3><p>{copy}</p></div><ArrowRight className="dimension-arrow" size={18} /></article>)}</section>
      <section className="journey-band"><div><Eyebrow>FROM REFLECTION TO ACTION</Eyebrow><h2>Small experiments make<br />better questions.</h2><p>A short project, a conversation, or a learning exercise can show you more than a label ever could.</p></div><div className="journey-icon"><Footprints size={30} /><span>Try · Notice · Adjust</span></div></section>
      <InlineNotice tone="caution"><strong>Important limitation.</strong> The item bank, scoring rules, and occupational examples in this prototype have not been reviewed or validated by qualified specialists. No market opportunity, salary, licensing, or entry requirement is verified for a country.</InlineNotice>
      <div className="page-bottom-action"><ButtonLink to="/onboarding">Start your reflection</ButtonLink><span>About 15–25 minutes in the planned full experience; this prototype may be shorter.</span></div>
    </div>
  );
}
