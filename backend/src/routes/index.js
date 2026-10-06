const express = require('express');
const router = express.Router();

const dashboardRoutes = require('./dashboard.routes');
const authRoutes = require('./auth.routes');
const memberRoutes = require('./members.routes');
const claimRoutes = require('./claims.routes');
const authorizationRoutes = require('./authorizations.routes');
const { employerRouter, providerRouter } = require('./entities.routes');
const { planRouter, enrollmentRouter, financeRouter, caseRouter } = require('./operations.routes');
const { userRouter, roleRouter, auditRouter, reportRouter } = require('./admin.routes');

router.use('/dashboard', dashboardRoutes);
router.use('/auth', authRoutes);
router.use('/members', memberRoutes);
router.use('/claims', claimRoutes);
router.use('/authorizations', authorizationRoutes);
router.use('/employers', employerRouter);
router.use('/providers', providerRouter);
router.use('/plans', planRouter);
router.use('/enrollments', enrollmentRouter);
router.use('/finance', financeRouter);
router.use('/cases', caseRouter);
router.use('/users', userRouter);
router.use('/roles', roleRouter);
router.use('/audit', auditRouter);
router.use('/reports', reportRouter);

// Health check
router.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

module.exports = router;
