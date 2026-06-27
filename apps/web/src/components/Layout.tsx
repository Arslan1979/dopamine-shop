import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCartStore } from '../stores/cartStore';
import CartDrawer from './CartDrawer';
import { ShoppingBag, LogOut, Menu, X, ClipboardList, Trophy, Heart } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function Layout() {
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItems, openCart } = useCartStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { to: '/', label: 'Главная' },
    { to: '/catalog', label: 'Каталог' },
    ...(isAuthenticated ? [
      { to: '/orders', label: 'Заказы' },
      { to: '/wishlist', label: 'Желания' },
      { to: '/achievements', label: 'Достижения' },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <ShoppingBag className="w-7 h-7 text-primary-600" />
            <span className="text-xl font-bold text-slate-900 hidden sm:block">DopamineShop</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? 'text-primary-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={openCart}
              className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ShoppingBag className="w-5 h-5 text-slate-600" />
              {totalItems > 0 && (
                <motion.span
                  key={totalItems}
                  initial={{ scale: 1.5 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-primary-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center"
                >
                  {totalItems}
                </motion.span>
              )}
            </button>

            {isAuthenticated ? (
              <div className="hidden sm:flex items-center gap-3">
                <span className="text-sm text-slate-600">{user?.name}</span>
                <button
                  onClick={logout}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-red-500"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login" className="text-sm text-slate-600 hover:text-primary-600 px-3 py-2">
                  Войти
                </Link>
                <Link to="/register" className="text-sm bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors">
                  Регистрация
                </Link>
              </div>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-100 px-4 py-3 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-medium text-slate-600 hover:text-primary-600"
              >
                {link.label}
              </Link>
            ))}
            {!isAuthenticated && (
              <div className="pt-2 border-t border-slate-100 flex gap-2">
                <Link to="/login" className="flex-1 text-center py-2 text-sm border border-slate-200 rounded-lg">
                  Войти
                </Link>
                <Link to="/register" className="flex-1 text-center py-2 text-sm bg-primary-600 text-white rounded-lg">
                  Регистрация
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      <main>
        <Outlet />
      </main>

      {useCartStore((s) => s.isOpen) && <CartDrawer />}
    </div>
  );
}
