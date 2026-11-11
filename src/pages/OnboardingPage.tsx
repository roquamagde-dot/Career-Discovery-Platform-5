import { useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, CircleHelp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { InlineNotice, PageIntro } from '../components/Ui';
import { usePrototype } from '../lib/PrototypeContext';

export function OnboardingPage() {
  const { state, updateState } = usePrototype();
  const navigate = useNavigate();
  const [consent, setConsent] = useState(state.privacyAccepted);
  const [profile, setProfile] = useState(state.profile);
  const [error, setError] = useState('');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!consent) {
      setError('Please confirm you understand this is an exploratory prototype.');
      return;
    }
    updateState({ profile, privacyAccepted: true, sessionStatus: state.sessionStatus === 'not-started' ? 'in-progress' : state.sessionStatus });
    navigate(state.sessionStatus === 'completed' ? '/dashboard' : '/assessment');
  };

  const change = (field: keyof typeof profile, value: string) => setProfile((current) => ({ ...current, [field]: value }));

  return (
    <div className="content-wrap page-wrap narrow-wrap">
      <Link className="back-link" to="/dashboard"><ArrowLeft size={15} /> Back to My space</Link>
      <PageIntro eyebrow="A LITTLE CONTEXT" title="Start with where you are." description="Share only what feels useful. These fields are optional; your examples and preferences matter more than a perfect profile." />
      <form className="onboarding-form" onSubmit={submit}>
        <div className="form-grid">
          <label className="field"><span>What should we call you? <small>Optional</small></span><input value={profile.name} onChange={(event) => change('name', event.target.value)} autoComplete="given-name" placeholder="Your first name" /></label>
          <label className="field"><span>Where are you in your journey? <small>Optional</small></span><select value={profile.currentStage} onChange={(event) => change('currentStage', event.target.value)}><option value="">Choose a stage</option><option>Exploring what to study</option><option>Currently studying</option><option>Early in my career</option><option>Considering a change</option><option>Something else</option></select></label>
          <label className="field"><span>What are you studying or curious about? <small>Optional</small></span><input value={profile.studyArea} onChange={(event) => change('studyArea', event.target.value)} placeholder="A subject, field, or question" /></label>
          <label className="field"><span>Any activities you’d like to include? <small>Optional</small></span><input value={profile.activities} onChange={(event) => change('activities', event.target.value)} placeholder="Clubs, projects, volunteering…" /></label>
          <label className="field field-span"><span>Where might you want to work? <small>Optional · for future exploration only</small></span><input value={profile.targetLocation} onChange={(event) => change('targetLocation', event.target.value)} placeholder="Country or region" /><small className="field-note"><CircleHelp size={13} /> This prototype does not verify local job-market or licensing information.</small></label>
        </div>
        <div className="consent-box"><label className="checkbox-label"><input type="checkbox" checked={consent} onChange={(event) => { setConsent(event.target.checked); setError(''); }} /><span><strong>I understand what this experience is.</strong><small>The draft questions are for career exploration, not diagnosis or a validated test. After sign-in, the information you choose to enter is saved to your account workspace in this project's managed database. A previous browser-only draft is not transferred automatically; you can pause or delete your account data in Settings.</small></span></label></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <InlineNotice tone="neutral">You can pause or skip questions. There are no “right” answers, and a self-rating is not treated as proof of a skill.</InlineNotice>
        <div className="form-actions"><button className="button button-primary" type="submit" disabled={!consent}>Continue to reflection <ArrowRight size={16} /></button><span>About 10 draft anchor questions</span></div>
      </form>
    </div>
  );
}
