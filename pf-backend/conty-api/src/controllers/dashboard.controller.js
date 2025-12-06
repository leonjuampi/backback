const svc = require('../services/dashboard.service');

async function getDashboardData(req, res) {
  try {
    const orgId = req.user.orgId;
    const branchId = req.query.branchId ? Number(req.query.branchId) : null;

    const [kpis, chart, alerts, recent, top] = await Promise.all([
        svc.getKpis(orgId, branchId),
        svc.getLast7DaysChart(orgId, branchId),
        svc.getLowStockAlerts(orgId, branchId),
        svc.getRecentSales(orgId, branchId),
        svc.getTopProducts(orgId, branchId)
    ]);

    res.json({
        kpis,
        chart,
        alerts,
        recentSales: recent,
        topProducts: top
    });
  } catch (e) {
    console.error('[DASHBOARD] Error:', e);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { getDashboardData };
