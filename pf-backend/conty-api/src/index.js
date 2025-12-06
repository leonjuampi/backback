const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), override: true });

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const setupSwagger = require('./docs/swagger');
const pool = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const customerRoutes = require('./routes/customer.routes');
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const userRoutes = require('./routes/user.routes');
const devRoutes = require('./routes/dev.routes');
const organizationRoutes = require('./routes/organization.routes');
const branchRoutes = require('./routes/branch.routes');
const stockRoutes = require('./routes/stock.routes');
const numberingRoutes = require('./routes/numbering.routes')
const salesRoutes = require('./routes/sales.routes')
const quotesRoutes = require('./routes/quotes.routes')
const paymentMethodsRoutes = require('./routes/payment_methods.routes')
const priceListsRoutes = require('./routes/price_lists.routes');
const auditRoutes = require('./routes/audit.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const reportsRoutes = require('./routes/reports.routes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));


app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api', devRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/numbering', numberingRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/quotes', quotesRoutes);
app.use('/api/payment-methods', paymentMethodsRoutes);
app.use('/api/price-lists', priceListsRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);


setupSwagger(app);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Conty API running at http://localhost:${PORT}`);
  console.log(`Swagger UI at http://localhost:${PORT}/docs`);
});




app.get('/', (req, res) => {
  res.send('API Conty funcionando');
});
