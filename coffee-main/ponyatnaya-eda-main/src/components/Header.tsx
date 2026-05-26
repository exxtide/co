import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, User, Phone, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './AuthModal';
import { CartModal } from './CartModal';
import logo from '../assets/logo.png';

interface HeaderProps {
  onAdminClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onAdminClick }) => {
  const { getTotalItems } = useCart();
  const { user, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [telegramCallbackToken, setTelegramCallbackToken] = useState<string | null>(null);

  // Check for Telegram callback parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const telegramToken = params.get('telegram_token');
    const telegramAction = params.get('telegram_action');

    if (telegramToken && telegramAction === 'register') {
      // Clear URL parameters
      window.history.replaceState({}, '', window.location.pathname);
      // Save token and open auth modal
      setTelegramCallbackToken(telegramToken);
      setShowAuthModal(true);
    }
  }, []);

  const totalItems = getTotalItems();

  return (
    <>
      <header className="bg-white shadow-lg sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-24 px-4 md:px-8">
            <Link to="/" className="flex-shrink-0">
              <img 
                src={logo} 
                alt="Понятная еда" 
                className="h-20 md:h-32 w-auto object-contain max-w-[180px] md:max-w-[240px]" 
              />
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/catalog" className="text-gray-700 hover:text-red-600 transition-colors">Меню</Link>
              <Link to="/about" className="text-gray-700 hover:text-red-600 transition-colors">О нас</Link>
              <Link to="/delivery" className="text-gray-700 hover:text-red-600 transition-colors">Доставка</Link>
              <Link to="/contacts" className="text-gray-700 hover:text-red-600 transition-colors">Контакты</Link>
              <Link to="/promotions" className="relative text-gray-700 hover:text-red-600 transition-colors font-semibold">
                Акции
                <span className="absolute -top-1 -right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </Link>
              <Link to="/custom-order" className="text-gray-700 hover:text-red-600 transition-colors">На заказ</Link>
            </nav>

            <div className="hidden lg:flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Phone size={16} className="text-red-600" />
                <span className="font-medium">+7 (842) 123-45-67</span>
              </div>
              <span className="text-gray-500">Работаем 9:00 - 22:00</span>
            </div>

            <div className="flex items-center space-x-4">
              {user?.is_staff && onAdminClick && (
                <button
                  onClick={onAdminClick}
                  className="hidden md:block px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Админка
                </button>
              )}

              <button
                onClick={() => setShowCartModal(true)}
                className="relative p-2 text-gray-700 hover:text-red-600"
              >
                <ShoppingCart size={24} />
                {totalItems > 0 && (
                  <motion.span
                    key={totalItems}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </button>

              {user ? (
                <div className="relative group">
                  <button className="p-2 text-gray-700 hover:text-red-600">
                    <User size={24} />
                  </button>
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50"
                    >
                      <Link
                        to="/account"
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Настройки аккаунта
                      </Link>
                      <button
                        type="button"
                        onClick={signOut}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Выйти
                      </button>
                    </motion.div>
                  </AnimatePresence>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
                >
                  Войти
                </button>
              )}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-700"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden border-t border-gray-200 py-4 overflow-hidden"
              >
                <nav className="flex flex-col space-y-4">
                  <Link to="/catalog" onClick={() => setMobileMenuOpen(false)}>Меню</Link>
                  <Link to="/about" onClick={() => setMobileMenuOpen(false)}>О нас</Link>
                  <Link to="/delivery" onClick={() => setMobileMenuOpen(false)}>Доставка</Link>
                  <Link to="/contacts" onClick={() => setMobileMenuOpen(false)}>Контакты</Link>
                  <Link to="/promotions" onClick={() => setMobileMenuOpen(false)} className="relative inline-block font-semibold">
                    Акции
                    <span className="absolute -top-1 -right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  </Link>
                  <Link to="/custom-order" onClick={() => setMobileMenuOpen(false)}>На заказ</Link>
                  {user?.is_staff && onAdminClick && (
                    <button onClick={() => { onAdminClick(); setMobileMenuOpen(false); }}>Админка</button>
                  )}
                  {user && (
                    <Link to="/account" onClick={() => setMobileMenuOpen(false)}>Настройки аккаунта</Link>
                  )}
                </nav>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone size={16} className="text-red-600" />
                    <span className="font-medium">+7 (842) 123-45-67</span>
                  </div>
                  <span className="text-gray-500 text-sm">Работаем 9:00 - 22:00</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <AuthModal isOpen={showAuthModal} onClose={() => { setShowAuthModal(false); setTelegramCallbackToken(null); }} telegramToken={telegramCallbackToken} />
      <CartModal isOpen={showCartModal} onClose={() => setShowCartModal(false)} />
    </>
  );
};
