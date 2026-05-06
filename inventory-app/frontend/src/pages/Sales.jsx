import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ShoppingCart, Info, Activity, ArrowUp, ArrowDown } from 'lucide-react';

const Sales = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [saleQtyByProduct, setSaleQtyByProduct] = useState({});
  const [restockQtyByProduct, setRestockQtyByProduct] = useState({});

  const fetchProducts = async () => {
    try {
      const res = await api.get('/inventory');
      setProducts(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleRecordSale = async (product) => {
    const productId = product._id;
    setUpdatingId(productId);

    try {
      const qty = Number(saleQtyByProduct[productId]);

      if (!Number.isFinite(qty) || qty <= 0) {
        alert('Enter a valid sold quantity greater than 0.');
        setUpdatingId(null);
        return;
      }

      await api.post(`/inventory/${productId}/record-sale`, {
        quantity: Math.floor(qty)
      });

      alert(`Sale recorded for ${product.name}. Stock was reduced.`);
      setSaleQtyByProduct((current) => ({ ...current, [productId]: '' }));
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to record sale.');
    }

    setUpdatingId(null);
  };

  const handleRestock = async (product) => {
    const productId = product._id;
    setUpdatingId(productId);

    try {
      const qty = Number(restockQtyByProduct[productId]);

      if (!Number.isFinite(qty) || qty <= 0) {
        alert('Enter a valid restock quantity greater than 0.');
        setUpdatingId(null);
        return;
      }

      await api.post(`/inventory/${productId}/restock`, {
        quantity: Math.floor(qty)
      });

      alert(`Stock increased for ${product.name}.`);
      setRestockQtyByProduct((current) => ({ ...current, [productId]: '' }));
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to restock product.');
    }

    setUpdatingId(null);
  };

  return (
    <div className="space-y-6 p-1 md:p-2">
      <section className="reveal-up rounded-3xl bg-gradient-to-br from-[#112b44] via-[#1b6499] to-[#f39b67] text-white p-6 md:p-8 shadow-2xl shadow-[#114168]/35">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/75">Stock Movement</p>
            <h1 className="text-3xl md:text-4xl font-bold mt-2">Demand Data Console</h1>
            <p className="mt-3 text-white/80 max-w-2xl">Track stock movement correctly: restock adds units, sale deducts units.</p>
          </div>
          <div className="rounded-xl border border-white/25 bg-white/10 px-4 py-3">
            <p className="text-xs text-white/70">Products tracked</p>
            <p className="text-2xl font-bold">{products.length}</p>
          </div>
        </div>
      </section>

      <div className="reveal-up-delay-1 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-center">
          <ShoppingCart className="text-[#1167b1]" size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Stock Transactions</h2>
          <p className="text-sm text-slate-500">Record purchase and sales movements per SKU.</p>
        </div>
      </div>

      <div className="reveal-up-delay-1 bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 items-start text-[#1167b1]">
        <Info size={20} className="mt-1 flex-shrink-0" />
        <p className="text-sm">
          Use Restock when you buy inventory, and Record Sale when you sell inventory. This keeps stock deduction accurate.
        </p>
      </div>

      <div className="reveal-up-delay-2 soft-card rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-100/70 border-b border-slate-200">
            <tr>
              <th className="p-4 font-semibold text-slate-600">Product</th>
              <th className="p-4 font-semibold text-slate-600">Stock</th>
              <th className="p-4 font-semibold text-slate-600">Restock (+)</th>
              <th className="p-4 font-semibold text-slate-600">Sale (-)</th>
              <th className="p-4 font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="p-10 text-center text-slate-500">Loading products...</td>
              </tr>
            ) : products.map((product) => (
              <tr key={product._id} className="border-b border-slate-100 transition hover:bg-white/80">
                <td className="p-4">
                  <p className="font-bold text-slate-800">{product.name}</p>
                  <p className="text-xs text-slate-400">{product.category}</p>
                </td>
                <td className="p-4">
                  <div className="inline-flex items-center gap-1.5 font-mono text-[#1167b1] font-bold">
                    <Activity size={14} /> {product.currentStock}
                  </div>
                </td>
                <td className="p-4">
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    className="field-input"
                    value={restockQtyByProduct[product._id] ?? ''}
                    onChange={(e) => setRestockQtyByProduct({ ...restockQtyByProduct, [product._id]: e.target.value })}
                  />
                </td>
                <td className="p-4">
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    className="field-input"
                    value={saleQtyByProduct[product._id] ?? ''}
                    onChange={(e) => setSaleQtyByProduct({ ...saleQtyByProduct, [product._id]: e.target.value })}
                  />
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleRestock(product)}
                      disabled={updatingId === product._id}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                    >
                      <ArrowUp size={15} /> Restock
                    </button>
                    <button
                      onClick={() => handleRecordSale(product)}
                      disabled={updatingId === product._id}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-60"
                    >
                      <ArrowDown size={15} />
                      {updatingId === product._id ? 'Saving...' : 'Record Sale'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Sales;