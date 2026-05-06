import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { TrendingUp, Calendar, AlertTriangle, Loader2, ShieldAlert, Gauge, LineChart } from 'lucide-react';

const Analytics = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/inventory');
        setProducts(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="animate-spin text-[#1167b1]" size={40} />
    </div>
  );

  const atRisk = products.filter(p => p.daysUntilOut < 7 || p.currentStock <= p.minStockLevel);
  const stable = products.filter(p => !p.urgent);
  const velocityScore = products.reduce((acc, p) => acc + Number(p.calculatedAvgUsage || 0), 0).toFixed(1);
  const estimatedProfit = products.reduce((acc, p) => acc + Number(p.estimatedProfit || 0), 0);
  const chartProducts = [...products]
    .sort((a, b) => (Number(b.currentStock) || 0) - (Number(a.currentStock) || 0))
    .slice(0, 6)
    .map((product) => ({
      ...product,
      currentStock: Number(product.currentStock) || 0,
      minStockLevel: Number(product.minStockLevel) || 0,
    }));

  const chartMax = Math.max(
    10,
    ...chartProducts.map((product) => Math.max(product.currentStock, product.minStockLevel, 1))
  );

  return (
    <div className="space-y-6 md:space-y-8">
      <section className="reveal-up rounded-3xl p-6 md:p-8 bg-gradient-to-br from-[#102a44] via-[#205f92] to-[#ff8f5f] text-white shadow-2xl shadow-[#0f3a5e]/30">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/75">Analytics</p>
            <h1 className="text-3xl md:text-4xl font-bold mt-2">Forecast Studio</h1>
            <p className="mt-3 text-white/80">Interpret stock velocity and urgency through live product behavior.</p>
          </div>
          <div className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold flex items-center gap-2 self-start md:self-auto">
            <Calendar size={16} /> Real-time forecast window
          </div>
        </div>
      </section>

      <div className="reveal-up-delay-1 grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard icon={<ShieldAlert size={18} className="text-red-500" />} title="Critical items" value={atRisk.length} caption="Needs immediate attention" />
        <MetricCard icon={<Gauge size={18} className="text-emerald-600" />} title="Stable items" value={stable.length} caption="Above safety threshold" />
        <MetricCard icon={<LineChart size={18} className="text-[#1167b1]" />} title="Velocity score" value={velocityScore} caption="Units/day blended" />
        <MetricCard icon={<TrendingUp size={18} className="text-emerald-600" />} title="Est. profit" value={new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(estimatedProfit)} caption="On current stock" />
      </div>

      <div className="reveal-up-delay-2 soft-card p-6 md:p-7 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Stock Pressure Chart</h3>
            <p className="text-sm text-slate-500 mt-1">Current stock compared with safety level for your busiest items.</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#1167b1]" /> Current stock</span>
            <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#ff7a59]" /> Safety level</span>
          </div>
        </div>

        {chartProducts.length > 0 ? (
          <div className="space-y-4">
            {chartProducts.map((product) => {
              const stockWidth = `${Math.max(4, (product.currentStock / chartMax) * 100)}%`;
              const safetyLeft = `${Math.min(100, (product.minStockLevel / chartMax) * 100)}%`;
              const isLow = product.currentStock <= product.minStockLevel;

              return (
                <div key={product._id} className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-12 md:col-span-3 lg:col-span-2">
                    <p className="font-semibold text-slate-800 truncate">{product.name}</p>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">{product.category}</p>
                  </div>

                  <div className="col-span-12 md:col-span-7 lg:col-span-8">
                    <div className="relative h-10 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200">
                      <div
                        className={`absolute inset-y-0 left-0 rounded-2xl ${isLow ? 'bg-gradient-to-r from-red-500 to-orange-400' : 'bg-gradient-to-r from-[#1167b1] to-[#6bb6f2]'}`}
                        style={{ width: stockWidth }}
                      />
                      <div
                        className="absolute top-0 bottom-0 w-[2px] bg-[#ff7a59] shadow-[0_0_0_2px_rgba(255,122,89,0.18)]"
                        style={{ left: safetyLeft }}
                        title={`Safety level: ${product.minStockLevel}`}
                      />
                    </div>
                  </div>

                  <div className="col-span-12 md:col-span-2 flex items-center justify-between md:justify-end gap-2 text-sm">
                    <span className={`font-bold ${isLow ? 'text-red-600' : 'text-slate-800'}`}>{product.currentStock}</span>
                    <span className="text-slate-400">/ {chartMax}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-400 italic text-sm">No chart data yet. Add products and sales history to populate the chart.</p>
        )}
      </div>

      <div className="reveal-up-delay-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="soft-card p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-[#1167b1]" /> Stock Velocity
          </h3>
          <div className="space-y-3">
            {products.length > 0 ? products.slice(0, 5).map(p => (
              <div key={p._id} className="rounded-xl border border-slate-100 bg-white p-3 flex justify-between items-center text-sm">
                <span className="text-slate-700 font-semibold">{p.name}</span>
                <span className="font-bold text-[#1167b1]">{p.calculatedAvgUsage || '0.0'} units/day</span>
              </div>
            )) : (
              <p className="text-slate-400 italic text-sm">No sales data recorded yet.</p>
            )}
          </div>
        </div>

        <div className="soft-card p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-amber-500" /> Restock Forecast Queue
          </h3>
          <div className="space-y-3">
            {products.length > 0 ? (
              products
                .filter(p => p.daysUntilOut < 15 || p.currentStock <= p.minStockLevel)
                .map(p => (
                  <InsightCard 
                    key={p._id}
                    product={p.name} 
                    days={p.daysUntilOut}
                    action={p.forecastAction} 
                    urgent={p.urgent} 
                  />
                ))
            ) : (
              <p className="text-center text-slate-400 py-10">No data available to forecast.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ icon, title, value, caption }) => (
  <div className="soft-card rounded-2xl p-4 border border-slate-200">
    <div className="flex items-center gap-2 text-slate-600 text-sm">{icon}<span>{title}</span></div>
    <p className="text-3xl font-bold mt-3 text-slate-900">{value}</p>
    <p className="text-xs text-slate-500 mt-1">{caption}</p>
  </div>
);

const InsightCard = ({ product, days, action, urgent }) => (
  <div className={`p-4 rounded-xl border flex justify-between items-center ${urgent ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-200'}`}>
    <div>
      <p className="font-bold text-slate-800">{product}</p>
      <p className="text-xs text-slate-500 tracking-tight">Days until out: {days ?? 999}</p>
    </div>
    <div className="text-right">
      <p className={`text-sm font-bold ${urgent ? 'text-red-600' : 'text-[#1167b1]'}`}>{action}</p>
      <p className="text-[10px] text-slate-400 uppercase font-bold">Recommended</p>
    </div>
  </div>
);

export default Analytics;