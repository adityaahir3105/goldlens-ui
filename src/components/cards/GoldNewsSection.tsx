import { Newspaper, ExternalLink } from 'lucide-react';
import { getGoldNews, GoldNewsItem } from '@/lib/api';

function getRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  } catch {
    return dateString;
  }
}

function getSentimentBadge(sentiment: string) {
  switch (sentiment) {
    case 'BULLISH':
      return { label: 'Bullish for Gold', color: 'text-emerald-400', bg: 'bg-emerald-400/10', emoji: '🟢' };
    case 'BEARISH':
      return { label: 'Bearish for Gold', color: 'text-rose-400', bg: 'bg-rose-400/10', emoji: '🔴' };
    default:
      return { label: 'Neutral', color: 'text-amber-400', bg: 'bg-amber-400/10', emoji: '🟡' };
  }
}

function NewsCard({ item, index }: { item: GoldNewsItem; index: number }) {
  const sentiment = getSentimentBadge(item.sentiment);

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block h-full group"
    >
      <div className="h-full rounded-xl border border-white/5 bg-zinc-900/50 p-5 md:p-6 backdrop-blur-sm flex flex-col transition-colors hover:border-white/10 hover:bg-zinc-900/70">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800">
            <Newspaper className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-zinc-200 line-clamp-2 leading-snug group-hover:text-white transition-colors">
              {item.title}
            </h3>
          </div>
          <ExternalLink className="h-4 w-4 text-zinc-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span>{item.source}</span>
            <span>•</span>
            <span>{getRelativeTime(item.publishedAt)}</span>
          </div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${sentiment.bg} ${sentiment.color}`}>
            {sentiment.emoji} {sentiment.label}
          </span>
        </div>
      </div>
    </a>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-white/5 bg-zinc-900/50 p-6 text-center">
      <Newspaper className="mx-auto mb-2 h-6 w-6 text-zinc-600" />
      <p className="text-sm text-zinc-500">
        No high-impact gold-related news in the last 48 hours.
      </p>
    </div>
  );
}

export async function GoldNewsSection() {
  const newsData = await getGoldNews();
  const newsItems = newsData?.items || [];

  return (
    <section className="mt-16 mb-20">
      <p className="text-xs font-medium uppercase tracking-widest text-zinc-500 mb-6">
        Gold Market News
      </p>

      {newsItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {newsItems.map((item, index) => (
            <NewsCard key={index} item={item} index={index} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </section>
  );
}
