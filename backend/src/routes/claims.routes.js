const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getAll, getById, create, submit, approve, deny, pay, appeal } = require('../controllers/claims.controller');

router.use(authenticate);
router.get('/', getAll);
router.post('/', create);
router.get('/:id', getById);
router.post('/:id/submit', submit);
router.post('/:id/approve', approve);
router.post('/:id/deny', deny);
router.post('/:id/pay', pay);
router.post('/:id/appeal', appeal);

module.exports = router;
