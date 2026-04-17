const mongoose = require('mongoose');

const redThreadSchema = new mongoose.Schema(
  {
    fromNode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ConspiracyNode',
      required: [true, 'fromNode is required'],
    },
    toNode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ConspiracyNode',
      required: [true, 'toNode is required'],
    },
    type: {
      type: String,
      enum: {
        values: ['influence', 'similarity', 'cause'],
        message: 'Type must be one of: influence, similarity, cause',
      },
      required: [true, 'Thread type is required'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
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
// fromNode / toNode: fast graph traversal (adjacency lookups)
redThreadSchema.index({ fromNode: 1 });
redThreadSchema.index({ toNode: 1 });

// compound: fast "all threads involving node X" query used in cascade delete
// and in GET /api/threads/node/:nodeId
redThreadSchema.index({ fromNode: 1, toNode: 1 });

// createdBy: fast "all threads created by user X" queries
redThreadSchema.index({ createdBy: 1 });

module.exports = mongoose.model('RedThread', redThreadSchema);
