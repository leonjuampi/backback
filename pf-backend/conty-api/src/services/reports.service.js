const pool = require('../config/db');

function buildReportWhere({ orgId, from, to, branchId, sellerId, channel }) {
    const wh = ['s.org_id = ?', 's.status = "CONFIRMED"', 's.is_deleted = 0'];
    const params = [orgId];

    if (from) { wh.push('s.created_at >= ?'); params.push(`${from} 00:00:00`); }
    if (to) { wh.push('s.created_at <= ?'); params.push(`${to} 23:59:59`); }
    if (branchId) { wh.push('s.branch_id = ?'); params.push(branchId); }
    if (sellerId) { wh.push('s.seller_id = ?'); params.push(sellerId); }

    if (channel) { wh.push('b.channel = ?'); params.push(channel); }

    return { whereClause: wh.join(' AND '), params };
}

async function getReportStats(filters) {
    const { whereClause, params } = buildReportWhere(filters);

    const sql = `
        SELECT
            COALESCE(SUM(s.total_amount), 0) as totalSold,
            COUNT(s.id) as salesCount,
            COALESCE(AVG(s.total_amount), 0) as avgTicket,
            COALESCE(SUM(si_agg.total_qty), 0) as unitsSold,
            COALESCE(SUM(si_agg.total_cost), 0) as totalCost
        FROM sales s
        JOIN branches b ON b.id = s.branch_id
        JOIN (
            SELECT sale_id, SUM(qty) as total_qty, SUM(qty * v.cost) as total_cost
            FROM sale_items si
            JOIN product_variants v ON v.id = si.variant_id
            GROUP BY sale_id
        ) si_agg ON si_agg.sale_id = s.id
        WHERE ${whereClause}
    `;

    const [rows] = await pool.query(sql, params);
    const data = rows[0];

    const grossMargin = data.totalSold > 0
        ? ((data.totalSold - data.totalCost) / data.totalSold) * 100
        : 0;

    return {
        totalSold: Number(data.totalSold),
        salesCount: Number(data.salesCount),
        avgTicket: Number(data.avgTicket),
        unitsSold: Number(data.unitsSold),
        grossMargin: Number(grossMargin.toFixed(2))
    };
}

async function getSalesEvolution(filters) {
    const { whereClause, params } = buildReportWhere(filters);

    const sql = `
        SELECT DATE(s.created_at) as date, SUM(s.total_amount) as total
        FROM sales s
        JOIN branches b ON b.id = s.branch_id
        WHERE ${whereClause}
        GROUP BY DATE(s.created_at)
        ORDER BY date ASC
    `;
    const [rows] = await pool.query(sql, params);
    return rows;
}

async function getSalesBySeller(filters) {
    const { whereClause, params } = buildReportWhere(filters);
    const sql = `
        SELECT u.name as sellerName, SUM(s.total_amount) as total
        FROM sales s
        JOIN branches b ON b.id = s.branch_id
        LEFT JOIN users u ON u.id = s.seller_id
        WHERE ${whereClause}
        GROUP BY s.seller_id
        ORDER BY total DESC
        LIMIT 10
    `;
    const [rows] = await pool.query(sql, params);
    return rows;
}

async function getSalesByPaymentMethod(filters) {
    const { whereClause, params } = buildReportWhere(filters);

    const sql = `
        SELECT pm.name as method, SUM(sp.amount) as total
        FROM sale_payments sp
        JOIN sales s ON s.id = sp.sale_id
        JOIN branches b ON b.id = s.branch_id
        JOIN payment_methods pm ON pm.id = sp.method_id
        WHERE ${whereClause}
        GROUP BY sp.method_id
        ORDER BY total DESC
    `;
    const [rows] = await pool.query(sql, params);
    return rows;
}

async function getTopCustomers(filters) {
    const { whereClause, params } = buildReportWhere(filters);
    const sql = `
        SELECT c.name as customerName, SUM(s.total_amount) as total, COUNT(s.id) as transactions
        FROM sales s
        JOIN branches b ON b.id = s.branch_id
        LEFT JOIN customers c ON c.id = s.customer_id
        WHERE ${whereClause}
        GROUP BY s.customer_id
        ORDER BY total DESC
        LIMIT 10
    `;
    const [rows] = await pool.query(sql, params);
    return rows;
}

async function getTopProductsReport(filters) {
    const { whereClause, params } = buildReportWhere(filters);
    const sql = `
        SELECT
            p.name as productName,
            SUM(si.qty) as quantity,
            SUM(si.line_total) as total
        FROM sale_items si
        JOIN sales s ON s.id = si.sale_id
        JOIN branches b ON b.id = s.branch_id
        JOIN products p ON p.id = si.product_id
        WHERE ${whereClause}
        GROUP BY p.id
        ORDER BY quantity DESC
        LIMIT 10
    `;
    const [rows] = await pool.query(sql, params);
    return rows;
}

module.exports = {
    getReportStats,
    getSalesEvolution,
    getSalesBySeller,
    getSalesByPaymentMethod,
    getTopCustomers,
    getTopProductsReport
};
