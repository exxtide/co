import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AdminPanel } from './components/AdminPanel';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import ProductDetailPage from './pages/ProductDetailPage';
import AboutPage from './pages/AboutPage';
import DeliveryPage from './pages/DeliveryPage';
import ContactsPage from './pages/ContactsPage';
import PromotionsPage from './pages/PromotionsPage';
import CustomOrderPage from './pages/CustomOrderPage';
import AccountPage from './pages/AccountPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import { ToastProvider } from './contexts/ToastContext';

const AnimatedPage = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.4, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

function AppContent() {
  const location = useLocation();
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.reveal-on-scroll').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [location.key]); 

  return (
    <div className="min-h-screen flex flex-col">
      <Header onAdminClick={() => setShowAdminPanel(true)} />
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<AnimatedPage><HomePage /></AnimatedPage>} />
            <Route path="/catalog" element={<AnimatedPage><CatalogPage /></AnimatedPage>} />
            <Route path="/product/:slug" element={<AnimatedPage><ProductDetailPage /></AnimatedPage>} />
            <Route path="/about" element={<AnimatedPage><AboutPage /></AnimatedPage>} />
            <Route path="/delivery" element={<AnimatedPage><DeliveryPage /></AnimatedPage>} />
            <Route path="/contacts" element={<AnimatedPage><ContactsPage /></AnimatedPage>} />
            <Route path="/promotions" element={<AnimatedPage><PromotionsPage /></AnimatedPage>} />
            <Route path="/custom-order" element={<AnimatedPage><CustomOrderPage /></AnimatedPage>} />
            <Route path="/account" element={<AnimatedPage><AccountPage /></AnimatedPage>} />
            <Route path="/verify-email" element={<AnimatedPage><VerifyEmailPage /></AnimatedPage>} />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
      <AdminPanel isOpen={showAdminPanel} onClose={() => setShowAdminPanel(false)} />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;