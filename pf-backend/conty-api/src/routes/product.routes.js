const express = require('express');
const { requireAuth, authorizeRoles, requireOrgMembership } = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/product.controller');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Products
 *     description: Product & Variant management
 */

/**
 * @swagger
 * /api/products/template.csv:
 *   get:
 *     summary: Download CSV template for product import
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: text/csv
 */
router.get('/template.csv', requireAuth, requireOrgMembership, ctrl.getCsvTemplate);

/**
 * @swagger
 * /api/products/import:
 *   post:
 *     summary: Importa productos desde un archivo CSV (Solo Owner)
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Archivo CSV con los productos a importar
 *     responses:
 *       200:
 *         description: Importación completada (puede incluir errores parciales)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 successCount:
 *                   type: integer
 *                   example: 48
 *                 errorCount:
 *                   type: integer
 *                   example: 2
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       row: { type: integer, example: 7 }
 *                       message: { type: string, example: "Precio inválido en columna 3" }
 *       400: { description: Archivo no enviado o formato incorrecto }
 *       403: { description: Forbidden (Solo Owner) }
 */
router.post('/import', requireAuth, authorizeRoles(2), upload.single('file'), ctrl.importProductsFromCSV);

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 12 }
 *         org_id: { type: integer, example: 1 }
 *         name: { type: string, example: "Calzado" }
 *         subcategories:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Subcategory'
 *
 *     CategoryCreate:
 *       type: object
 *       required: [name]
 *       properties:
 *         name: { type: string, example: "Camisas" }
 *
 *     CategoryList:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Category'
 *         total: { type: integer, example: 3 }
 *         page: { type: integer, example: 1 }
 *         pageSize: { type: integer, example: 20 }
 *
 *     Subcategory:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 34 }
 *         category_id: { type: integer, example: 12 }
 *         name: { type: string, example: "Zapatillas" }
 *
 *     SubcategoryCreate:
 *       type: object
 *       required: [name]
 *       properties:
 *         name: { type: string, example: "Mocasines" }
 *
 *     Product:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 101 }
 *         org_id: { type: integer, example: 1 }
 *         category_id: { type: integer, example: 12 }
 *         subcategory_id: { type: integer, nullable: true, example: 34 }
 *         sku: { type: string, example: "ZAP083" }
 *         name: { type: string, example: "Zapatillas Deportivas Negras" }
 *         description: { type: string, example: "Capellada de mesh, suela EVA." }
 *         price: { type: number, format: float, example: 12400 }
 *         cost: { type: number, format: float, example: 7200 }
 *         vat_percent: { type: number, format: float, example: 21 }
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *           example: ACTIVE
 *         created_at: { type: string, format: date-time }
 *         category_name: { type: string, example: "Calzado" }
 *         subcategory_name: { type: string, nullable: true, example: "Zapatillas" }
 *
 *     ProductCreate:
 *       type: object
 *       required: [categoryId, name, price, cost, sku]
 *       properties:
 *         categoryId: { type: integer, example: 12 }
 *         subcategoryId: { type: integer, nullable: true, example: 34 }
 *         sku: { type: string, example: "ZAP083" }
 *         name: { type: string, example: "Zapatillas Deportivas Negras" }
 *         description: { type: string, example: "Capellada de mesh, suela EVA." }
 *         price: { type: number, format: float, example: 12400 }
 *         cost: { type: number, format: float, example: 7200 }
 *         vat_percent: { type: number, format: float, example: 21 }
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *           default: ACTIVE
 *
 *     ProductUpdate:
 *       type: object
 *       properties:
 *         categoryId: { type: integer }
 *         subcategoryId: { type: integer, nullable: true }
 *         sku: { type: string }
 *         name: { type: string }
 *         description: { type: string }
 *         price: { type: number, format: float }
 *         cost: { type: number, format: float }
 *         vat_percent: { type: number, format: float }
 *         status: { type: string, enum: [ACTIVE, INACTIVE] }
 *
 *     ProductList:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Product'
 *         total: { type: integer, example: 120 }
 *         page: { type: integer, example: 1 }
 *         pageSize: { type: integer, example: 20 }
 *
 *     Variant:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 5001 }
 *         product_id: { type: integer, example: 101 }
 *         name: { type: string, nullable: true, example: "Negro / 42" }
 *         sku: { type: string, example: "ZAP083-42N" }
 *         barcode: { type: string, nullable: true, example: "7790000000012" }
 *         price: { type: number, format: float, nullable: true, example: 12400 }
 *         cost: { type: number, format: float, nullable: true, example: 7200 }
 *
 *     VariantCreate:
 *       type: object
 *       required: [sku]
 *       properties:
 *         name: { type: string, nullable: true, example: "Azul / M" }
 *         sku:  { type: string, example: "REM001-MA" }
 *         barcode: { type: string, nullable: true, example: "7790000000099" }
 *         price: { type: number, format: float, nullable: true, example: 5500 }
 *         cost:  { type: number, format: float, nullable: true, example: 3200 }
 *
 *     VariantUpdate:
 *       type: object
 *       properties:
 *         name: { type: string, nullable: true }
 *         sku: { type: string }
 *         barcode: { type: string, nullable: true }
 *         price: { type: number, format: float, nullable: true }
 *         cost: { type: number, format: float, nullable: true }
 *
 *     VariantStockByBranch:
 *       type: object
 *       properties:
 *         variant_id: { type: integer, example: 5001 }
 *         qty: { type: integer, example: 15 }
 *         min_qty: { type: integer, example: 5 }
 *         max_qty: { type: integer, nullable: true, example: 100 }
 *
 *     StockMovementItem:
 *       type: object
 *       required: [variant_id, quantity]
 *       properties:
 *         variant_id: { type: integer, example: 5001 }
 *         quantity: { type: integer, example: -2, description: "Se interpretará según el tipo" }
 *         unit_cost: { type: number, format: float, nullable: true, example: 7100 }
 *
 *     StockMovementCreate:
 *       type: object
 *       required: [type, items]
 *       properties:
 *         type:
 *           type: string
 *           enum: [ENTRY, SALE, ADJUSTMENT]
 *           example: SALE
 *         branchId:
 *           type: integer
 *           description: Override branch (OWNER/ADMIN)
 *         ref_code: { type: string, example: "V-0001" }
 *         note: { type: string, example: "Venta presencial" }
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/StockMovementItem'
 *
 *     TransferCreate:
 *       type: object
 *       required: [originBranchId, destBranchId, items]
 *       properties:
 *         transfer_ref: { type: string, example: "T-002" }
 *         originBranchId: { type: integer, example: 1 }
 *         destBranchId: { type: integer, example: 2 }
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             required: [variant_id, quantity]
 *             properties:
 *               variant_id: { type: integer, example: 5001 }
 *               quantity: { type: integer, minimum: 1, example: 10 }
 */


/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: List products (filters + pagination)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: subcategoryId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *       - in: query
 *         name: stockLow
 *         schema:
 *           type: boolean
 *           example: false
 *       - in: query
 *         name: branchId
 *         description: Override branch from token (OWNER/ADMIN only)
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/', requireAuth, requireOrgMembership, ctrl.listProducts);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product detail with variants & stock by branch
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 */
router.get('/:id', requireAuth, requireOrgMembership, ctrl.getProductById);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create product (optionally with default variant)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [categoryId, name, price, cost, sku]
 *             properties:
 *               categoryId:
 *                 type: integer
 *               subcategoryId:
 *                 type: integer
 *                 nullable: true
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *                 format: float
 *               cost:
 *                 type: number
 *                 format: float
 *               vat_percent:
 *                 type: number
 *                 format: float
 *                 default: 0
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *                 default: ACTIVE
 *               sku:
 *                 type: string
 *                 description: If you don’t manage variants yet, this is the product SKU and creates a default variant
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/', requireAuth, authorizeRoles(2, 3), ctrl.createProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryId:
 *                 type: integer
 *               subcategoryId:
 *                 type: integer
 *                 nullable: true
 *               sku:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *                 format: float
 *               cost:
 *                 type: number
 *                 format: float
 *               vat_percent:
 *                 type: number
 *                 format: float
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *     responses:
 *       204:
 *         description: Updated
 *       404:
 *         description: Not found
 */
router.put('/:id', requireAuth, authorizeRoles(2, 3), ctrl.updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Soft delete product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Deleted
 *       404:
 *         description: Not found
 */
router.delete('/:id', requireAuth, authorizeRoles(2, 3), ctrl.deleteProduct);

/**
 * @swagger
 * /api/products/{id}/variants:
 *   post:
 *     summary: Create a variant for product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sku]
 *             properties:
 *               name:
 *                 type: string
 *                 nullable: true
 *               sku:
 *                 type: string
 *               barcode:
 *                 type: string
 *                 nullable: true
 *               price:
 *                 type: number
 *                 format: float
 *                 nullable: true
 *               cost:
 *                 type: number
 *                 format: float
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/:id/variants', requireAuth, authorizeRoles(2, 3), ctrl.createVariant);

/**
 * @swagger
 * /api/products/variants/{variantId}:
 *   put:
 *     summary: Update variant
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               sku: { type: string }
 *               barcode: { type: string }
 *               price:
 *                 type: number
 *                 format: float
 *               cost:
 *                 type: number
 *                 format: float
 *     responses:
 *       204:
 *         description: Updated
 *       404:
 *         description: Not found
 */
router.put('/variants/:variantId', requireAuth, authorizeRoles(2, 3), ctrl.updateVariant);

/**
 * @swagger
 * /api/stock/movements:
 *   post:
 *     summary: Create stock movement (ENTRY/SALE/ADJUSTMENT)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, items]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [ENTRY, SALE, ADJUSTMENT]
 *               branchId:
 *                 type: integer
 *                 description: Override branch (OWNER/ADMIN)
 *               ref_code:
 *                 type: string
 *               note:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [variant_id, quantity]
 *                   properties:
 *                     variant_id:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *                     unit_cost:
 *                       type: number
 *                       format: float
 *     responses:
 *       201:
 *         description: Movement created
 */
router.post('/stock/movements', requireAuth, authorizeRoles(2, 3), ctrl.createStockMovement);

/**
 * @swagger
 * /api/stock/transfers:
 *   post:
 *     summary: Transfer stock between branches (creates OUT+IN)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [originBranchId, destBranchId, items]
 *             properties:
 *               transfer_ref:
 *                 type: string
 *               originBranchId:
 *                 type: integer
 *               destBranchId:
 *                 type: integer
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [variant_id, quantity]
 *                   properties:
 *                     variant_id:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *     responses:
 *       201:
 *         description: Transfer created
 */
router.post('/stock/transfers', requireAuth, authorizeRoles(2, 3), ctrl.createTransfer);

module.exports = router;
