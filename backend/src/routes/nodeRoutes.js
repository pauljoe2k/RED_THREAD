const express = require('express');
const router = express.Router();
const {
  getNodes,
  createNode,
  getNode,
  updateNode,
  deleteNode,
} = require('../controllers/nodeController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const {
  createNodeRules,
  updateNodeRules,
  mongoIdParam,
} = require('../middleware/validationRules');

// All routes are protected
router.use(protect);

router
  .route('/')
  .get(getNodes)
  .post(createNodeRules, validate, createNode);

router
  .route('/:id')
  .get(mongoIdParam('id'), validate, getNode)
  .put(mongoIdParam('id'), updateNodeRules, validate, updateNode)
  .delete(mongoIdParam('id'), validate, deleteNode);

module.exports = router;
