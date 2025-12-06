const svc = require('../services/reports.service');
const moment = require('dayjs'); // Usar dayjs ya que lo usaste en otros archivos

async function getReportData(req, res) {
  try {
    const orgId = req.user.orgId;
    const filters = {
        orgId,
        from: req.query.from || moment().startOf('month').format('YYYY-MM-DD'),
        to: req.query.to || moment().endOf('month').format('YYYY-MM-DD'),
        branchId: req.query.branchId ? Number(req.query.branchId) : null,
        sellerId: req.query.sellerId ? Number(req.query.sellerId) : null,
        channel: req.query.channel,
        categoryId: req.query.categoryId ? Number(req.query.categoryId) : null,
    };

    const [stats, evolution, bySeller, byPayment, topCustomers, topProducts] = await Promise.all([
        svc.getReportStats(filters),
        svc.getSalesEvolution(filters),
        svc.getSalesBySeller(filters),
        svc.getSalesByPaymentMethod(filters),
        svc.getTopCustomers(filters),
        svc.getTopProductsReport(filters)
    ]);

    res.json({
        stats,
        evolution,
        bySeller,
        byPayment,
        topCustomers,
        topProducts
    });

  } catch (e) {
    console.error('[REPORTS] Error:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { getReportData };
