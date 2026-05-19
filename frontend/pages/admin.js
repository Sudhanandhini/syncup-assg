import { useState, useEffect } from 'react';
import Head from 'next/head';
import FeedCard from '../components/FeedCard';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const CATEGORIES = ['general', 'tip', 'update', 'motivation', 'announcement'];

const EMPTY_FORM = { title: '', content: '', author: 'Admin', category: 'general' };

export default function AdminPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Load existing feeds
  useEffect(() => {
    const fetchFeeds = async () => {
      try {
        const res = await fetch(`${API}/api/feed`);
        const json = await res.json();
        setFeeds(json.data || []);
      } catch {
        setError('Could not load feeds from backend.');
      } finally {
        setLoading(false);
      }
    };
    fetchFeeds();
  }, []);

  // Sync realtime additions/deletions from other tabs
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.__syncup = window.__syncup || {};
    window.__syncup.onNewFeed = (feed) => {
      setFeeds((prev) => (prev.some((f) => f._id === feed._id) ? prev : [feed, ...prev]));
    };
    window.__syncup.onDeleteFeed = (id) => {
      setFeeds((prev) => prev.filter((f) => f._id !== id));
    };
    window.__syncup.onUpdateFeed = (feed) => {
      setFeeds((prev) => prev.map((f) => (f._id === feed._id ? feed : f)));
    };
    return () => {
      if (window.__syncup) {
        delete window.__syncup.onNewFeed;
        delete window.__syncup.onDeleteFeed;
        delete window.__syncup.onUpdateFeed;
      }
    };
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError(null);
  };

  const handleEdit = (feed) => {
    setEditingId(feed._id);
    setForm({ title: feed.title, content: feed.content, author: feed.author, category: feed.category });
    setFormError(null);
    setSuccessMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setFormError('Title and content are required.');
      return;
    }
    try {
      setSubmitting(true);
      setFormError(null);

      const url = editingId ? `${API}/api/feed/${editingId}` : `${API}/api/feed`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || (editingId ? 'Failed to update post' : 'Failed to create post'));

      setSuccessMsg(editingId ? `"${json.data.title}" updated!` : `"${json.data.title}" published!`);
      setTimeout(() => setSuccessMsg(null), 3500);
      setForm(EMPTY_FORM);
      setEditingId(null);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this post?')) return;
    try {
      setDeletingId(id);
      await fetch(`${API}/api/feed/${id}`, { method: 'DELETE' });
    } catch {
      alert('Delete failed. Try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <Head>
        <title>Admin — SyncUp</title>
      </Head>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-up">
          <h1 className="font-display font-extrabold text-3xl text-white mb-1">Admin Panel</h1>
          <p className="text-gray-500 text-sm">Create and manage coaching feed posts.</p>
        </div>

        <div className="grid md:grid-cols-5 gap-6">
          {/* ── CREATE FORM ── */}
          <div className="md:col-span-2">
            <div className="bg-surface-card border border-surface-border rounded-xl p-5 sticky top-20 animate-fade-up">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-base text-white">
                  {editingId ? 'Edit Post' : 'New Post'}
                </h2>
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5 font-medium">Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="e.g. Weekly motivation tip"
                    maxLength={200}
                    className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-brand-500 focus:ring-0 transition-colors"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5 font-medium">Content *</label>
                  <textarea
                    name="content"
                    value={form.content}
                    onChange={handleChange}
                    placeholder="Write your post content here…"
                    rows={5}
                    maxLength={2000}
                    className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-brand-500 focus:ring-0 transition-colors resize-none"
                  />
                  <div className="text-right text-xs text-gray-600 mt-1">
                    {form.content.length}/2000
                  </div>
                </div>

                {/* Author */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5 font-medium">Author</label>
                  <input
                    type="text"
                    name="author"
                    value={form.author}
                    onChange={handleChange}
                    placeholder="Admin"
                    className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-brand-500 focus:ring-0 transition-colors"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5 font-medium">Category</label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-sm text-white focus:border-brand-500 focus:ring-0 transition-colors"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Errors / Success */}
                {formError && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    {formError}
                  </p>
                )}
                {successMsg && (
                  <p className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                    ✅ {successMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-brand-500 hover:bg-brand-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm py-2.5 rounded-lg transition-colors"
                >
                  {submitting ? (editingId ? 'Saving…' : 'Publishing…') : (editingId ? 'Save Changes' : 'Publish Post')}
                </button>
              </form>
            </div>
          </div>

          {/* ── FEED LIST ── */}
          <div className="md:col-span-3">
            <h2 className="font-display font-semibold text-base text-white mb-4">
              All Posts
              {!loading && (
                <span className="ml-2 text-xs text-gray-600 font-normal">
                  ({feeds.length})
                </span>
              )}
            </h2>

            {loading && (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-surface-card border border-surface-border rounded-xl p-5 animate-pulse">
                    <div className="h-4 bg-surface-hover rounded w-2/3 mb-3" />
                    <div className="h-3 bg-surface-hover rounded w-full" />
                  </div>
                ))}
              </div>
            )}

            {!loading && error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                {error}
              </div>
            )}

            {!loading && !error && feeds.length === 0 && (
              <div className="text-center py-12 text-gray-600">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-sm">No posts yet — create one!</p>
              </div>
            )}

            {!loading && !error && (
              <div className="space-y-3">
                {feeds.map((feed) => (
                  <div key={feed._id} className="relative group">
                    <FeedCard feed={feed} />
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 flex gap-1.5 transition-all">
                      <button
                        onClick={() => handleEdit(feed)}
                        disabled={!!deletingId}
                        className="bg-brand-500/15 hover:bg-brand-500/30 text-brand-400 text-xs px-2 py-1 rounded-md border border-brand-500/20 transition-all disabled:opacity-30"
                        title="Edit post"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(feed._id)}
                        disabled={deletingId === feed._id}
                        className="bg-red-500/15 hover:bg-red-500/30 text-red-400 text-xs px-2 py-1 rounded-md border border-red-500/20 transition-all disabled:opacity-30"
                        title="Delete post"
                      >
                        {deletingId === feed._id ? '…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
