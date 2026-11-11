import { useEffect, useState } from 'react';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { ButtonLink, Eyebrow, InlineNotice, PageIntro } from '../components/Ui';
import { usePrototype } from '../lib/PrototypeContext';

export function LoginPage() {
  const { authStatus, authError, signIn } = usePrototype();
  const [params] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const providerError = params.get('auth') === 'failed' || params.get('error') === 'login_failed';

  useEffect(() => {
    if (authStatus === 'authenticated') window.location.replace('/dashboard');
  }, [authStatus]);

  const beginSignIn = async () => {
    setBusy(true);
    setError('');
    try {
      const authorizationUrl = await signIn();
      window.location.assign(authorizationUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Sign-in could not start. Please try again.');
      setBusy(false);
    }
  };

  if (authStatus === 'authenticated') return <Navigate to="/dashboard" replace />;

  return (
    <div className="content-wrap page-wrap narrow-wrap">
      <PageIntro eyebrow="YOUR ACCOUNT" title="A personal space for your next steps." description="Sign in with your Manus account. On your first sign-in, Career Discovery creates an account workspace for your reflections and progress." />
      <section className="settings-card">
        <div className="settings-icon"><LockKeyhole size={20} /></div>
        <div><Eyebrow>MANUS ACCOUNT</Eyebrow><h2>Continue securely</h2><p>We use Manus OAuth for sign-in. The app receives an account identity and does not store your OAuth access token.</p></div>
        <button className="button button-primary" type="button" onClick={() => void beginSignIn()} disabled={busy || authStatus === 'loading'}>{busy ? 'Connecting…' : 'Continue with Manus'} <ArrowRight size={16} /></button>
      </section>
      {providerError && <p className="form-error" role="alert">Sign-in did not complete. Please try again; no account data was changed.</p>}
      {authStatus === 'error' && <p className="form-error" role="alert">{authError || 'The account service could not be reached.'}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <InlineNotice tone="neutral"><strong>Your old browser-only draft will not be uploaded automatically.</strong> If one exists, it remains in this browser and can be cleared separately in Settings after you sign in.</InlineNotice>
      <InlineNotice tone="caution">This project is still a private, exploratory prototype, not a production career assessment. Do not enter highly sensitive information.</InlineNotice>
      <div className="page-bottom-action"><ButtonLink to="/privacy" tone="secondary">Read the privacy details</ButtonLink><Link className="text-link" to="/how-it-works">How the prototype works</Link></div>
    </div>
  );
}
