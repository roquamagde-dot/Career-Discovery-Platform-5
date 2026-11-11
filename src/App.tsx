import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { SiteShell } from './components/SiteShell';
import { InlineNotice, PageIntro } from './components/Ui';
import { AssessmentPage } from './pages/AssessmentPage';
import { CareerPage } from './pages/CareerPage';
import { DashboardPage } from './pages/DashboardPage';
import { EvidenceReviewPage } from './pages/EvidenceReviewPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { ReportPage } from './pages/ReportPage';
import { RoadmapPage } from './pages/RoadmapPage';
import { SettingsPage } from './pages/SettingsPage';
import { usePrototype } from './lib/PrototypeContext';

function AccountRequired() {
  const { authStatus, authError } = usePrototype();
  const location = useLocation();
  if (authStatus === 'loading') {
    return <div className="content-wrap page-wrap narrow-wrap"><PageIntro eyebrow="ACCOUNT" title="Checking your sign-in…" description="Your private workspace will load after your account session is verified." /></div>;
  }
  if (authStatus === 'error') {
    return <div className="content-wrap page-wrap narrow-wrap"><PageIntro eyebrow="ACCOUNT" title="We could not check your session." description={authError || 'The account service is temporarily unavailable.'} /><InlineNotice tone="caution"><strong>Your saved data has not been overwritten.</strong> Check the connection, then reload this page.</InlineNotice><button className="button button-secondary" type="button" onClick={() => window.location.reload()}>Try again</button></div>;
  }
  if (authStatus !== 'authenticated') return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

export function App() {
  return (
    <Routes>
      <Route element={<SiteShell />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AccountRequired />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/assessment" element={<AssessmentPage />} />
          <Route path="/evidence-review" element={<EvidenceReviewPage />} />
          <Route path="/report/:id" element={<ReportPage />} />
          <Route path="/careers/:id" element={<CareerPage />} />
          <Route path="/roadmaps/:id" element={<RoadmapPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/report" element={<Navigate to="/report/prototype" replace />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
