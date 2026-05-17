import React, { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [registerDone, setRegisterDone] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendOk, setResendOk] = useState(false);
  const { signIn, signUp } = useAuth();

  const resetMessages = () => {
    setError('');
    setRegisterDone(false);
    setShowResend(false);
    setResendOk(false);
    setPendingEmail('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    resetMessages();

    try {
      if (isLogin) {
        await signIn(email, password);
        onClose();
        setEmail('');
        setPassword('');
        setFirstName('');
      } else {
        await signUp(email, password, firstName || undefined);
        setRegisterDone(true);
        setPendingEmail(email);
        setEmail('');
        setPassword('');
        setFirstName('');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка';
      setError(message);
      const code = err instanceof Error && 'code' in err ? (err as Error & { code?: string }).code : undefined;
      if (code === 'email_not_verified') {
        setShowResend(true);
        setPendingEmail(email);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!pendingEmail) return;
    setResendLoading(true);
    setResendOk(false);
    setError('');
    try {
      await apiService.resendVerificationEmail(pendingEmail);
      setResendOk(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось отправить');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-lg max-w-md w-full p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {isLogin ? 'Вход' : 'Регистрация'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  resetMessages();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {registerDone && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md text-green-900 text-sm"
              >
                На адрес <strong>{pendingEmail}</strong> отправлено письмо со ссылкой для подтверждения.
                После подтверждения вы сможете войти.
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md text-red-700"
              >
                {error}
                {showResend && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => void handleResend()}
                      disabled={resendLoading}
                      className="text-sm font-medium text-red-800 underline"
                    >
                      {resendLoading ? 'Отправка…' : 'Отправить письмо повторно'}
                    </button>
                    {resendOk && <p className="mt-2 text-green-700">Если email есть в системе, письмо отправлено.</p>}
                  </div>
                )}
              </motion.div>
            )}

            {!registerDone && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      Имя (необязательно)
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                )}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Пароль {isLogin ? '' : '(минимум 8 символов)'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                      minLength={isLogin ? undefined : 8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {loading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
                </motion.button>
              </form>
            )}

            <div className="mt-4 text-center space-y-2">
              {registerDone ? (
                <button
                  type="button"
                  onClick={() => {
                    setRegisterDone(false);
                    setIsLogin(true);
                  }}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Перейти ко входу
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    resetMessages();
                    setIsLogin(!isLogin);
                  }}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Есть аккаунт? Войти'}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
