import { Database, Eye, HardDrive, LockKeyhole, ShieldCheck } from 'lucide-react';
import { ButtonLink, Eyebrow, InlineNotice, PageIntro } from '../components/Ui';

export function PrivacyPage() {
  return (
    <div className="content-wrap page-wrap">
      <PageIntro eyebrow="PRIVACY, IN PLAIN LANGUAGE" title="Your account has its own workspace." description="Sign-in uses Manus OAuth. The application stores a small account record and your career-discovery workspace in the project's managed MySQL database." />
      <div className="privacy-feature"><div className="privacy-icon"><ShieldCheck size={24} /></div><div><Eyebrow>ACCOUNT DATA HANDLING</Eyebrow><h2>Separated by account in the application.</h2><p>Your account's profile, assessment answers, evidence notes, report history, and roadmap progress are stored in a workspace keyed to your signed-in Manus identity. The API scopes reads and writes to that authenticated account; it does not accept another user's ID from the browser.</p></div></div>
      <div className="privacy-grid"><article><HardDrive size={20} /><h3>Where it lives</h3><p>In managed MySQL for this project. Development Preview and any future published version use the same project database. The site has not been publicly published.</p></article><article><Eye size={20} /><h3>What is stored</h3><p>A provider account identifier, optional display name/email, an application session hash, and the workspace data needed for your reflections and progress. OAuth access and refresh tokens are not stored.</p></article><article><Database size={20} /><h3>What is not connected</h3><p>No external job-market API, AI provider, email service, or live labor-market feed is connected. Project-level site analytics are disabled, though the platform or CDN may still receive routine technical request data.</p></article><article><LockKeyhole size={20} /><h3>Your control</h3><p>Settings offers a confirmed deletion of your application account, sessions, and workspace. The prototype does not provide a data export or an application-level backup workflow.</p></article></div>
      <InlineNotice tone="neutral"><strong>Previous browser draft:</strong> any data from the earlier local-only prototype is not uploaded when you sign in. It remains in that browser until you clear it separately in Settings.</InlineNotice>
      <InlineNotice tone="caution"><strong>Prototype caveat:</strong> the managed database is project-scoped; project operators with database access may technically access stored records. This is not a production privacy notice or legal/security review. Do not enter highly sensitive information. A public launch needs a reviewed retention policy, privacy/legal and security review, data-source licenses, and launch monitoring.</InlineNotice>
      <div className="page-bottom-action"><ButtonLink to="/settings" tone="secondary">Open account settings</ButtonLink></div>
    </div>
  );
}
