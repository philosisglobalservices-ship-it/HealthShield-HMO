const express = require('express');
const { getDashboardStats } = require('../controllers/dashboard.controller');
// const { protect } = require('../middleware/auth'); // disabled for demo

const router = express.Router();

router.get('/stats', getDashboardStats);

module.exports = router;
