import { Link } from 'react-router-dom';
export default function SectionTitle({ eyebrow, title, link }: { eyebrow: string; title: string; link?: string }) { return <div className="section-title"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>{link && <Link to={link} className="text-link">See everything <span>→</span></Link>}</div>; }
