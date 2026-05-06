import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Package, AlertTriangle, IndianRupee, TrendingUp, CircleAlert, Clock3, Activity } from 'lucide-react';
import AIInsightsWidget from '../components/AIInsightsWidget';

const formatINR = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const StatBox = ({ title, value, icon, color, helper }) => (
  <div className="glass-card p-5 md:p-6 rounded-[24px] flex items-center justify-between group cursor-default relative overflow-hidden">
    <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none transition-all duration-500 group-hover:scale-150 group-hover:opacity-40" style={{ backgroundColor: color.replace('bg-', '') }}></div>
    
    <div className="min-w-0 flex-1 pr-3 relative z-10">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] truncate">{title}</p>
      <h3 className="text-xl md:text-2xl lg:text-3xl font-black mt-1.5 text-slate-800 dark:text-slate-100 drop-shadow-sm transition-all duration-300 group-hover:text-slate-900 dark:text-white break-words leading-tight" title={value}>{value}</h3>
      {helper && <p className="text-[10px] md:text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium break-words leading-tight" title={helper}>{helper}</p>}
    </div>
    <div className={`flex-shrink-0 relative z-10 p-4 rounded-[20px] ${color} bg-opacity-[0.08] shadow-sm border border-${color.replace('bg-', '')}/20 transition-all duration-500 group-hover:bg-opacity-[0.15]`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-[20px] pointer-events-none"></div>
      <div className="relative animate-float-subtle group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300 drop-shadow-sm">
        {icon}
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newProduct, setNewProduct] = useState({ name: '', quantity: '', price: '', costPrice: '', category: '' });

  const fetchInventory = async () => {
    try {
      const res = await api.get('/inventory');
      setProducts(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Fetch error:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: newProduct.name,
        sku: `SKU-${Date.now()}`,
        currentStock: Number(newProduct.quantity),
        price: Number(newProduct.price),
        costPrice: Number(newProduct.costPrice),
        category: newProduct.category,
        salesHistory: [0, 0, 0, 0, 0]
      };

      await api.post('/inventory', payload);
      setShowModal(false);
      setNewProduct({ name: '', quantity: '', price: '', costPrice: '', category: '' });
      fetchInventory();
    } catch (err) {
      alert('Failed to add product');
    }
  };

  const urgentProducts = products.filter((p) => p.urgent || p.currentStock <= p.minStockLevel);
  const stableProducts = products.filter((p) => !p.urgent).length;
  const healthScore = products.length ? Math.round((stableProducts / products.length) * 100) : 0;
  const totalValue = products.reduce((acc, p) => acc + (Number(p.price) || 0) * (Number(p.currentStock) || 0), 0);
  const estimatedProfit = products.reduce((acc, p) => acc + (Number(p.estimatedProfit) || 0), 0);

  const topExposure = [...products]
    .sort((a, b) => (a.daysUntilOut || 999) - (b.daysUntilOut || 999))
    .slice(0, 4);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <section className="relative rounded-3xl p-6 md:p-8 text-white shadow-2xl shadow-[#14446a]/20 overflow-hidden auth-mesh auth-noise border border-white/10 reveal-up">
        <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#ffb199] font-bold drop-shadow-sm">{getGreeting()}!</p>
            <h1 className="text-3xl md:text-4xl font-black mt-1 drop-shadow-md tracking-tight">Inventory Mission Control</h1>
            <p className="mt-3 text-white/80 max-w-2xl font-medium leading-relaxed text-sm md:text-base">
              Focus on stock pressure, track value concentration, and resolve upcoming shortages before they impact sales.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="rounded-xl px-4 py-2.5 font-bold bg-white text-[#0f2c45] hover:bg-slate-100 transition shadow-lg hover:shadow-xl hover:-translate-y-0.5 duration-300"
            >
              + Add Product
            </button>
            <div className="rounded-xl px-4 py-2.5 border border-white/20 bg-white/10 backdrop-blur-md shadow-inner">
              <p className="text-[10px] uppercase tracking-wider text-white/70 font-bold">Health Score</p>
              <p className="font-black text-xl drop-shadow-sm">{healthScore}%</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-5">
        <StatBox
          title="Total Items"
          value={products.length}
          helper="Active SKUs"
          icon={<Package size={24} className="text-[#1167b1]" />}
          color="bg-blue-500"
        />
        <StatBox
          title="Low Stock"
          value={urgentProducts.length}
          helper="Need restock attention"
          icon={<AlertTriangle size={24} className="text-red-500" />}
          color="bg-red-500"
        />
        <StatBox
          title="Total Value"
          value={formatINR(totalValue)}
          helper="Inventory valuation"
          icon={<IndianRupee size={24} className="text-emerald-500" />}
          color="bg-emerald-500"
        />
        <StatBox
          title="Est. Profit"
          value={formatINR(estimatedProfit)}
          helper="From stock on hand"
          icon={<TrendingUp size={24} className="text-teal-500" />}
          color="bg-teal-500"
        />
        <StatBox
          title="Velocity"
          value={`${products.reduce((acc, p) => acc + Number(p.calculatedAvgUsage || 0), 0).toFixed(1)}`}
          helper="Units/day combined"
          icon={<Activity size={24} className="text-orange-500" />}
          color="bg-orange-500"
        />
      </div>

      <div className="reveal-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
        <AIInsightsWidget />
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-3 gap-6 reveal-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
        <div className="2xl:col-span-2 glass-card rounded-3xl overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700/50 flex items-center justify-between bg-white/40">
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">Live Inventory Table</h2>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-bold">Real-time</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-4 font-semibold text-slate-700 dark:text-slate-200">Product</th>
                  <th className="p-4 font-semibold text-slate-700 dark:text-slate-200">Category</th>
                  <th className="p-4 font-semibold text-slate-700 dark:text-slate-200">Stock</th>
                  <th className="p-4 font-semibold text-slate-700 dark:text-slate-200">Forecast</th>
                  <th className="p-4 font-semibold text-slate-700 dark:text-slate-200">Value</th>
                  <th className="p-4 font-semibold text-slate-700 dark:text-slate-200">Profit</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  // Skeleton Loader
                  Array.from({ length: 4 }).map((_, idx) => (
                    <tr key={idx} className="border-b border-slate-100 dark:border-slate-800/50 animate-pulse">
                      <td className="p-4"><div className="h-4 w-32 bg-slate-200 rounded-md"></div></td>
                      <td className="p-4"><div className="h-4 w-20 bg-slate-200 rounded-md"></div></td>
                      <td className="p-4"><div className="h-4 w-16 bg-slate-200 rounded-md"></div></td>
                      <td className="p-4"><div className="h-5 w-16 bg-slate-200 rounded-full"></div></td>
                      <td className="p-4"><div className="h-4 w-24 bg-slate-200 rounded-md"></div></td>
                      <td className="p-4"><div className="h-4 w-24 bg-slate-200 rounded-md"></div></td>
                    </tr>
                  ))
                ) : products.length > 0 ? (
                  products.map((product) => (
                    <tr key={product._id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition">
                      <td className="p-4 text-slate-900 dark:text-white font-semibold">{product.name}</td>
                      <td className="p-4 text-slate-600">{product.category}</td>
                      <td className="p-4">
                        <span className={`font-bold ${product.currentStock <= product.minStockLevel ? 'text-[var(--danger)]' : 'text-[var(--brand)]'}`}>
                          {product.currentStock} units
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${product.urgent ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {product.forecastAction || 'Stable'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-700 dark:text-slate-200">{formatINR((Number(product.price) || 0) * (Number(product.currentStock) || 0))}</td>
                      <td className={`p-4 font-semibold ${(Number(product.estimatedProfit) || 0) >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                        {Number(product.costPrice) > 0 ? formatINR(product.estimatedProfit || 0) : 'Set cost'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-12 text-center text-slate-400 italic">No products found. Add your first item.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-card rounded-3xl p-6">
            <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
              <div className="p-1.5 rounded-lg bg-red-50 text-red-500">
                <CircleAlert size={16} />
              </div>
              Priority Queue
            </h3>
            <div className="mt-4 space-y-3">
              {topExposure.length ? topExposure.map((product) => (
                <div key={product._id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-3">
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{product.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{product.forecastAction || 'Stable stock'}</p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Days left</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{product.daysUntilOut ?? 999}</span>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">No items at risk right now.</p>
              )}
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6 bg-gradient-to-br from-white/60 to-orange-50/40 dark:from-slate-800/60 dark:to-slate-800/40 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-orange-100 dark:bg-orange-500/20 rounded-full blur-2xl opacity-60 pointer-events-none"></div>
            <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2 relative z-10 tracking-tight">
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-500">
                <Clock3 size={16} />
              </div>
              Demand Rhythm
            </h3>
            <p className="text-sm text-slate-600 mt-2">
              Keep sales history updated daily to improve forecast confidence and reduce overstock.
            </p>
            <div className="mt-4 h-2 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#1167b1] to-[#ff7a59]"
                style={{ width: `${Math.min(100, Math.max(10, healthScore))}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Operational readiness {healthScore}%</p>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="glass-card rounded-[24px] p-8 max-w-md w-full animate-in zoom-in-95 duration-300 shadow-2xl border border-white">
            <h2 className="text-2xl font-black mb-1.5 text-slate-800 tracking-tight">Add New Product</h2>
            <p className="text-xs text-slate-500 mb-6 font-medium">Fill product details to start tracking demand and risk.</p>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                <input
                  type="text"
                  placeholder="e.g. Wireless Mouse"
                  className="field-input"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    placeholder="0"
                    className="field-input"
                    value={newProduct.quantity}
                    onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Price (Rs)</label>
                  <input
                    type="number"
                    placeholder="0"
                    className="field-input"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cost Price (Rs)</label>
                <input
                  type="number"
                  placeholder="0"
                  className="field-input"
                  value={newProduct.costPrice}
                  onChange={(e) => setNewProduct({ ...newProduct, costPrice: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <input
                  type="text"
                  placeholder="e.g. Electronics"
                  className="field-input"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 action-btn py-2.5">Save Product</button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-semibold hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
