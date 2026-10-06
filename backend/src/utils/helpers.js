const { v4: uuidv4 } = require('uuid');

/**
 * Generate a unique member number: MBR-YYYYMMDD-XXXX
 */
function generateMemberNumber() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `MBR-${dateStr}-${rand}`;
}

/**
 * Generate a unique claim number: CLM-YYYYMMDD-XXXX
 */
function generateClaimNumber() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `CLM-${dateStr}-${rand}`;
}

/**
 * Generate a unique authorization reference: AUTH-YYYYMMDD-XXXX
 */
function generateAuthNumber() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `AUTH-${dateStr}-${rand}`;
}

/**
 * Generate a unique invoice number: INV-YYYYMMDD-XXXX
 */
function generateInvoiceNumber() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV-${dateStr}-${rand}`;
}

/**
 * Generate a unique settlement number: SET-YYYYMMDD-XXXX
 */
function generateSettlementNumber() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `SET-${dateStr}-${rand}`;
}

/**
 * Generate a unique case number: CASE-YYYYMMDD-XXXX
 */
function generateCaseNumber() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CASE-${dateStr}-${rand}`;
}

/**
 * Format amount as Nigerian Naira string
 */
function formatCurrency(amount, currency = 'NGN') {
  const num = parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(num);
}

/**
 * Pagination helper — builds LIMIT/OFFSET clause and metadata
 */
function paginate(page = 1, limit = 20) {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;
  return { page: pageNum, limit: limitNum, offset };
}

/**
 * Build pagination metadata for response
 */
function paginationMeta(total, page, limit) {
  const totalPages = Math.ceil(total / limit);
  return {
    total: parseInt(total),
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * Safe async wrapper — catches errors and passes to next()
 */
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

/**
 * Build SQL search condition
 */
function buildSearchCondition(fields, searchTerm, paramIndex) {
  if (!searchTerm) return { condition: '', params: [], nextIndex: paramIndex };
  const conditions = fields.map((f, i) => `${f} ILIKE $${paramIndex + i}`);
  const params = fields.map(() => `%${searchTerm}%`);
  return {
    condition: `(${conditions.join(' OR ')})`,
    params,
    nextIndex: paramIndex + fields.length,
  };
}

module.exports = {
  generateMemberNumber,
  generateClaimNumber,
  generateAuthNumber,
  generateInvoiceNumber,
  generateSettlementNumber,
  generateCaseNumber,
  formatCurrency,
  paginate,
  paginationMeta,
  asyncHandler,
  buildSearchCondition,
  uuidv4,
};
