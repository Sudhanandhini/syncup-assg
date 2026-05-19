const express = require('express');
const router = express.Router();
const Feed = require('../models/Feed');
const cache = require('../config/cache');

const CACHE_KEY = 'feeds:all';
const CACHE_TTL = 30; // seconds

/**
 * GET /api/feed
 * Returns all feed items (newest first).
 * Cache: 30s in-memory (swap to Redis in prod).
 */
router.get('/', async (req, res) => {
  try {
    // 1. Check cache
    const cached = cache.get(CACHE_KEY);
    if (cached) {
      return res.json({
        success: true,
        source: 'cache',
        count: cached.length,
        data: cached,
      });
    }

    // 2. Fetch from DB
    const feeds = await Feed.find().sort({ createdAt: -1 }).lean();

    // 3. Store in cache
    cache.set(CACHE_KEY, feeds, CACHE_TTL);

    return res.json({
      success: true,
      source: 'db',
      count: feeds.length,
      data: feeds,
    });
  } catch (error) {
    console.error('GET /feed error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching feeds' });
  }
});

/**
 * POST /api/feed
 * Create a new feed item and broadcast to all connected clients via Socket.IO.
 */
router.post('/', async (req, res) => {
  try {
    const { title, content, author, category } = req.body;

    // Basic validation
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    const feed = await Feed.create({ title, content, author, category });

    // Invalidate cache so next GET hits DB
    cache.del(CACHE_KEY);

    // Emit realtime event to all connected Socket.IO clients
    const io = req.app.get('io');
    if (io) {
      io.emit('new_feed', feed);
    }

    return res.status(201).json({ success: true, data: feed });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    console.error('POST /feed error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating feed' });
  }
});

/**
 * PUT /api/feed/:id
 * Update a feed item and broadcast to all connected clients.
 */
router.put('/:id', async (req, res) => {
  try {
    const { title, content, author, category } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    const feed = await Feed.findByIdAndUpdate(
      req.params.id,
      { title, content, author, category },
      { new: true, runValidators: true }
    );

    if (!feed) {
      return res.status(404).json({ success: false, message: 'Feed not found' });
    }

    cache.del(CACHE_KEY);

    const io = req.app.get('io');
    if (io) {
      io.emit('update_feed', feed);
    }

    return res.json({ success: true, data: feed });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    console.error('PUT /feed error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating feed' });
  }
});

/**
 * DELETE /api/feed/:id
 * Remove a feed item and notify clients.
 */
router.delete('/:id', async (req, res) => {
  try {
    const feed = await Feed.findByIdAndDelete(req.params.id);
    if (!feed) {
      return res.status(404).json({ success: false, message: 'Feed not found' });
    }

    cache.del(CACHE_KEY);

    const io = req.app.get('io');
    if (io) {
      io.emit('delete_feed', { _id: req.params.id });
    }

    return res.json({ success: true, message: 'Feed deleted' });
  } catch (error) {
    console.error('DELETE /feed error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting feed' });
  }
});

module.exports = router;
