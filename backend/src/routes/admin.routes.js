const express = require('express');
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/admin.controller');

// ─── USERS ────────────────────────────────────────────────────────────────────
const userRouter = express.Router();
userRouter.use(authenticate);
userRouter.get('/', ctrl.getAllUsers);
userRouter.post('/', ctrl.createUser);
userRouter.get('/:id', ctrl.getUserById);
userRouter.put('/:id', ctrl.updateUser);
userRouter.post('/:id/disable', ctrl.disableUser);

// ─── ROLES ────────────────────────────────────────────────────────────────────
const roleRouter = express.Router();
roleRouter.use(authenticate);
roleRouter.get('/', ctrl.getAllRoles);
roleRouter.post('/', ctrl.createRole);

// ─── AUDIT ────────────────────────────────────────────────────────────────────
const auditRouter = express.Router();
auditRouter.use(authenticate);
auditRouter.get('/logs', ctrl.getAuditLogs);
auditRouter.get('/security-events', ctrl.getSecurityEvents);
auditRouter.get('/notifications', ctrl.getNotifications);
auditRouter.put('/notifications/:id/read', ctrl.markNotificationRead);

// ─── REPORTS ──────────────────────────────────────────────────────────────────
const reportRouter = express.Router();
reportRouter.use(authenticate);
reportRouter.get('/members', ctrl.getMemberReport);
reportRouter.get('/claims', ctrl.getClaimsReport);
reportRouter.get('/financial', ctrl.getFinancialReport);
reportRouter.get('/providers', ctrl.getProviderReport);
reportRouter.get('/utilization', ctrl.getUtilizationReport);

module.exports = { userRouter, roleRouter, auditRouter, reportRouter };
