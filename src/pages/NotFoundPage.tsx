import { ArrowLeft, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return <div className="content-wrap page-wrap not-found"><span className="not-found-mark"><Compass size={26} /></span><p className="eyebrow">THIS PATH ENDS HERE</p><h1>We couldn’t find that page.</h1><p>Try a different path, or return to the start of your discovery journey.</p><Link className="button button-secondary" to="/"><ArrowLeft size={15} /> Back to home</Link></div>;
}
