const mongoose = require('mongoose');

const conspiracyNodeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [120, 'Title must not exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// title: fast searching/filtering by title
conspiracyNodeSchema.index({ title: 1 });

// tags: fast filtering by tag values
conspiracyNodeSchema.index({ tags: 1 });

// createdBy + createdAt: fast dashboard queries (all nodes by user, sorted by date)
conspiracyNodeSchema.index({ createdBy: 1, createdAt: -1 });

// text index for full-text search on title + description (future-proof)
conspiracyNodeSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('ConspiracyNode', conspiracyNodeSchema);
