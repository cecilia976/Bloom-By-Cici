export default function Loading({ label = 'Gathering the blooms…' }: { label?: string }) { return <div className="loading"><span className="loading-flower">✿</span><p>{label}</p></div>; }
