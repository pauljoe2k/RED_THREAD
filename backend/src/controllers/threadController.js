const RedThread      = require('../models/RedThread');
const ConspiracyNode = require('../models/ConspiracyNode');
const asyncHandler   = require('../utils/asyncHandler');
const AppError       = require('../utils/AppError');

// ─── Shared populate helper ───────────────────────────────────────────────────
const populateThread = (query) =>
  query
    .populate('fromNode', 'title')
    .populate('toNode',   'title')
    .populate('createdBy', 'username email');

// ─── Pagination defaults ──────────────────────────────────────────────────────
const DEFAULT_LIMIT = 200; // threads are small; load all for graph by default
const MAX_LIMIT     = 500;

const parsePagination = (query) => {
  const page  = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit, 10) || DEFAULT_LIMIT));
  const skip  = (page - 1) * limit;
  return { page, limit, skip };
};

// @desc    Get all red threads  (paginated)
// @route   GET /api/threads?page=1&limit=200
// @access  Private
const getThreads = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);

  const [threads, total] = await Promise.all([
    populateThread(RedThread.find().sort({ createdAt: -1 }).skip(skip).limit(limit)),
    RedThread.countDocuments(),
  ]);

  res.json({
    success: true,
    count:   threads.length,
    total,
    page,
    pages:   Math.ceil(total / limit),
    data:    threads,
  });
});

// @desc    Get threads connected to a specific node (from or to)
// @route   GET /api/threads/node/:nodeId
// @access  Private
const getThreadsByNode = asyncHandler(async (req, res) => {
  const threads = await populateThread(
    RedThread.find({
      $or: [{ fromNode: req.params.nodeId }, { toNode: req.params.nodeId }],
    })
  );
  res.json({ success: true, count: threads.length, data: threads });
});

// @desc    Create a red thread
// @route   POST /api/threads
// @access  Private
const createThread = asyncHandler(async (req, res, next) => {
  const { fromNode, toNode, type, description } = req.body;

  if (fromNode === toNode) {
    return next(new AppError('fromNode and toNode must be different nodes', 400));
  }

  const [from, to] = await Promise.all([
    ConspiracyNode.findById(fromNode),
    ConspiracyNode.findById(toNode),
  ]);
  if (!from) return next(new AppError(`fromNode not found: '${fromNode}'`, 404));
  if (!to)   return next(new AppError(`toNode not found: '${toNode}'`, 404));

  const thread = await RedThread.create({
    fromNode,
    toNode,
    type,
    description: description || '',
    createdBy: req.user._id,
  });

  const populated = await populateThread(RedThread.findById(thread._id));
  res.status(201).json({ success: true, data: populated });
});

// @desc    Get single red thread
// @route   GET /api/threads/:id
// @access  Private
const getThread = asyncHandler(async (req, res, next) => {
  const thread = await populateThread(RedThread.findById(req.params.id));
  if (!thread) return next(new AppError('Thread not found', 404));
  res.json({ success: true, data: thread });
});

// @desc    Update a red thread (owner only)
// @route   PUT /api/threads/:id
// @access  Private
const updateThread = asyncHandler(async (req, res, next) => {
  const thread = await RedThread.findById(req.params.id);
  if (!thread) return next(new AppError('Thread not found', 404));

  if (thread.createdBy.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized to update this thread', 403));
  }

  const { type, description } = req.body;
  if (type        !== undefined) thread.type        = type;
  if (description !== undefined) thread.description = description;

  await thread.save();
  const updated = await populateThread(RedThread.findById(thread._id));
  res.json({ success: true, data: updated });
});

// @desc    Delete a red thread (owner only)
// @route   DELETE /api/threads/:id
// @access  Private
const deleteThread = asyncHandler(async (req, res, next) => {
  const thread = await RedThread.findById(req.params.id);
  if (!thread) return next(new AppError('Thread not found', 404));

  if (thread.createdBy.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized to delete this thread', 403));
  }

  await thread.deleteOne();
  res.json({ success: true, message: 'Thread deleted successfully' });
});

module.exports = {
  getThreads,
  createThread,
  getThread,
  updateThread,
  deleteThread,
  getThreadsByNode,
};
