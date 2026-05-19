import { useEffect, useState, useCallback, useRef } from 'react';
import Head from 'next/head';
import FeedCard from '../components/FeedCard';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function HomePage() {
  const [feeds, setFeeds] = useState([]);
  const [newIds, setNewIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const toastTimer = useRef(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 3500);
  };

  // Fetch all feeds on mount
  useEffect(() => {
    const fetchFeeds = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/api/feed`);
        if (!res.ok) throw new Error('Failed to fetch feeds');
        const json = await res.json();
        setFeeds(json.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchFeeds();
  }, []);

  // Register realtime handlers via global event bus (set in _app.js)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.__syncup = window.__syncup || {};

    window.__syncup.onNewFeed = (feed) => {
      setFeeds((prev) => {
        // Prevent duplicate if SSR data already has it
        if (prev.some((f) => f._id === feed._id)) return prev;
        return [feed, ...prev];
      });
      setNewIds((prev) => new Set([...prev, feed._id]));
      // Remove "new" highlight after 5s
      setTimeout(() => {
        setNewIds((prev) => {
          const next = new Set(prev);
          next.delete(feed._id);
          return next;
        });
      }, 5000);
      showToast(`New post: "${feed.title}"`);
    };

    window.__syncup.onDeleteFeed = (id) => {
      setFeeds((prev) => prev.filter((f) => f._id !== id));
      showToast('A post was removed.');
    };

    return () => {
      if (window.__syncup) {
        delete window.__syncup.onNewFeed;
        delete window.__syncup.onDeleteFeed;
      }
    };
  }, []);

  return (
    <>
      <Head>
        <title>SyncUp — Coaching Feed</title>
        <meta name="description" content="Realtime coaching feed powered by SyncUp" />
      </Head>

      {/* Toast notification */}
      {toastMsg && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 animate-slide-in">
          <div className="bg-brand-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg border border-brand-500/40">
            ⚡ {toastMsg}
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="mb-8 animate-fade-up">
          <h1 className="font-display font-extrabold text-3xl text-white mb-1">
            Coaching Feed
          </h1>
          <p className="text-gray-500 text-sm">
            Updates, tips, and announcements — delivered in realtime.
          </p>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-surface-card border border-surface-border rounded-xl p-5 animate-pulse"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="h-4 bg-surface-hover rounded w-2/3 mb-3" />
                <div className="h-3 bg-surface-hover rounded w-1/4 mb-4" />
                <div className="space-y-2">
                  <div className="h-3 bg-surface-hover rounded w-full" />
                  <div className="h-3 bg-surface-hover rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-5 text-sm">
            <strong>Could not load feeds.</strong> Make sure the backend is running on port 5000.
            <br />
            <span className="text-red-500/70">{error}</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && feeds.length === 0 && (
          <div className="text-center py-20 text-gray-600">
            <div className="text-5xl mb-4">📭</div>
            <p className="font-display font-semibold text-lg text-gray-500">No posts yet</p>
            <p className="text-sm mt-1">
              Head to{' '}
              <a href="/admin" className="text-brand-400 underline">
                Admin
              </a>{' '}
              to create the first one.
            </p>
          </div>
        )}

        {/* Feed list */}
        {!loading && !error && feeds.length > 0 && (
          <div className="space-y-4">
            {feeds.map((feed, i) => (
              <div
                key={feed._id}
                style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
                className="animate-fade-up"
              >
                <FeedCard feed={feed} isNew={newIds.has(feed._id)} />
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
