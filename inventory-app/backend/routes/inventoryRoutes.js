const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { 
  getInventory, 
  addProduct, 
  updateProduct, 
  deleteProduct,
  bulkDeleteProducts,
  bulkImportProducts,
  getProductByBarcode,
  upsertByBarcode,
  recordSale,
  restockProduct
} = require('../controllers/inventoryController');

// @route    GET /api/inventory
// @desc     Get all products (with predictive logic)
router.get('/', auth, getInventory);

// @route    POST /api/inventory
// @desc     Add a new product
router.post('/', auth, addProduct);

// @route    POST /api/inventory/bulk-import
// @desc     Import products from parsed rows
router.post('/bulk-import', auth, bulkImportProducts);

// @route    GET /api/inventory/barcode/:code
// @desc     Find product by barcode
router.get('/barcode/:code', auth, getProductByBarcode);

// @route    POST /api/inventory/barcode/upsert
// @desc     Create or update stock by barcode
router.post('/barcode/upsert', auth, upsertByBarcode);

// @route    POST /api/inventory/:id/record-sale
// @desc     Record sale and reduce stock
router.post('/:id/record-sale', auth, recordSale);

// @route    POST /api/inventory/:id/restock
// @desc     Record purchase/restock and increase stock
router.post('/:id/restock', auth, restockProduct);

// @route    PUT /api/inventory/:id
// @desc     Update product stock/details
router.put('/:id', auth, updateProduct);

// @route    DELETE /api/inventory/:id
// @desc     Remove a product
router.delete('/:id', auth, deleteProduct);

// @route    POST /api/inventory/bulk-delete
// @desc     Remove multiple products
router.post('/bulk-delete', auth, bulkDeleteProducts);

module.exports = router;