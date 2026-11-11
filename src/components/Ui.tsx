import type { ReactNode } from 'react';
import { ArrowRight, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

export function PageIntro({ eyebrow, title, description, aside }: { eyebrow: string; title: string; description?: string; aside?: ReactNode }) {
  return (
    <div className="page-intro">
      <div><Eyebrow>{eyebrow}</Eyebrow><h1>{title}</h1>{description && <p className="page-lede">{description}</p>}</div>
      {aside && <div className="page-intro-aside">{aside}</div>}
    </div>
  );
}

export function ButtonLink({ to, children, tone = 'primary', className = '' }: { to: string; children: ReactNode; tone?: 'primary' | 'secondary' | 'text'; className?: string }) {
  return <Link className={`button button-${tone} ${className}`} to={to}>{children}<ArrowRight size={16} aria-hidden="true" /></Link>;
}

export function InlineNotice({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'caution' }) {
  return <aside className={`notice notice-${tone}`}><Info size={18} aria-hidden="true" /><div>{children}</div></aside>;
}

export function StatusPill({ children, tone = 'subtle' }: { children: ReactNode; tone?: 'subtle' | 'caution' | 'positive' }) {
  return <span className={`status-pill status-${tone}`}>{children}</span>;
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return <div className="progress-track-wrap"><div className="progress-meta"><span>{label}</span><span>{safeValue}%</span></div><div className="progress-track" role="progressbar" aria-valuenow={safeValue} aria-valuemin={0} aria-valuemax={100} aria-label={label}><span style={{ width: `${safeValue}%` }} /></div></div>;
}

export function SectionHeading({ eyebrow, title, copy, action }: { eyebrow?: string; title: string; copy?: string; action?: ReactNode }) {
  return <div className="section-heading"><div>{eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}<h2>{title}</h2>{copy && <p>{copy}</p>}</div>{action}</div>;
}
