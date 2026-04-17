const ConspiracyNode = require('../models/ConspiracyNode');
const RedThread      = require('../models/RedThread');
const asyncHandler   = require('../utils/asyncHandler');
const AppError       = require('../utils/AppError');

// ─── Pagination defaults ──────────────────────────────────────────────────────
const DEFAULT_PAGE  = 1;
const DEFAULT_LIMIT = 50;   // safe default; graph loads all, cards paginate
const MAX_LIMIT     = 200;  // hard cap to protect DB

const parsePagination = (query) => {
  const page  = Math.max(1, parseInt(query.page,  10) || DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit, 10) || DEFAULT_LIMIT));
  const skip  = (page - 1) * limit;
  return { page, limit, skip };
};

// @desc    Get all conspiracy nodes  (paginated)
// @route   GET /api/nodes?page=1&limit=50
// @access  Private
const getNodes = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);

  const [nodes, total] = await Promise.all([
    ConspiracyNode.find()
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ConspiracyNode.countDocuments(),
  ]);

  res.json({
    success: true,
    count:   nodes.length,
    total,
    page,
    pages:   Math.ceil(total / limit),
    data:    nodes,
  });
});

// @desc    Create a new conspiracy node
// @route   POST /api/nodes
// @access  Private
const createNode = asyncHandler(async (req, res) => {
  const { title, description, tags } = req.body;

  const node = await ConspiracyNode.create({
    title,
    description,
    tags: Array.isArray(tags) ? tags : [],
    createdBy: req.user._id,
  });

  await node.populate('createdBy', 'username email');
  res.status(201).json({ success: true, data: node });
});

// @desc    Get single conspiracy node
// @route   GET /api/nodes/:id
// @access  Private
const getNode = asyncHandler(async (req, res, next) => {
  const node = await ConspiracyNode.findById(req.params.id).populate('createdBy', 'username email');
  if (!node) return next(new AppError('Node not found', 404));

  res.json({ success: true, data: node });
});

// @desc    Update a conspiracy node (owner only)
// @route   PUT /api/nodes/:id
// @access  Private
const updateNode = asyncHandler(async (req, res, next) => {
  const node = await ConspiracyNode.findById(req.params.id);
  if (!node) return next(new AppError('Node not found', 404));

  if (node.createdBy.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized to update this node', 403));
  }

  const { title, description, tags } = req.body;
  if (title       !== undefined) node.title       = title;
  if (description !== undefined) node.description = description;
  if (tags        !== undefined) node.tags        = tags;

  const updated = await node.save();
  await updated.populate('createdBy', 'username email');

  res.json({ success: true, data: updated });
});

// @desc    Delete a conspiracy node (owner only) — cascades to RedThreads
// @route   DELETE /api/nodes/:id
// @access  Private
const deleteNode = asyncHandler(async (req, res, next) => {
  const node = await ConspiracyNode.findById(req.params.id);
  if (!node) return next(new AppError('Node not found', 404));

  if (node.createdBy.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized to delete this node', 403));
  }

  const { deletedCount } = await RedThread.deleteMany({
    $or: [{ fromNode: node._id }, { toNode: node._id }],
  });

  await node.deleteOne();

  res.json({
    success: true,
    message: 'Node deleted successfully',
    threadsDeleted: deletedCount,
  });
});

module.exports = { getNodes, createNode, getNode, updateNode, deleteNode };
