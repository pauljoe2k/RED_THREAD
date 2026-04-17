const express = require('express');
const router = express.Router();
const {
  getThreads,
  createThread,
  getThread,
  updateThread,
  deleteThread,
  getThreadsByNode,
} = require('../controllers/threadController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const {
  createThreadRules,
  updateThreadRules,
  mongoIdParam,
} = require('../middleware/validationRules');

// All routes are protected
router.use(protect);

// /node/:nodeId must be declared before /:id to avoid routing collision
router.get(
  '/node/:nodeId',
  mongoIdParam('nodeId'),
  validate,
  getThreadsByNode
);

router
  .route('/')
  .get(getThreads)
  .post(createThreadRules, validate, createThread);

router
  .route('/:id')
  .get(mongoIdParam('id'), validate, getThread)
  .put(mongoIdParam('id'), updateThreadRules, validate, updateThread)
  .delete(mongoIdParam('id'), validate, deleteThread);

module.exports = router;
