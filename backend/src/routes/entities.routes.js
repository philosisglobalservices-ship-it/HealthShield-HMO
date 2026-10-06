const express = require('express');
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/entities.controller');

// ─── EMPLOYERS ────────────────────────────────────────────────────────────────
const employerRouter = express.Router();
employerRouter.use(authenticate);
employerRouter.get('/', ctrl.getAllEmployers);
employerRouter.post('/', ctrl.createEmployer);
employerRouter.get('/:id', ctrl.getEmployerById);
employerRouter.put('/:id', ctrl.updateEmployer);
employerRouter.get('/:id/members', ctrl.getEmployerMembers);
employerRouter.get('/:id/invoices', ctrl.getEmployerInvoices);

// ─── PROVIDERS ────────────────────────────────────────────────────────────────
const providerRouter = express.Router();
providerRouter.use(authenticate);
providerRouter.get('/', ctrl.getAllProviders);
providerRouter.post('/', ctrl.createProvider);
providerRouter.get('/:id', ctrl.getProviderById);
providerRouter.put('/:id', ctrl.updateProvider);
providerRouter.get('/:id/claims', ctrl.getProviderClaims);
providerRouter.get('/:id/settlements', ctrl.getProviderSettlements);

module.exports = { employerRouter, providerRouter };
