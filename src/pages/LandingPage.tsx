import { ArrowDownRight, ArrowRight, BookOpenCheck, Compass, Layers3, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ButtonLink, Eyebrow, InlineNotice, StatusPill } from '../components/Ui';
import { usePrototype } from '../lib/PrototypeContext';

export function LandingPage() {
  const { authStatus } = usePrototype();
  const startPath = authStatus === 'authenticated' ? '/onboarding' : '/login';
  return (
    <>
      <section className="hero-section content-wrap">
        <div className="hero-copy">
          <Eyebrow>CAREER DISCOVERY, WITHOUT THE LABELS</Eyebrow>
          <h1>Find a direction<br /><em>worth exploring.</em></h1>
          <p className="hero-lede">A thoughtful space to notice what draws you in, recognize the skills you’re building, and choose a small next step.</p>
          <div className="hero-actions"><ButtonLink to={startPath}>{authStatus === 'authenticated' ? 'Continue your discovery' : 'Sign in to begin'}</ButtonLink><Link className="quiet-link" to="/how-it-works">See how it works <ArrowRight size={15} /></Link></div>
          <p className="hero-footnote"><ShieldCheck size={16} /> Your reflections are stored in your signed-in account workspace.</p>
        </div>
        <div className="hero-visual" aria-label="A branching path illustration showing several possible directions" role="img">
          <div className="visual-note visual-note-top"><span className="tiny-dot" /> A path, not a prediction</div>
          <svg className="path-art" viewBox="0 0 520 380" fill="none" aria-hidden="true">
            <path d="M55 310C145 310 148 247 208 247H268C325 247 317 132 386 132H468" stroke="#B9C9BD" strokeWidth="3" strokeDasharray="2 10" strokeLinecap="round" />
            <path d="M55 310C145 310 148 247 208 247H268C325 247 317 132 386 132H468" stroke="#147D73" strokeWidth="2" strokeLinecap="round" />
            <path d="M268 247C330 247 325 322 390 322H467" stroke="#D7A75C" strokeWidth="2" strokeLinecap="round" />
            <path d="M208 247C257 247 255 172 300 172" stroke="#C8D5CC" strokeWidth="2" strokeDasharray="2 8" strokeLinecap="round" />
            <circle cx="55" cy="310" r="8" fill="#147D73" /><circle cx="268" cy="247" r="10" fill="#F7F6F2" stroke="#147D73" strokeWidth="3" />
            <circle cx="468" cy="132" r="8" fill="#147D73" /><circle cx="467" cy="322" r="8" fill="#D7A75C" /><circle cx="300" cy="172" r="6" fill="#D0D9D1" />
            <path d="M98 303c13-22 19-43 18-61m201 95c13 5 24 7 36 7" stroke="#B9C9BD" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div className="visual-label label-start">Your experience</div><div className="visual-label label-one">A possibility</div><div className="visual-label label-two">A next step</div>
          <div className="visual-card"><span className="visual-card-icon"><Compass size={19} /></span><div><strong>Start with what you know</strong><small>Interest · examples · values</small></div><ArrowDownRight size={17} /></div>
          <div className="visual-note visual-note-bottom"><Sparkles size={14} /> Curious beats certain.</div>
        </div>
      </section>
      <section className="trust-strip"><div className="content-wrap trust-inner"><span><Layers3 size={17} /> Five kinds of signals</span><span><BookOpenCheck size={17} /> Evidence you can review</span><span><ShieldCheck size={17} /> No career verdicts</span></div></section>
      <section className="content-wrap section-block intro-block">
        <div className="intro-lead"><Eyebrow>A LITTLE MORE CLARITY</Eyebrow><h2>Work out what fits<br />before you commit.</h2></div>
        <div className="intro-body"><p>Career choices rarely begin with a perfect answer. They begin with noticing a pattern: an activity you return to, a problem you enjoy untangling, or an experience that taught you something about how you work.</p><p>This guided reflection helps you connect those clues to a few directions you can explore in real life.</p><Link className="text-link" to="/how-it-works">Explore the method <ArrowRight size={15} /></Link></div>
      </section>
      <section className="content-wrap section-block steps-block">
        <div className="section-topline"><Eyebrow>HOW THE JOURNEY WORKS</Eyebrow><StatusPill tone="caution">Prototype · draft questions</StatusPill></div>
        <div className="step-row"><article className="step-card"><span className="step-number">01</span><h3>Notice your signals</h3><p>Reflect on interests, confidence, real examples, work style, and current values.</p></article><article className="step-card"><span className="step-number">02</span><h3>Make sense of evidence</h3><p>Review the notes and decide what sounds right, incomplete, or not like you.</p></article><article className="step-card"><span className="step-number">03</span><h3>Try a small experiment</h3><p>Explore a direction through a practical task before making a bigger commitment.</p></article></div>
      </section>
      <section className="content-wrap final-cta"><div><Eyebrow>START WHERE YOU ARE</Eyebrow><h2>You don’t need a five-year plan.<br /><em>Just one useful next step.</em></h2></div><ButtonLink to={startPath} tone="secondary">{authStatus === 'authenticated' ? 'Continue with your account' : 'Sign in to begin'}</ButtonLink></section>
      <div className="content-wrap"><InlineNotice tone="caution"><strong>A note on this prototype.</strong> The questions and career examples are exploratory drafts—not a validated assessment or verified labor-market guide. Treat suggestions as hypotheses, not predictions.</InlineNotice></div>
    </>
  );
}
