const pool = require('../config/db');

function getMonthDateRange() {
  const date = new Date();
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
      from: firstDay.toISOString().split('T')[0] + ' 00:00:00',
      to: lastDay.toISOString().split('T')[0] + ' 23:59:59'
  };
}

function get7DaysRange() {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 6);
    return {
        from: from.toISOString().split('T')[0] + ' 00:00:00',
        to: to.toISOString().split('T')[0] + ' 23:59:59'
    }
}

async function getKpis(orgId, branchId) {
  const { from, to } = getMonthDateRange();
  const params = [orgId, from, to];
  let branchFilter = '';

  if (branchId) {
      branchFilter = 'AND s.branch_id = ?';
      params.push(branchId);
  }

  const [salesData] = await pool.query(`
    SELECT
      COALESCE(SUM(s.total_amount), 0) AS totalSales,
      COUNT(s.id) AS salesCount,
      COALESCE(AVG(s.total_amount), 0) AS averageTicket
    FROM sales s
    WHERE s.org_id = ? AND s.status = 'CONFIRMED' AND s.is_deleted = 0
    AND s.created_at BETWEEN ? AND ?
    ${branchFilter}
  `, params);

  const [unitsData] = await pool.query(`
    SELECT COALESCE(SUM(si.qty), 0) AS unitsSold
    FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
    WHERE s.org_id = ? AND s.status = 'CONFIRMED' AND s.is_deleted = 0
    AND s.created_at BETWEEN ? AND ?
    ${branchFilter}
  `, params);

  return {
    totalSales: Number(salesData[0].totalSales),
    salesCount: Number(salesData[0].salesCount),
    averageTicket: Number(salesData[0].averageTicket),
    unitsSold: Number(unitsData[0].unitsSold)
  };
}

async function getLast7DaysChart(orgId, branchId) {
    const { from, to } = get7DaysRange();
    const params = [orgId, from, to];
    if (branchId) params.push(branchId);

    const [rows] = await pool.query(`
        SELECT
            DATE(s.created_at) as date,
            SUM(s.total_amount) as total
        FROM sales s
        WHERE s.org_id = ? AND s.status = 'CONFIRMED' AND s.is_deleted = 0
        AND s.created_at BETWEEN ? AND ?
        ${branchId ? 'AND s.branch_id = ?' : ''}
        GROUP BY DATE(s.created_at)
        ORDER BY date ASC
    `, params);

    return rows;
}

async function getLowStockAlerts(orgId, branchId) {
    const params = [orgId];
    if (branchId) params.push(branchId);

    const [rows] = await pool.query(`
        SELECT
            p.name as productName,
            v.name as variantName,
            b.name as branchName,
            bvs.qty as stock,
            bvs.min_qty as minStock
        FROM branch_variant_stock bvs
        JOIN product_variants v ON v.id = bvs.variant_id
        JOIN products p ON p.id = v.product_id
        JOIN branches b ON b.id = bvs.branch_id
        WHERE p.org_id = ? AND p.is_deleted = 0 AND v.is_deleted = 0
        AND bvs.qty <= bvs.min_qty
        ${branchId ? 'AND bvs.branch_id = ?' : ''}
        LIMIT 5
    `, params);
    return rows;
}

async function getRecentSales(orgId, branchId) {
    const params = [orgId];
    if (branchId) params.push(branchId);

    const [rows] = await pool.query(`
        SELECT
            s.id, s.doc_number, s.total_amount, s.created_at, s.status,
            c.name as customerName
        FROM sales s
        LEFT JOIN customers c ON c.id = s.customer_id
        WHERE s.org_id = ? AND s.is_deleted = 0
        ${branchId ? 'AND s.branch_id = ?' : ''}
        ORDER BY s.created_at DESC
        LIMIT 5
    `, params);
    return rows;
}

async function getTopProducts(orgId, branchId) {
    const params = [orgId];
    if (branchId) params.push(branchId);

    const { from, to } = getMonthDateRange();
    params.push(from, to);

    const [rows] = await pool.query(`
        SELECT
            p.name as productName,
            SUM(si.qty) as quantity,
            SUM(si.line_total) as total
        FROM sale_items si
        JOIN sales s ON s.id = si.sale_id
        JOIN products p ON p.id = si.product_id
        WHERE s.org_id = ? AND s.status = 'CONFIRMED' AND s.is_deleted = 0
        ${branchId ? 'AND s.branch_id = ?' : ''}
        AND s.created_at BETWEEN ? AND ?
        GROUP BY p.id
        ORDER BY quantity DESC
        LIMIT 5
    `, params);
    return rows;
}

module.exports = {
    getKpis,
    getLast7DaysChart,
    getLowStockAlerts,
    getRecentSales,
    getTopProducts
};
