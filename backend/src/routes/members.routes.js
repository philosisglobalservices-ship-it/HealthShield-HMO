const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getAll, getById, create, update, terminate,
  getDependants, createDependant, getEnrollments, getMemberClaims, getMemberAuthorizations
} = require('../controllers/members.controller');

router.use(authenticate);
router.get('/', getAll);
router.post('/', create);
router.get('/:id', getById);
router.put('/:id', update);
router.post('/:id/terminate', terminate);
router.get('/:id/dependants', getDependants);
router.post('/:id/dependants', createDependant);
router.get('/:id/enrollments', getEnrollments);
router.get('/:id/claims', getMemberClaims);
router.get('/:id/authorizations', getMemberAuthorizations);

module.exports = router;
