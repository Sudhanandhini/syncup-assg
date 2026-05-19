import { formatDistanceToNow } from 'date-fns';

const CATEGORY_ICONS = {
  tip: '💡',
  update: '🔄',
  motivation: '🔥',
  announcement: '📢',
  general: '📌',
};

export default function FeedCard({ feed, isNew = false }) {
  const timeAgo = formatDistanceToNow(new Date(feed.createdAt), { addSuffix: true });
  const icon = CATEGORY_ICONS[feed.category] || '📌';

  return (
    <article
      className={`
        group relative bg-surface-card border border-surface-border rounded-xl p-5
        hover:border-brand-700 hover:bg-surface-hover transition-all duration-200
        ${isNew ? 'animate-slide-in ring-1 ring-brand-500/30' : ''}
      `}
    >
      {/* New badge */}
      {isNew && (
        <span className="absolute top-3 right-3 text-xs font-semibold bg-brand-500/20 text-brand-400 px-2 py-0.5 rounded-full border border-brand-500/30">
          NEW
        </span>
      )}

      {/* Header row */}
      <div className="flex items-start gap-3 mb-3">
        <span className="text-xl mt-0.5 flex-shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <h3
            className="font-display font-semibold text-base text-white leading-snug truncate"
            title={feed.title}
          >
            {feed.title}
          </h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span
              className={`inline-flex items-center text-xs px-2 py-0.5 rounded border font-medium badge-${feed.category}`}
            >
              {feed.category}
            </span>
            <span className="text-xs text-gray-500">by {feed.author}</span>
            <span className="text-xs text-gray-600">·</span>
            <span className="text-xs text-gray-500">{timeAgo}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <p className="text-sm text-gray-400 leading-relaxed line-clamp-4 pl-9">{feed.content}</p>
    </article>
  );
}
