import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useCartStore } from './stores/cartStore';
import { useEffect } from 'react';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CatalogPage from './pages/CatalogPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import PaymentPage from './pages/PaymentPage';
import OrderListPage from './pages/OrderListPage';
import OrderDetailPage from './pages/OrderDetailPage';
import AchievementsPage from './pages/AchievementsPage';
import WishlistPage from './pages/WishlistPage';
import RewardsPage from './pages/RewardsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Загрузка...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { accessToken } = useAuth();
  const syncWithServer = useCartStore((s) => s.syncWithServer);

  useEffect(() => {
    if (accessToken) {
      syncWithServer(accessToken);
    }
  }, [accessToken]);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/product/:slug" element={<ProductDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/checkout" element={
            <ProtectedRoute><CheckoutPage /></ProtectedRoute>
          } />
          <Route path="/payment" element={
            <ProtectedRoute><PaymentPage /></ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute><OrderListPage /></ProtectedRoute>
          } />
          <Route path="/orders/:id" element={
            <ProtectedRoute><OrderDetailPage /></ProtectedRoute>
          } />
          <Route path="/achievements" element={
            <ProtectedRoute><AchievementsPage /></ProtectedRoute>
          } />
          <Route path="/wishlist" element={
            <ProtectedRoute><WishlistPage /></ProtectedRoute>
          } />
          <Route path="/rewards" element={
            <ProtectedRoute><RewardsPage /></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
