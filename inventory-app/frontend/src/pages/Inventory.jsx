import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import {
  Package,
  Search,
  Trash2,
  Edit,
  X,
  Boxes,
  AlertTriangle,
  Activity,
  Upload,
  Camera,
  Download,
  ScanLine,
  CheckCircle2
} from 'lucide-react';
import * as XLSX from 'xlsx';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editProductId, setEditProductId] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [editForm, setEditForm] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: '',
    price: '',
    costPrice: '',
    currentStock: '',
    minStockLevel: ''
  });
  const [showImportModal, setShowImportModal] = useState(false);
  const [importRows, setImportRows] = useState([]);
  const [importPreview, setImportPreview] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importReport, setImportReport] = useState(null);
  const [importError, setImportError] = useState('');

  const [showScanModal, setShowScanModal] = useState(false);
  const [scannerStatus, setScannerStatus] = useState('Camera will initialize when modal opens.');
  const [manualBarcode, setManualBarcode] = useState('');
  const [scanQty, setScanQty] = useState(1);
  const [scanProduct, setScanProduct] = useState(null);
  const [scanLookupMessage, setScanLookupMessage] = useState('');
  const [scanSaving, setScanSaving] = useState(false);
  const [newBarcodeProduct, setNewBarcodeProduct] = useState({
    name: '',
    price: '',
    costPrice: '',
    category: '',
    sku: ''
  });
  const scannerRef = useRef(null);
  const scanHandledRef = useRef(false);
  const scannerRunningRef = useRef(false);
  const scannerInitializingRef = useRef(false);

  const formatINR = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const fetchInventory = async () => {
    try {
      const res = await api.get('/inventory');
      setProducts(res.data);
      setSelectedProductIds([]);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching inventory', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    if (!showScanModal) return undefined;

    let localScanner = null;
    let isMounted = true;

    const safeStopScanner = async () => {
      if (!localScanner || !scannerRunningRef.current) return;
      try {
        await localScanner.stop();
      } catch (err) {
        // Ignore stop errors when the camera stream is already closed externally.
      } finally {
        scannerRunningRef.current = false;
      }
    };

    const startScanner = async () => {
      if (scannerInitializingRef.current || scannerRunningRef.current) return;
      scannerInitializingRef.current = true;
      try {
        setScannerStatus('Initializing camera...');
        const module = await import('html5-qrcode');
        const Html5Qrcode = module.Html5Qrcode;
        const scanner = new Html5Qrcode('inventory-barcode-reader');
        localScanner = scanner;
        scannerRef.current = scanner;

        const cameras = await Html5Qrcode.getCameras();
        if (!cameras.length) {
          setScannerStatus('No camera found. Use manual barcode input below.');
          scannerInitializingRef.current = false;
          return;
        }

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 15, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (!isMounted || scanHandledRef.current) return;
            scanHandledRef.current = true;
            setManualBarcode(decodedText);
            setScannerStatus(`Scanned code: ${decodedText}`);
            safeStopScanner();
          },
          () => null
        );

        scannerRunningRef.current = true;
        scannerInitializingRef.current = false;

        if (isMounted) {
          setScannerStatus('Camera active. Point it at barcode or QR code.');
        }
      } catch (err) {
        scannerRunningRef.current = false;
        scannerInitializingRef.current = false;
        if (isMounted) {
          setScannerStatus('Camera access failed. Use manual barcode input.');
        }
      }
    };

    setTimeout(() => {
      if (isMounted) startScanner();
    }, 100);

    return () => {
      isMounted = false;
      scanHandledRef.current = false;
      safeStopScanner();
      scannerRef.current = null;
    };
  }, [showScanModal]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/inventory/${id}`);
        setProducts(products.filter(p => p._id !== id));
        setSelectedProductIds((current) => current.filter((productId) => productId !== id));
      } catch (err) {
        alert('Failed to delete product');
      }
    }
  };

  const openEditModal = (product) => {
    setEditProductId(product._id);
    setEditError('');
    setEditForm({
      name: product.name || '',
      sku: product.sku || '',
      barcode: product.barcode || '',
      category: product.category || 'General',
      price: product.price ?? '',
      costPrice: product.costPrice ?? '',
      currentStock: product.currentStock ?? '',
      minStockLevel: product.minStockLevel ?? ''
    });
    setShowEditModal(true);
  };

  const handleEditChange = (field, value) => {
    setEditForm((current) => ({
      ...current,
      [field]: value
    }));
  };

  const handleEditSave = async () => {
    if (!editProductId) return;

    try {
      setEditSaving(true);
      setEditError('');

      const payload = {
        name: editForm.name.trim(),
        sku: editForm.sku.trim(),
        barcode: editForm.barcode.trim(),
        category: editForm.category.trim() || 'General',
        price: Number(editForm.price),
        costPrice: Number(editForm.costPrice),
        currentStock: Number(editForm.currentStock),
        minStockLevel: editForm.minStockLevel === '' ? undefined : Number(editForm.minStockLevel)
      };

      if (!payload.name || !Number.isFinite(payload.price) || !Number.isFinite(payload.currentStock)) {
        setEditError('Name, price, and stock are required.');
        return;
      }

      await api.put(`/inventory/${editProductId}`, payload);
      await fetchInventory();
      setShowEditModal(false);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Update failed.');
    } finally {
      setEditSaving(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const search = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(search) ||
      product.category.toLowerCase().includes(search) ||
      product.sku?.toLowerCase().includes(search) ||
      product.barcode?.toLowerCase().includes(search)
    );
  });

  const toggleProductSelection = (productId) => {
    setSelectedProductIds((current) => (
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId]
    ));
  };

  const allVisibleSelected = filteredProducts.length > 0 && filteredProducts.every((product) => selectedProductIds.includes(product._id));
  const selectedCount = selectedProductIds.length;

  const toggleSelectAllVisible = () => {
    const visibleIds = filteredProducts.map((product) => product._id);

    setSelectedProductIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !visibleIds.includes(id));
      }

      return Array.from(new Set([...current, ...visibleIds]));
    });
  };

  const handleBulkDelete = async () => {
    if (!selectedProductIds.length) return;

    const confirmed = window.confirm(`Delete ${selectedProductIds.length} selected product${selectedProductIds.length === 1 ? '' : 's'}? This cannot be undone.`);
    if (!confirmed) return;

    try {
      setBulkDeleting(true);
      await api.post('/inventory/bulk-delete', { ids: selectedProductIds });
      await fetchInventory();
    } catch (err) {
      alert(err.response?.data?.message || 'Bulk delete failed');
    } finally {
      setBulkDeleting(false);
    }
  };

  const lowStockCount = products.filter((p) => p.currentStock <= (p.minStockLevel || 10)).length;
  const totalValue = products.reduce((acc, p) => acc + (p.price * p.currentStock), 0);

  const resetImportState = () => {
    setImportRows([]);
    setImportPreview([]);
    setImportError('');
    setImportReport(null);
  };

  const normalizeHeaders = (key) => String(key || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  const mapRow = (raw) => {
    const entry = {};
    Object.keys(raw).forEach((key) => {
      entry[normalizeHeaders(key)] = raw[key];
    });

    const mapped = {
      name: entry.name || entry.product || entry.productname || entry.itemname || '',
      sku: entry.sku || '',
      barcode: entry.barcode || entry.qrcode || entry.code || '',
      quantity: entry.quantity ?? entry.currentstock ?? entry.stock ?? entry.units ?? 0,
      price: entry.price ?? entry.sellingprice ?? entry.saleprice ?? 0,
      costPrice: entry.costprice ?? entry.purchaseprice ?? entry.cost ?? 0,
      category: entry.category || entry.type || entry.group || 'General'
    };

    return {
      ...mapped,
      quantity: Number(mapped.quantity) || 0,
      price: Number(mapped.price),
      costPrice: Number(mapped.costPrice) || 0,
      name: String(mapped.name).trim(),
      sku: String(mapped.sku).trim(),
      barcode: String(mapped.barcode).trim(),
      category: String(mapped.category).trim() || 'General'
    };
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImportError('');
      setImportReport(null);

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const parsedRows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

      const mappedRows = parsedRows
        .map(mapRow)
        .filter((row) => row.name || row.sku || row.barcode);

      if (!mappedRows.length) {
        setImportError('No valid rows found. Please use the template format.');
        return;
      }

      setImportRows(mappedRows);
      setImportPreview(mappedRows.slice(0, 6));
    } catch (err) {
      setImportError('Could not parse file. Upload .csv, .xls, or .xlsx format.');
    }
  };

  const handleDownloadTemplate = () => {
    const template = [
      'name,sku,barcode,quantity,price,costPrice,category',
      'Wireless Mouse,SKU-WM-1001,8901234567890,25,799,500,Electronics',
      'Bluetooth Speaker,SKU-BS-1015,8909876543212,12,2499,1700,Audio'
    ].join('\n');

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'inventory-import-template.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleBulkImport = async () => {
    if (!importRows.length) {
      setImportError('Please upload a file with product rows first.');
      return;
    }

    try {
      setImporting(true);
      setImportError('');
      const payloadRows = importRows.map((row) => ({
        name: row.name,
        sku: row.sku,
        barcode: row.barcode,
        quantity: row.quantity,
        price: row.price,
        costPrice: row.costPrice,
        category: row.category
      }));
      const response = await api.post('/inventory/bulk-import', {
        rows: payloadRows,
        mode: 'mergeStock'
      });
      setImportReport(response.data);
      await fetchInventory();
    } catch (err) {
      setImportError(err.response?.data?.message || 'Import failed.');
    } finally {
      setImporting(false);
    }
  };

  const openScanModal = () => {
    setShowScanModal(true);
    setScanProduct(null);
    setManualBarcode('');
    setScanLookupMessage('');
    setScanQty(1);
    setNewBarcodeProduct({ name: '', price: '', costPrice: '', category: '', sku: '' });
  };

  const handleBarcodeLookup = async () => {
    const code = manualBarcode.trim();
    if (!code) {
      setScanLookupMessage('Enter or scan a barcode first.');
      return;
    }

    try {
      const response = await api.get(`/inventory/barcode/${encodeURIComponent(code)}`);
      setScanProduct(response.data);
      setScanLookupMessage('Product found. Update quantity to add stock.');
      setNewBarcodeProduct({
        name: response.data.name || '',
        price: response.data.price || '',
        costPrice: response.data.costPrice || '',
        category: response.data.category || '',
        sku: response.data.sku || ''
      });
    } catch (err) {
      setScanProduct(null);
      setScanLookupMessage('No product found. Fill details below to create one.');
    }
  };

  const handleBarcodeUpsert = async () => {
    const code = manualBarcode.trim();
    if (!code) {
      setScanLookupMessage('Barcode is required.');
      return;
    }

    try {
      setScanSaving(true);
      const payload = {
        barcode: code,
        quantity: Number(scanQty) || 1,
        mergeStock: true,
        name: newBarcodeProduct.name,
        price: newBarcodeProduct.price,
        costPrice: newBarcodeProduct.costPrice,
        category: newBarcodeProduct.category,
        sku: newBarcodeProduct.sku
      };

      const response = await api.post('/inventory/barcode/upsert', payload);
      setScanLookupMessage(response.data.action === 'created' ? 'Product created and stock added.' : 'Stock updated successfully.');
      await fetchInventory();
    } catch (err) {
      setScanLookupMessage(err.response?.data?.message || 'Save failed for barcode flow.');
    } finally {
      setScanSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-1 md:p-2">
      <section className="reveal-up rounded-3xl bg-gradient-to-br from-[#0f2d45] via-[#1a5f95] to-[#ff7a59] p-6 md:p-8 text-white shadow-2xl shadow-[#113e63]/35">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/75">Inventory</p>
            <h1 className="text-3xl md:text-4xl font-bold mt-2">Stock Intelligence Grid</h1>
            <p className="text-white/80 mt-3 max-w-xl">
              Scan all products, prioritize critical rows, and take immediate actions without losing context.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 w-full lg:w-auto">
            <div className="rounded-xl bg-white/15 border border-white/20 p-3 min-w-[120px]">
              <p className="text-xs text-white/70">SKUs</p>
              <p className="text-2xl font-bold mt-1">{products.length}</p>
            </div>
            <div className="rounded-xl bg-white/15 border border-white/20 p-3 min-w-[120px]">
              <p className="text-xs text-white/70">Low stock</p>
              <p className="text-2xl font-bold mt-1">{lowStockCount}</p>
            </div>
            <div className="rounded-xl bg-white/15 border border-white/20 p-3 min-w-[140px]">
              <p className="text-xs text-white/70">Inventory value</p>
              <p className="text-lg font-bold mt-1">{formatINR(totalValue)}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="reveal-up-delay-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-slate-700">
          <span className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm"><Boxes size={18} /></span>
          <div>
            <h2 className="text-xl font-bold">Product Inventory</h2>
            <p className="text-sm text-slate-500">Search and manage catalog-level stock health.</p>
          </div>
        </div>

        <div className="flex w-full md:w-auto flex-col md:flex-row gap-2">
          <button
            onClick={handleBulkDelete}
            disabled={!selectedCount || bulkDeleting}
            className="px-4 py-2.5 rounded-xl inline-flex items-center gap-2 font-semibold border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 size={16} />
            {bulkDeleting ? 'Deleting...' : `Delete Selected${selectedCount ? ` (${selectedCount})` : ''}`}
          </button>
          <button
            onClick={() => {
              resetImportState();
              setShowImportModal(true);
            }}
            className="action-btn px-4 py-2.5 rounded-xl inline-flex items-center gap-2"
          >
            <Upload size={16} /> Import Excel/CSV
          </button>
          <button
            onClick={openScanModal}
            className="bg-slate-900 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-slate-800 transition inline-flex items-center gap-2"
          >
            <Camera size={16} /> Scan Barcode
          </button>
          <div className="relative w-full md:w-[430px]">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, category, SKU, or barcode..."
              className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1167b1]/25 focus:border-[#1167b1] outline-none bg-white transition shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="reveal-up-delay-2 soft-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100/75 border-b border-slate-200">
              <tr>
                <th className="p-4 font-semibold text-slate-600 text-center w-12">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAllVisible}
                    className="h-4 w-4 rounded border-slate-300 text-[#1167b1] focus:ring-[#1167b1]"
                    aria-label="Select all visible products"
                  />
                </th>
                <th className="p-4 font-semibold text-slate-600">Product Info</th>
                <th className="p-4 font-semibold text-slate-600">Category</th>
                <th className="p-4 font-semibold text-slate-600">Price</th>
                <th className="p-4 font-semibold text-slate-700">Stock Signal</th>
                <th className="p-4 font-semibold text-slate-600 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-slate-400">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-5 h-5 border-2 border-[#1167b1] border-t-transparent rounded-full animate-spin"></div>
                      Loading inventory...
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr key={product._id} className="border-b border-slate-100 hover:bg-white transition-colors">
                    <td className="p-4 text-center align-middle">
                      <input
                        type="checkbox"
                        checked={selectedProductIds.includes(product._id)}
                        onChange={() => toggleProductSelection(product._id)}
                        className="h-4 w-4 rounded border-slate-300 text-[#1167b1] focus:ring-[#1167b1]"
                        aria-label={`Select ${product.name}`}
                      />
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">{product.name}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">{product.sku}</div>
                      {product.barcode && <div className="text-[10px] text-slate-400 font-mono">{product.barcode}</div>}
                    </td>
                    <td className="p-4">
                      <span className="px-3 py-1 bg-sky-50 text-sky-700 rounded-full text-xs font-semibold">
                        {product.category}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-700">{formatINR(product.price)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-xs md:text-sm">
                        <span className={`w-2.5 h-2.5 rounded-full ${product.currentStock < 10 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                        <span className={`font-bold ${product.currentStock < 10 ? 'text-red-600' : 'text-slate-700'}`}>
                          {product.currentStock} Units
                        </span>
                        {product.currentStock < 10 ? <AlertTriangle size={14} className="text-red-500" /> : <Activity size={14} className="text-emerald-500" />}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-2 text-slate-400 hover:text-[#1167b1] hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(product._id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-20 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <Package size={48} className="text-slate-200" />
                      <p className="text-lg font-medium">No results found for "{searchTerm}"</p>
                      <button 
                        onClick={() => setSearchTerm('')}
                        className="text-[#1167b1] hover:underline text-sm font-semibold"
                      >
                        Clear search
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="soft-card rounded-2xl w-full max-w-3xl p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Edit Product</h3>
                <p className="text-sm text-slate-500 mt-1">Update the product details and stock level.</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {editError && <p className="text-sm text-red-600 mb-4">{editError}</p>}

            <div className="grid md:grid-cols-2 gap-4">
              <label className="space-y-1">
                <span className="text-sm font-semibold text-slate-600">Name</span>
                <input
                  type="text"
                  className="field-input w-full"
                  value={editForm.name}
                  onChange={(e) => handleEditChange('name', e.target.value)}
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-semibold text-slate-600">SKU</span>
                <input
                  type="text"
                  className="field-input w-full"
                  value={editForm.sku}
                  onChange={(e) => handleEditChange('sku', e.target.value)}
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-semibold text-slate-600">Barcode</span>
                <input
                  type="text"
                  className="field-input w-full"
                  value={editForm.barcode}
                  onChange={(e) => handleEditChange('barcode', e.target.value)}
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-semibold text-slate-600">Category</span>
                <input
                  type="text"
                  className="field-input w-full"
                  value={editForm.category}
                  onChange={(e) => handleEditChange('category', e.target.value)}
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-semibold text-slate-600">Price</span>
                <input
                  type="number"
                  min="0"
                  className="field-input w-full"
                  value={editForm.price}
                  onChange={(e) => handleEditChange('price', e.target.value)}
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-semibold text-slate-600">Cost Price</span>
                <input
                  type="number"
                  min="0"
                  className="field-input w-full"
                  value={editForm.costPrice}
                  onChange={(e) => handleEditChange('costPrice', e.target.value)}
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-semibold text-slate-600">Current Stock</span>
                <input
                  type="number"
                  min="0"
                  className="field-input w-full"
                  value={editForm.currentStock}
                  onChange={(e) => handleEditChange('currentStock', e.target.value)}
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-semibold text-slate-600">Min Stock Level</span>
                <input
                  type="number"
                  min="0"
                  className="field-input w-full"
                  value={editForm.minStockLevel}
                  onChange={(e) => handleEditChange('minStockLevel', e.target.value)}
                />
              </label>
            </div>

            <div className="flex gap-2 pt-6">
              <button
                type="button"
                onClick={handleEditSave}
                disabled={editSaving}
                className="action-btn flex-1 py-2.5 disabled:opacity-60"
              >
                {editSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-semibold hover:bg-slate-200 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="soft-card rounded-2xl w-full max-w-3xl p-6 md:p-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Bulk Import Products</h3>
                <p className="text-sm text-slate-500 mt-1">Upload Excel/CSV and import many products in one go.</p>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-wrap gap-3 mb-4">
              <label className="action-btn px-4 py-2.5 rounded-xl inline-flex items-center gap-2 cursor-pointer">
                <Upload size={16} /> Upload File
                <input type="file" accept=".csv,.xls,.xlsx" className="hidden" onChange={handleImportFile} />
              </label>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl font-semibold hover:bg-slate-200 transition inline-flex items-center gap-2"
              >
                <Download size={16} /> Download Template
              </button>
            </div>

            {importError && <p className="text-sm text-red-600 mb-3">{importError}</p>}

            {importPreview.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
                <div className="px-4 py-2 bg-slate-100 text-xs font-semibold text-slate-600 uppercase tracking-[0.12em]">
                  Preview ({importRows.length} rows detected)
                </div>
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-sm">
                    <thead className="bg-white border-b border-slate-200 text-slate-500">
                      <tr>
                        <th className="px-3 py-2 text-left">Name</th>
                        <th className="px-3 py-2 text-left">SKU</th>
                        <th className="px-3 py-2 text-left">Barcode</th>
                        <th className="px-3 py-2 text-left">Qty</th>
                        <th className="px-3 py-2 text-left">Price</th>
                        <th className="px-3 py-2 text-left">Cost</th>
                        <th className="px-3 py-2 text-left">Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.map((row, index) => (
                        <tr key={`${row.sku}-${index}`} className="border-b border-slate-100">
                          <td className="px-3 py-2">{row.name}</td>
                          <td className="px-3 py-2 font-mono text-xs">{row.sku || 'Auto'}</td>
                          <td className="px-3 py-2 font-mono text-xs">{row.barcode || '-'}</td>
                          <td className="px-3 py-2">{row.quantity}</td>
                          <td className="px-3 py-2">{row.price}</td>
                          <td className="px-3 py-2">{row.costPrice}</td>
                          <td className="px-3 py-2">{row.category}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {importReport && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4 text-sm text-emerald-900">
                <p className="font-semibold mb-1 inline-flex items-center gap-2"><CheckCircle2 size={16} /> Import complete</p>
                <p>Total: {importReport.totalRows} | Created: {importReport.created} | Updated: {importReport.updated} | Skipped: {importReport.skipped} | Failed: {importReport.failed}</p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleBulkImport}
                disabled={importing || !importRows.length}
                className="action-btn flex-1 py-2.5 disabled:opacity-60"
              >
                {importing ? 'Importing...' : 'Run Import'}
              </button>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-semibold hover:bg-slate-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showScanModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="soft-card rounded-2xl w-full max-w-2xl p-6 md:p-8">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Scan Barcode / QR</h3>
                <p className="text-sm text-slate-500 mt-1">Scan once, then add quantity to update stock.</p>
              </div>
              <button
                onClick={() => setShowScanModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3 mb-3">
              <div id="inventory-barcode-reader" className="min-h-[200px]" />
              <p className="mt-2 text-xs text-slate-500">{scannerStatus}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-3 mb-3">
              <input
                type="text"
                placeholder="Barcode value"
                className="field-input md:col-span-2"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
              />
              <button
                type="button"
                onClick={handleBarcodeLookup}
                className="bg-slate-900 text-white rounded-xl px-4 py-2.5 font-semibold hover:bg-slate-800 transition inline-flex items-center justify-center gap-2"
              >
                <ScanLine size={16} /> Find
              </button>
            </div>

            {scanLookupMessage && <p className="text-sm text-slate-600 mb-3">{scanLookupMessage}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <input
                type="text"
                placeholder="Product name"
                className="field-input"
                value={newBarcodeProduct.name}
                onChange={(e) => setNewBarcodeProduct({ ...newBarcodeProduct, name: e.target.value })}
              />
              <input
                type="text"
                placeholder="SKU (optional)"
                className="field-input"
                value={newBarcodeProduct.sku}
                onChange={(e) => setNewBarcodeProduct({ ...newBarcodeProduct, sku: e.target.value })}
              />
              <input
                type="number"
                placeholder="Selling price"
                className="field-input"
                value={newBarcodeProduct.price}
                onChange={(e) => setNewBarcodeProduct({ ...newBarcodeProduct, price: e.target.value })}
              />
              <input
                type="number"
                placeholder="Cost price"
                className="field-input"
                value={newBarcodeProduct.costPrice}
                onChange={(e) => setNewBarcodeProduct({ ...newBarcodeProduct, costPrice: e.target.value })}
              />
              <input
                type="text"
                placeholder="Category"
                className="field-input"
                value={newBarcodeProduct.category}
                onChange={(e) => setNewBarcodeProduct({ ...newBarcodeProduct, category: e.target.value })}
              />
              <input
                type="number"
                min="1"
                placeholder="Quantity to add"
                className="field-input"
                value={scanQty}
                onChange={(e) => setScanQty(e.target.value)}
              />
            </div>

            {scanProduct && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-3 text-sm text-slate-700">
                Existing product: <span className="font-semibold">{scanProduct.name}</span> ({scanProduct.currentStock} in stock)
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleBarcodeUpsert}
                disabled={scanSaving}
                className="action-btn flex-1 py-2.5 disabled:opacity-60"
              >
                {scanSaving ? 'Saving...' : 'Save Barcode Entry'}
              </button>
              <button
                type="button"
                onClick={() => setShowScanModal(false)}
                className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-semibold hover:bg-slate-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;