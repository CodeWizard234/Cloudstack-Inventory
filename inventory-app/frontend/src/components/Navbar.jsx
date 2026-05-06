
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Search, CalendarDays, LayoutDashboard, Package, KeyRound, LogOut, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [readNotificationIds, setReadNotificationIds] = useState(() => new Set());
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const bellContainerRef = useRef(null);
  const profileContainerRef = useRef(null);

  const readStateKey = useMemo(() => {
    const userKey = user?._id || user?.email || user?.name || 'guest';
    return `inventory-notification-read:${userKey}`;
  }, [user?._id, user?.email, user?.name]);

  const nowLabel = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short'
  }).format(new Date());

  const initials = user?.name
    ? user.name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()
    : 'CS';

  useEffect(() => {
    try {
      const saved = localStorage.getItem(readStateKey);
      if (!saved) {
        setReadNotificationIds(new Set());
        return;
      }

      const ids = JSON.parse(saved);
      if (Array.isArray(ids)) {
        setReadNotificationIds(new Set(ids));
      }
    } catch (err) {
      setReadNotificationIds(new Set());
    }
  }, [readStateKey]);

  useEffect(() => {
    localStorage.setItem(readStateKey, JSON.stringify(Array.from(readNotificationIds)));
  }, [readNotificationIds, readStateKey]);

  useEffect(() => {
    const handleDocumentClick = (event) => {
      if (!bellContainerRef.current?.contains(event.target)) {
        setIsNotificationsOpen(false);
      }

      if (!profileContainerRef.current?.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, []);

  // Handle Dark Mode toggle effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    let mounted = true;

    const toNotification = (product) => {
      const minLevel = Number(product.minStockLevel) || 10;
      const currentStock = Number(product.currentStock) || 0;

      if (currentStock <= 0) {
        return {
          id: `out-${product._id}`,
          level: 'urgent',
          scope: 'inventory',
          title: 'Out of stock',
          message: `${product.name} has run out of stock.`,
          meta: `SKU: ${product.sku || 'NA'}`,
          createdAt: product.updatedAt || product.createdAt || new Date().toISOString()
        };
      }

      if (currentStock <= minLevel) {
        return {
          id: `low-${product._id}`,
          level: currentStock <= Math.max(1, Math.floor(minLevel / 2)) ? 'urgent' : 'warning',
          scope: 'inventory',
          title: 'Low stock alert',
          message: `${product.name} is at ${currentStock} units (min ${minLevel}).`,
          meta: `SKU: ${product.sku || 'NA'}`,
          createdAt: product.updatedAt || product.createdAt || new Date().toISOString()
        };
      }

      return null;
    };

    const fetchNotifications = async () => {
      try {
        setIsLoadingNotifications(true);
        const res = await api.get('/inventory');

        if (!mounted) return;

        const inventoryAlerts = (res.data || [])
          .map(toNotification)
          .filter(Boolean)
          .sort((a, b) => {
            const levelWeight = { urgent: 2, warning: 1, info: 0 };
            const byLevel = (levelWeight[b.level] || 0) - (levelWeight[a.level] || 0);
            if (byLevel !== 0) return byLevel;

            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });

        const systemNotification = {
          id: 'system-inventory-sync',
          level: 'info',
          scope: 'system',
          title: 'Inventory monitor active',
          message: 'Notifications are synced with your latest stock levels.',
          meta: `${res.data?.length || 0} products tracked`,
          createdAt: new Date().toISOString()
        };

        setNotifications([systemNotification, ...inventoryAlerts].slice(0, 12));
      } catch (err) {
        if (mounted) {
          setNotifications([
            {
              id: 'system-inventory-error',
              level: 'warning',
              scope: 'system',
              title: 'Notification sync failed',
              message: 'Could not fetch inventory alerts. Try refreshing.',
              meta: 'System',
              createdAt: new Date().toISOString()
            }
          ]);
        }
      } finally {
        if (mounted) {
          setIsLoadingNotifications(false);
        }
      }
    };

    fetchNotifications();
    const intervalId = window.setInterval(fetchNotifications, 60000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !readNotificationIds.has(item.id)).length,
    [notifications, readNotificationIds]
  );

  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'urgent') {
      return notifications.filter((item) => item.level === 'urgent' || item.level === 'warning');
    }
    if (activeFilter === 'system') {
      return notifications.filter((item) => item.scope === 'system');
    }
    return notifications;
  }, [activeFilter, notifications]);

  const markAllAsRead = () => {
    setReadNotificationIds(new Set(notifications.map((item) => item.id)));
  };

  const handleNotificationClick = (notification) => {
    const notificationId = notification.id;
    setReadNotificationIds((current) => {
      const next = new Set(current);
      next.add(notificationId);
      return next;
    });

    if (notification.scope === 'inventory') {
      navigate('/inventory');
      setIsNotificationsOpen(false);
    }
  };

  const formatRelativeTime = (isoDate) => {
    const timestamp = new Date(isoDate).getTime();
    const now = Date.now();
    const diff = Math.max(0, Math.floor((now - timestamp) / 1000));

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    return `${Math.floor(diff / 86400)} day ago`;
  };

  const getNotificationTone = (level) => {
    if (level === 'urgent') return 'border-red-200 bg-red-50/80 text-red-900';
    if (level === 'warning') return 'border-amber-200 bg-amber-50/80 text-amber-900';
    return 'border-slate-200 bg-white text-slate-800';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const openChangePasswordModal = () => {
    setIsProfileMenuOpen(false);
    setPasswordError('');
    setPasswordSuccess('');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setIsChangePasswordOpen(true);
  };

  const handlePasswordFieldChange = (field, value) => {
    setPasswordForm((current) => ({
      ...current,
      [field]: value
    }));
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('All password fields are required.');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    try {
      setIsPasswordSaving(true);
      const response = await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      setPasswordSuccess(response.data?.message || 'Password changed successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setIsPasswordSaving(false);
    }
  };

  return (
    <>
      <header className="glass-nav rounded-2xl px-4 py-3 flex items-center justify-between gap-4 sticky top-2 z-30 mb-6 mx-1 lg:mx-0 border border-white/60">
      <div className="hidden md:block">
        <div className="flex items-center gap-2">
          <img
            src="/branding/cloudstack-mark.svg"
            alt="Cloudstack logo"
            className="w-6 h-6 rounded-md border border-slate-200 dark:border-slate-700 bg-white"
          />
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Operations Pulse</p>
        </div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">Cloudstack Inventory Command Deck</h1>
      </div>

      <div className="flex-1 max-w-xl flex justify-center px-4">
        <label className="relative flex group w-full max-w-md items-center">
          <Search className="absolute left-3 text-slate-400 group-focus-within:text-[var(--brand)] transition-colors" size={16} />
          <input
            type="text"
            placeholder="Search inventory, sales..."
            className="w-full rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-slate-100/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-800 py-2 pl-9 pr-12 text-sm text-slate-700 dark:text-slate-200 shadow-inner focus:bg-white dark:focus:bg-slate-900 focus:border-[var(--brand)] focus:outline-none focus:ring-4 focus:ring-[#1167b1]/15 transition-all"
          />
          <div className="absolute right-2 flex items-center pointer-events-none">
            <span className="hidden sm:flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 rounded-[4px] px-1.5 py-0.5 text-[10px] font-bold shadow-sm font-mono">⌘K</span>
          </div>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-600 dark:text-slate-300">
          <CalendarDays size={14} className="text-slate-400" />
          <span>{nowLabel}</span>
        </div>

        <div className="relative" ref={bellContainerRef}>
          <button
            onClick={() => setIsNotificationsOpen((current) => !current)}
            className="relative p-2.5 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            aria-label="Open notifications"
            aria-expanded={isNotificationsOpen}
            type="button"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] leading-[18px] text-center border-2 border-white dark:border-slate-800 font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-[min(92vw,360px)] rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-md shadow-xl z-40 overflow-hidden">
              <div className="px-4 pt-4 pb-3 border-b border-slate-200/80">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-xs font-semibold text-[var(--brand)] hover:underline disabled:text-slate-400 disabled:no-underline"
                    disabled={!notifications.length || unreadCount === 0}
                  >
                    Mark all as read
                  </button>
                </div>

                <div className="mt-3 flex gap-2">
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'urgent', label: 'Urgent' },
                    { key: 'system', label: 'System' }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveFilter(tab.key)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition ${
                        activeFilter === tab.key
                          ? 'bg-[var(--brand)] text-white border-[var(--brand)]'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="max-h-[360px] overflow-y-auto">
                {isLoadingNotifications ? (
                  <div className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400">Loading alerts...</div>
                ) : filteredNotifications.length ? (
                  <ul className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {filteredNotifications.map((item) => {
                      const isUnread = !readNotificationIds.has(item.id);

                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => handleNotificationClick(item)}
                            className={`w-full text-left px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/50 ${isUnread ? 'bg-sky-50/35 dark:bg-sky-900/10' : 'bg-transparent'}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{item.message}</p>
                              </div>
                              {isUnread && <span className="mt-1 w-2.5 h-2.5 rounded-full bg-[var(--brand)]" />}
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide ${getNotificationTone(item.level)}`}>
                                {item.level}
                              </span>
                              <span className="text-[11px] text-slate-500">{formatRelativeTime(item.createdAt)}</span>
                            </div>
                            <p className="mt-1 text-[11px] text-slate-500">{item.meta}</p>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="px-4 py-6 text-sm text-slate-500">No notifications in this category.</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={profileContainerRef}>
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen((current) => !current)}
            className="flex items-center gap-3 rounded-xl border border-transparent px-1.5 py-1.5 hover:bg-white/70 transition"
            aria-label="Open profile menu"
            aria-expanded={isProfileMenuOpen}
          >
            <div className="text-right hidden lg:block">
              <p className="text-sm font-bold text-slate-700">{user?.name || 'Cloudstack User'}</p>
              <p className="text-[10px] text-[var(--brand)] font-bold uppercase tracking-wider">Operations Admin</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-tr from-[var(--brand)] to-[var(--accent)] rounded-full border-2 border-white shadow-md flex items-center justify-center text-white font-bold">
              {initials}
            </div>
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-3 w-[min(92vw,280px)] rounded-[24px] border border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl shadow-2xl shadow-[#113e63]/10 dark:shadow-black/50 z-40 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
              <div className="px-5 py-4 border-b border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50">
                <p className="text-base font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none mb-1">{user?.name || 'Cloudstack User'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{user?.email || 'Operations Admin'}</p>
              </div>

              <div className="p-2 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    navigate('/inventory');
                    setIsProfileMenuOpen(false);
                  }}
                  className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <Package size={16} className="text-slate-400 group-hover:text-[var(--brand)] transition-colors" />
                  Manage Inventory
                </button>
                <button
                  type="button"
                  onClick={openChangePasswordModal}
                  className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <KeyRound size={16} className="text-slate-400 group-hover:text-[var(--brand)] transition-colors" />
                  Change Password
                </button>
                
                <div className="h-px bg-slate-200/60 my-1.5 mx-2"></div>
                
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDarkMode(!isDarkMode);
                  }}
                  className="group w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isDarkMode ? (
                      <Moon size={16} className="text-[var(--brand)] group-hover:text-blue-400 transition-colors" />
                    ) : (
                      <Sun size={16} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
                    )}
                    Theme
                  </div>
                  <div className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${isDarkMode ? 'bg-[var(--brand)]' : 'bg-slate-300'}`}>
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all duration-300 shadow-sm ${isDarkMode ? 'left-4.5' : 'left-0.5'}`} style={{ transform: isDarkMode ? 'translateX(16px)' : 'translateX(0)' }}></div>
                  </div>
                </button>
                
                <div className="h-px bg-slate-200/60 my-1.5 mx-2"></div>
                
                <button
                  type="button"
                  onClick={handleLogout}
                  className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                >
                  <LogOut size={16} className="text-red-400 group-hover:text-red-600 dark:group-hover:text-red-300 transition-colors" />
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      </header>

      {isChangePasswordOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Change Password</h3>
              <p className="text-xs text-slate-500 mt-1">Use a new strong password to secure your account.</p>
            </div>

            <form onSubmit={handleChangePassword} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => handlePasswordFieldChange('currentPassword', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-[var(--brand)] focus:outline-none focus:ring-4 focus:ring-[#1167b1]/15"
                  autoComplete="current-password"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => handlePasswordFieldChange('newPassword', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-[var(--brand)] focus:outline-none focus:ring-4 focus:ring-[#1167b1]/15"
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => handlePasswordFieldChange('confirmPassword', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-[var(--brand)] focus:outline-none focus:ring-4 focus:ring-[#1167b1]/15"
                  autoComplete="new-password"
                />
              </div>

              {passwordError && (
                <p className="text-sm text-red-600">{passwordError}</p>
              )}
              {passwordSuccess && (
                <p className="text-sm text-emerald-700">{passwordSuccess}</p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPasswordSaving}
                  className="px-3 py-2 rounded-lg bg-[var(--brand)] text-white text-sm font-semibold hover:brightness-110 disabled:opacity-60"
                >
                  {isPasswordSaving ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;