const express = require('express');
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/operations.controller');

// ─── PLANS ────────────────────────────────────────────────────────────────────
const planRouter = express.Router();
planRouter.use(authenticate);
planRouter.get('/', ctrl.getAllPlans);
planRouter.post('/', ctrl.createPlan);
planRouter.get('/:id', ctrl.getPlanById);
planRouter.put('/:id', ctrl.updatePlan);
planRouter.get('/:id/benefits', ctrl.getPlanBenefits);
planRouter.post('/:id/benefits', ctrl.addPlanBenefit);

// ─── ENROLLMENTS ──────────────────────────────────────────────────────────────
const enrollmentRouter = express.Router();
enrollmentRouter.use(authenticate);
enrollmentRouter.get('/', ctrl.getAllEnrollments);
enrollmentRouter.post('/', ctrl.createEnrollment);
enrollmentRouter.get('/:id', ctrl.getEnrollmentById);
enrollmentRouter.post('/:id/terminate', ctrl.terminateEnrollment);
enrollmentRouter.post('/:id/suspend', ctrl.suspendEnrollment);
enrollmentRouter.post('/:id/reactivate', ctrl.reactivateEnrollment);

// ─── FINANCE ──────────────────────────────────────────────────────────────────
const financeRouter = express.Router();
financeRouter.use(authenticate);
financeRouter.get('/invoices', ctrl.getAllInvoices);
financeRouter.post('/invoices', ctrl.createInvoice);
financeRouter.post('/invoices/:id/pay', ctrl.payInvoice);
financeRouter.get('/payments', ctrl.getAllPayments);
financeRouter.get('/settlements', ctrl.getAllSettlements);
financeRouter.post('/settlements', ctrl.createSettlement);
financeRouter.get('/reports/summary', ctrl.getFinancialSummary);

// ─── CASES ────────────────────────────────────────────────────────────────────
const caseRouter = express.Router();
caseRouter.use(authenticate);
caseRouter.get('/', ctrl.getAllCases);
caseRouter.post('/', ctrl.createCase);
caseRouter.get('/:id', ctrl.getCaseById);
caseRouter.put('/:id', ctrl.updateCase);
caseRouter.post('/:id/resolve', ctrl.resolveCase);
caseRouter.post('/:id/close', ctrl.closeCase);

module.exports = { planRouter, enrollmentRouter, financeRouter, caseRouter };
