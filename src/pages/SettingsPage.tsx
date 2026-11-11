import { useState } from 'react';
import { AlertTriangle, Check, Database, Globe2, HardDrive, Trash2, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ButtonLink, Eyebrow, InlineNotice, PageIntro } from '../components/Ui';
import { usePrototype } from '../lib/PrototypeContext';
import { clearLocalState, hasLegacyLocalState } from '../lib/storage';

export function SettingsPage() {
  const { state, user, saveStatus, saveError, deleteAccount } = usePrototype();
  const navigate = useNavigate();
  const [legacyExists, setLegacyExists] = useState(hasLegacyLocalState());
  const [legacyCleared, setLegacyCleared] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const removeLegacyDraft = () => {
    const confirmed = window.confirm('Clear the old browser-only prototype draft from this browser? It will not affect your signed-in account workspace.');
    if (!confirmed) return;
    clearLocalState();
    setLegacyExists(false);
    setLegacyCleared(true);
  };

  const removeAccount = async () => {
    const confirmed = window.confirm('Permanently delete your Career Discovery account record, saved workspace, answers, evidence notes, report history, roadmap progress, and application sessions? This cannot be undone. It will not delete your Manus account or the separate old browser draft.');
    if (!confirmed) return;
    setBusy(true);
    setMessage('');
    setError('');
    try {
      await deleteAccount();
      setMessage('Your Career Discovery account data has been deleted.');
      navigate('/');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Account data could not be deleted. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="content-wrap page-wrap narrow-wrap">
      <PageIntro eyebrow="SETTINGS & PRIVACY" title="Keep this space yours." description="Your account workspace is stored in the project's managed MySQL database and is separated from other accounts by the authenticated server session." />
      <section className="settings-card"><div className="settings-icon"><UserRound size={20} /></div><div><Eyebrow>SIGNED-IN ACCOUNT</Eyebrow><h2>{user?.displayName || 'Manus account'}</h2><p>{user?.email || 'The app receives an account identity from Manus OAuth. It does not store OAuth access tokens.'}</p></div><span className="setting-value">Connected</span></section>
      <section className="settings-card"><div className="settings-icon"><Globe2 size={20} /></div><div><Eyebrow>LANGUAGE</Eyebrow><h2>English</h2><p>This MVP interface is in English. The project structure is ready for future localization; no other language is available yet.</p></div><span className="setting-value">Current</span></section>
      <section className="settings-card"><div className="settings-icon"><Check size={20} /></div><div><Eyebrow>YOUR CONSENT</Eyebrow><h2>{state.privacyAccepted ? 'Exploration acknowledged' : 'Not started'}</h2><p>Continuing means you understand the reflection is exploratory, not validated, and does not determine your ability or future success.</p></div><span className="setting-value">{state.privacyAccepted ? 'On' : 'Off'}</span></section>
      <section className="settings-card"><div className="settings-icon"><Database size={20} /></div><div><Eyebrow>SAVE STATUS</Eyebrow><h2>{saveStatus === 'saving' ? 'Saving your workspace…' : saveStatus === 'error' ? 'A change needs attention' : saveStatus === 'saved' ? 'Workspace saved' : 'No new changes'}</h2><p>{saveStatus === 'error' ? saveError : 'Profile, answers, reviewed evidence, report history, and roadmap progress are saved under this signed-in account.'}</p></div><span className="setting-value">{saveStatus === 'error' ? 'Review' : saveStatus === 'saving' ? 'Saving' : 'Account'}</span></section>
      {legacyExists && <section className="settings-card settings-danger"><div className="settings-icon"><HardDrive size={20} /></div><div><Eyebrow>OLDER BROWSER DRAFT</Eyebrow><h2>A local-only draft was found</h2><p>This is from the earlier prototype and is separate from your account. It was not uploaded when you signed in. Clear only that old draft from this browser if you no longer need it.</p></div><button className="button button-small button-danger" type="button" onClick={removeLegacyDraft}>Clear old draft</button></section>}
      {legacyCleared && <p className="saved-message" role="status">The separate browser-only draft was cleared.</p>}
      <section className="settings-card settings-danger"><div className="settings-icon"><Trash2 size={20} /></div><div><Eyebrow>ACCOUNT DATA</Eyebrow><h2>Delete my account data</h2><p>Removes this account's application record, sessions, workspace, answers, evidence notes, reports, and roadmap progress. It does not delete your Manus account or another user's data.</p></div><button className="button button-small button-danger" type="button" onClick={() => void removeAccount()} disabled={busy}>{busy ? 'Deleting…' : 'Delete account data'}</button></section>
      {message && <p className="saved-message" role="status">{message}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <InlineNotice tone="caution"><AlertTriangle size={17} /><span><strong>Prototype boundary.</strong> Development Preview and any future publication share the same MySQL database. No export or backup workflow is provided. Do not enter highly sensitive information; privacy, retention, and security review are still needed before a public launch.</span></InlineNotice>
      <div className="page-bottom-action"><ButtonLink to="/dashboard" tone="secondary">Return to My space</ButtonLink></div>
    </div>
  );
}
