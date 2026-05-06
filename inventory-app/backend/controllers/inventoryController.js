const Product = require('../models/Product');

const makeSku = (value, barcodeValue) => {
  if (value && String(value).trim()) return String(value).trim();
  if (barcodeValue && String(barcodeValue).trim()) return `SKU-${String(barcodeValue).trim()}`;
  return `SKU-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const trimText = (value) => (value === undefined || value === null ? '' : String(value).trim());

const normalizeImportRow = (row) => {
  const name = trimText(row.name || row.productName || row.product || row.itemName);
  const sku = trimText(row.sku || row.SKU);
  const barcode = trimText(row.barcode || row.qrCode || row.code || row.barCode);
  const category = trimText(row.category || row.group || row.type || 'General');
  const price = toNumber(row.price ?? row.sellingPrice ?? row.salePrice, NaN);
  const costPrice = toNumber(row.costPrice ?? row.purchasePrice ?? row.cost ?? 0, 0);
  const currentStock = toNumber(row.quantity ?? row.currentStock ?? row.stock ?? row.units, 0);

  return {
    name,
    sku,
    barcode,
    category: category || 'General',
    price,
    costPrice,
    currentStock
  };
};

// 1. Get all inventory (with predictive logic)
exports.getInventory = async (req, res) => {
  try {
    const products = await Product.find({ user: req.user.id });

    const analyzedProducts = products.map(product => {
      const p = product.toObject();
      const sellingPrice = Number(p.price) || 0;
      const costPrice = Number(p.costPrice) || 0;
      const stockCount = Number(p.currentStock) || 0;
      const totalSales = p.salesHistory.reduce((acc, curr) => acc + curr, 0);
      const avgUsage = totalSales / (p.salesHistory.length || 1);
      const estimatedProfitPerUnit = costPrice > 0 ? sellingPrice - costPrice : 0;
      
      p.calculatedAvgUsage = avgUsage.toFixed(1);
      p.daysUntilOut = avgUsage > 0 ? Math.floor(stockCount / avgUsage) : 999;
      p.inventoryValue = sellingPrice * stockCount;
      p.estimatedProfit = estimatedProfitPerUnit * stockCount;
      p.profitMargin = sellingPrice > 0 && costPrice > 0 ? ((estimatedProfitPerUnit / sellingPrice) * 100).toFixed(1) : '0.0';
      p.estimatedProfitPerUnit = estimatedProfitPerUnit;

      if (p.currentStock <= p.minStockLevel) {
        p.forecastAction = "Safety Stock Breached";
        p.urgent = true;
      } else if (p.daysUntilOut <= 3) {
        p.forecastAction = "Critical: 3 Days Left";
        p.urgent = true;
      } else if (p.daysUntilOut <= 7) {
        p.forecastAction = "Restock Suggested";
        p.urgent = false;
      } else {
        p.forecastAction = "Stock Stable";
        p.urgent = false;
      }
      return p;
    });

    res.json(analyzedProducts);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

// 2. Add a product
exports.addProduct = async (req, res) => {
  try {
    const productData = {
      ...req.body,
      sku: makeSku(req.body.sku, req.body.barcode),
      barcode: trimText(req.body.barcode),
      currentStock: toNumber(req.body.currentStock, 0),
      price: toNumber(req.body.price, 0),
      costPrice: toNumber(req.body.costPrice, 0),
      user: req.user.id
    };
    const newProduct = new Product(productData);
    const product = await newProduct.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message || "Invalid product data" });
  }
};

// 3. Update a product (Critical for the Sales tab)
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { 
        // Change 'new: true' to this:
        returnDocument: 'after', 
        runValidators: true 
      }
    );

    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: "Update failed" });
  }
};

// 4. Delete a product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ 
      _id: req.params.id, 
      user: req.user.id 
    });

    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
};

// 4b. Bulk delete products
exports.bulkDeleteProducts = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ message: 'Product ids are required' });
    }

    const result = await Product.deleteMany({
      _id: { $in: ids },
      user: req.user.id
    });

    if (!result.deletedCount) {
      return res.status(404).json({ message: 'No matching products found' });
    }

    return res.json({
      message: 'Products deleted',
      deletedCount: result.deletedCount
    });
  } catch (err) {
    return res.status(500).json({ message: 'Bulk delete failed' });
  }
};

// 5. Bulk import products from CSV/Excel-parsed rows
exports.bulkImportProducts = async (req, res) => {
  try {
    const { rows, mode = 'mergeStock' } = req.body;

    if (!Array.isArray(rows) || !rows.length) {
      return res.status(400).json({ message: 'Import rows are required' });
    }

    const report = {
      totalRows: rows.length,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < rows.length; i += 1) {
      const normalized = normalizeImportRow(rows[i]);
      const rowNumber = i + 1;

      if (!normalized.name || !Number.isFinite(normalized.price) || normalized.currentStock < 0) {
        report.failed += 1;
        report.errors.push({ row: rowNumber, message: 'Missing or invalid name/price/quantity' });
        continue;
      }

      const lookup = normalized.barcode
        ? { user: req.user.id, barcode: normalized.barcode }
        : { user: req.user.id, sku: makeSku(normalized.sku, normalized.barcode) };

      let existing = await Product.findOne(lookup);

      if (!existing && normalized.sku) {
        existing = await Product.findOne({ user: req.user.id, sku: normalized.sku });
      }

      if (existing) {
        if (mode === 'skipExisting') {
          report.skipped += 1;
          continue;
        }

        existing.currentStock = mode === 'replaceStock'
          ? normalized.currentStock
          : existing.currentStock + normalized.currentStock;
        existing.price = normalized.price;
        existing.costPrice = normalized.costPrice;
        existing.category = normalized.category;
        existing.name = normalized.name;
        if (normalized.barcode) existing.barcode = normalized.barcode;
        await existing.save();
        report.updated += 1;
        continue;
      }

      try {
        const product = new Product({
          name: normalized.name,
          sku: makeSku(normalized.sku, normalized.barcode),
          barcode: normalized.barcode,
          currentStock: normalized.currentStock,
          costPrice: normalized.costPrice,
          price: normalized.price,
          category: normalized.category,
          salesHistory: [0, 0, 0, 0, 0],
          user: req.user.id
        });

        await product.save();
        report.created += 1;
      } catch (saveErr) {
        report.failed += 1;
        report.errors.push({ row: rowNumber, message: saveErr.message || 'Failed to save row' });
      }
    }

    return res.json(report);
  } catch (err) {
    return res.status(500).json({ message: 'Bulk import failed' });
  }
};

// 6. Find product by barcode or QR code value
exports.getProductByBarcode = async (req, res) => {
  try {
    const code = trimText(req.params.code);
    if (!code) return res.status(400).json({ message: 'Barcode is required' });

    const product = await Product.findOne({ user: req.user.id, barcode: code });
    if (!product) return res.status(404).json({ message: 'Product not found for barcode' });

    return res.json(product);
  } catch (err) {
    return res.status(500).json({ message: 'Barcode lookup failed' });
  }
};

// 7. Upsert inventory using barcode scan flow
exports.upsertByBarcode = async (req, res) => {
  try {
    const code = trimText(req.body.barcode);
    const quantity = Math.max(0, toNumber(req.body.quantity, 1));
    const mergeStock = req.body.mergeStock !== false;

    if (!code) return res.status(400).json({ message: 'Barcode is required' });

    let product = await Product.findOne({ user: req.user.id, barcode: code });

    if (product) {
      product.currentStock = mergeStock ? product.currentStock + quantity : quantity;
      if (trimText(req.body.name)) product.name = trimText(req.body.name);
      if (trimText(req.body.category)) product.category = trimText(req.body.category);
      if (req.body.price !== undefined) product.price = toNumber(req.body.price, product.price);
      if (req.body.costPrice !== undefined) product.costPrice = toNumber(req.body.costPrice, product.costPrice);
      if (trimText(req.body.sku)) product.sku = trimText(req.body.sku);
      await product.save();

      return res.json({ action: 'updated', product });
    }

    const name = trimText(req.body.name);
    const category = trimText(req.body.category || 'General');
    const price = toNumber(req.body.price, NaN);
    const costPrice = toNumber(req.body.costPrice, 0);

    if (!name || !Number.isFinite(price)) {
      return res.status(400).json({ message: 'name and price are required for a new barcode product' });
    }

    product = new Product({
      name,
      sku: makeSku(req.body.sku, code),
      barcode: code,
      currentStock: quantity,
      price,
      costPrice,
      category,
      salesHistory: [0, 0, 0, 0, 0],
      user: req.user.id
    });

    await product.save();
    return res.status(201).json({ action: 'created', product });
  } catch (err) {
    return res.status(400).json({ message: err.message || 'Barcode upsert failed' });
  }
};

// 8. Record a sale movement (stock down)
exports.recordSale = async (req, res) => {
  try {
    const quantity = Math.floor(toNumber(req.body.quantity, 0));

    if (quantity <= 0) {
      return res.status(400).json({ message: 'Sale quantity must be greater than 0' });
    }

    const product = await Product.findOne({ _id: req.params.id, user: req.user.id });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (product.currentStock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock for this sale' });
    }

    product.currentStock -= quantity;
    const history = Array.isArray(product.salesHistory) ? [...product.salesHistory] : [];
    history.push(quantity);
    product.salesHistory = history.slice(-5);

    await product.save();

    return res.json({
      message: 'Sale recorded',
      movement: { type: 'sale', quantity },
      product
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to record sale' });
  }
};

// 9. Record a restock movement (stock up)
exports.restockProduct = async (req, res) => {
  try {
    const quantity = Math.floor(toNumber(req.body.quantity, 0));

    if (quantity <= 0) {
      return res.status(400).json({ message: 'Restock quantity must be greater than 0' });
    }

    const product = await Product.findOne({ _id: req.params.id, user: req.user.id });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    product.currentStock += quantity;
    await product.save();

    return res.json({
      message: 'Stock restocked',
      movement: { type: 'restock', quantity },
      product
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to restock product' });
  }
};