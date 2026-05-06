import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  BarChart3, 
  ShoppingCart,
  LogOut 
} from 'lucide-react';

const Sidebar = () => {
  const { logout, user } = useContext(AuthContext);

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/' },
    { icon: <Package size={20} />, label: 'Inventory', path: '/inventory' },
    { icon: <BarChart3 size={20} />, label: 'Analytics', path: '/analytics' },
    { icon: <ShoppingCart size={20} />, label: 'Sales', path: '/sales' }
  ];

  return (
    <aside className="w-full lg:w-[280px] lg:min-w-[280px] px-3 pt-3 lg:pr-0 lg:pb-3 flex flex-col z-20">
      <div className="h-full rounded-3xl sidebar-mesh text-white shadow-2xl shadow-[#060c14]/40 flex flex-col overflow-hidden border border-white/5 relative">
        
        {/* Top Logo Section */}
        <div className="p-6 border-b border-white/5 relative z-10">
          <div className="flex items-center gap-3 group cursor-default">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#ff7a59] to-[#2f9cff] rounded-xl blur-md opacity-40 group-hover:opacity-100 transition duration-500"></div>
              <img
                src="/branding/cloudstack-mark.svg"
                alt="Cloudstack logo"
                className="relative w-11 h-11 rounded-xl border border-white/10 shadow-lg bg-[#0e2236]/80 backdrop-blur-sm"
              />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.3em] text-[#ffb199] font-black drop-shadow-sm">Control Center</p>
              <h2 className="text-xl font-bold tracking-tight text-white leading-none mt-0.5 drop-shadow-md">Cloudstack</h2>
            </div>
          </div>

          <div className="mt-6 p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-md hover:bg-white/[0.05] transition-colors cursor-default">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Forecast Engine</p>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-sm font-semibold text-white/90 leading-tight">System active and monitoring risk.</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto relative z-10">
          <p className="px-3 mb-2 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Main Menu</p>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-white/10 text-white shadow-sm backdrop-blur-md'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-[#2f9cff] to-[#ff7a59] rounded-r-full shadow-[0_0_10px_rgba(47,156,255,0.8)]" />
                  )}
                  <div className={`transition-transform duration-300 ${isActive ? 'scale-110 text-[#2f9cff] drop-shadow-[0_0_8px_rgba(47,156,255,0.5)]' : 'group-hover:scale-110'}`}>
                    {item.icon}
                  </div>
                  <span className={`font-semibold tracking-wide transition-all duration-300 ${isActive ? 'translate-x-1' : 'group-hover:translate-x-1'}`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-white/5 relative z-10">
          <button
            onClick={logout}
            className="group flex items-center justify-between w-full p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-transparent hover:border-white/10 transition-all duration-300"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#2f9cff] to-[#ff7a59] p-[1.5px]">
                <div className="w-full h-full bg-[#060c14] rounded-full flex items-center justify-center text-xs font-bold text-white">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white/90 leading-none mb-1">{user?.name?.split(' ')[0] || 'User'}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider leading-none">Log out</p>
              </div>
            </div>
            <LogOut size={16} className="text-slate-500 group-hover:text-red-400 transition-colors group-hover:translate-x-1 duration-300" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;