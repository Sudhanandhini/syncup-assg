const mongoose = require('mongoose');

const feedSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
      maxlength: [2000, 'Content cannot exceed 2000 characters'],
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
      default: 'Admin',
    },
    category: {
      type: String,
      enum: ['tip', 'update', 'motivation', 'announcement', 'general'],
      default: 'general',
    },
    likes: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
feedSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Feed', feedSchema);
