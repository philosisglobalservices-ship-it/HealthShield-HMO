const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getAll, getById, create, update, approve, deny, cancel } = require('../controllers/authorizations.controller');

router.use(authenticate);
router.get('/', getAll);
router.post('/', create);
router.get('/:id', getById);
router.put('/:id', update);
router.post('/:id/approve', approve);
router.post('/:id/deny', deny);
router.post('/:id/cancel', cancel);

module.exports = router;
