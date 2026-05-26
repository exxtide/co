import React, { useState, useEffect, useCallback } from 'react';
import { X, Smartphone, Lock, User, MessageCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  telegramToken?: string | null;
}

type AuthMode = 'login' | 'register' | 'telegram-register' | 'telegram-waiting' | 'telegram-password' | 'forgot-password' | 'forgot-verify' | 'forgot-new-password';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, telegramToken }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Telegram registration states
  const [telegramLink, setTelegramLink] = useState('');
  const [registrationToken, setRegistrationToken] = useState('');
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  // Password reset states
  const [resetToken, setResetToken] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [codeSentDirectly, setCodeSentDirectly] = useState(false);

  const { register, login } = useAuth();

  const resetForm = useCallback(() => {
    setMode('login');
    setFirstName('');
    setPhone('');
    setPassword('');
    setPasswordConfirm('');
    setError('');
    setTelegramLink('');
    setRegistrationToken('');
    setResetToken('');
    setTempToken('');
    setResetCode('');
    setCodeSentDirectly(false);
    if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
  }, [pollInterval]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);

  // Handle telegram token from props (passed from Header when URL has params)
  useEffect(() => {
    if (telegramToken) {
      setRegistrationToken(telegramToken);
      setMode('telegram-password');
    }
  }, [telegramToken]);

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) return '';

    let formatted = '+';
    if (digits[0] === '7' || digits[0] === '8') {
      formatted += '7';
    } else {
      formatted += digits[0];
    }

    const rest = digits.slice(1);
    if (rest.length > 0) formatted += ' (' + rest.slice(0, 3);
    if (rest.length >= 3) formatted += ')';
    if (rest.length > 3) formatted += ' ' + rest.slice(3, 6);
    if (rest.length > 6) formatted += '-' + rest.slice(6, 8);
    if (rest.length > 8) formatted += '-' + rest.slice(8, 10);

    return formatted;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  };

  const normalizePhone = (phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('8')) {
      return '+7' + digits.slice(1);
    }
    return '+' + digits;
  };

  // ==================== Regular Registration/Login ====================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const digits = phone.replace(/\D/g, '');
      if (digits.length < 10) {
        throw new Error('Введите корректный номер телефона');
      }

      if (mode === 'register') {
        if (!firstName.trim()) {
          throw new Error('Укажите имя');
        }
        if (password.length < 8) {
          throw new Error('Пароль должен быть не менее 8 символов');
        }
        if (password !== passwordConfirm) {
          throw new Error('Пароли не совпадают');
        }
        await register({
          first_name: firstName.trim(),
          phone,
          password,
          password_confirm: passwordConfirm,
        });
        handleClose();
      } else if (mode === 'login') {
        await login(phone, password);
        handleClose();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка авторизации';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ==================== Telegram Registration ====================

  const handleTelegramRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const digits = phone.replace(/\D/g, '');
      if (digits.length < 10) {
        throw new Error('Введите корректный номер телефона');
      }

      const response = await apiService.telegramInitiateRegistration(phone);
      setTelegramLink(response.telegram_link);
      setRegistrationToken(response.token);

      // Сразу открываем Telegram
      openTelegramLink(response.telegram_link);

      setMode('telegram-waiting');

      // Start polling for registration status
      const interval = setInterval(async () => {
        try {
          const status = await apiService.telegramCheckRegistration(response.token);
          if (status.status === 'completed') {
            clearInterval(interval);
            setPollInterval(null);
            setMode('telegram-password');
          }
        } catch {
          // Ignore polling errors
        }
      }, 3000);

      setPollInterval(interval);

      // Auto-stop polling after 5 minutes
      setTimeout(() => {
        clearInterval(interval);
        setPollInterval(null);
      }, 5 * 60 * 1000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка при инициализации регистрации';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleTelegramComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (password.length < 8) {
        throw new Error('Пароль должен быть не менее 8 символов');
      }
      if (password !== passwordConfirm) {
        throw new Error('Пароли не совпадают');
      }

      const response = await apiService.telegramCompleteRegistration({
        token: registrationToken,
        password,
        password_confirm: passwordConfirm,
      });

      // Save token and close
      localStorage.setItem('token', response.token);
      window.location.reload();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка при завершении регистрации';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const openTelegram = () => {
    if (telegramLink) {
      // Пробуем открыть в новой вкладке
      const newWindow = window.open(telegramLink, '_blank');
      // Если popup заблокирован или на мобильном - используем location
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        window.location.href = telegramLink;
      }
    }
  };

  const openTelegramLink = (link: string) => {
    // Пробуем открыть в новой вкладке
    const newWindow = window.open(link, '_blank');
    // Если popup заблокирован - используем location.href
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      window.location.href = link;
    }
  };

  // ==================== Password Reset ====================

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const digits = phone.replace(/\D/g, '');
      if (digits.length < 10) {
        throw new Error('Введите корректный номер телефона');
      }

      const response = await apiService.passwordResetInitiate(phone);
      setResetToken(response.token);
      setCodeSentDirectly(response.code_sent_directly);

      // Всегда открываем Telegram если есть ссылка
      if (response.telegram_link) {
        openTelegramLink(response.telegram_link);
      }

      setMode('forgot-verify');
    } catch (err: unknown) {
      // Don't reveal if user exists
      setMode('forgot-verify');
      setResetToken('');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (resetCode.length !== 6) {
        throw new Error('Введите 6-значный код');
      }

      const response = await apiService.passwordResetVerify(resetToken, resetCode);
      setTempToken(response.temp_token);
      setPhone(response.phone);
      setMode('forgot-new-password');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Неверный код';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (password.length < 8) {
        throw new Error('Пароль должен быть не менее 8 символов');
      }
      if (password !== passwordConfirm) {
        throw new Error('Пароли не совпадают');
      }

      const response = await apiService.passwordResetComplete({
        temp_token: tempToken,
        phone: normalizePhone(phone),
        new_password: password,
      });

      localStorage.setItem('token', response.token);
      window.location.reload();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка при смене пароля';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ==================== Render Helpers ====================

  const renderBackButton = () => (
    <button
      type="button"
      onClick={() => setMode('login')}
      className="flex items-center text-gray-500 hover:text-gray-700 mb-4"
    >
      <ArrowLeft size={18} className="mr-1" />
      Назад
    </button>
  );

  const renderTitle = () => {
    switch (mode) {
      case 'login': return 'Вход';
      case 'register': return 'Регистрация';
      case 'telegram-register': return 'Регистрация через Telegram';
      case 'telegram-waiting': return 'Ожидание подтверждения';
      case 'telegram-password': return 'Установка пароля';
      case 'forgot-password': return 'Восстановление пароля';
      case 'forgot-verify': return 'Подтверждение кода';
      case 'forgot-new-password': return 'Новый пароль';
      default: return '';
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
            className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">{renderTitle()}</h2>
              <button
                type="button"
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md text-red-700"
              >
                {error}
              </motion.div>
            )}

            {/* ==================== LOGIN MODE ==================== */}
            {mode === 'login' && (
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Номер телефона
                    </label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="tel"
                        id="phone"
                        value={phone}
                        onChange={handlePhoneChange}
                        placeholder="+7 (999) 123-45-67"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Пароль
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setMode('forgot-password')}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Забыли пароль?
                    </button>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {loading ? 'Вход...' : 'Войти'}
                  </motion.button>
                </form>

                <div className="mt-6 space-y-3">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">или</span>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setMode('telegram-register')}
                    className="w-full flex items-center justify-center gap-2 bg-[#0088cc] text-white py-3 px-4 rounded-md hover:bg-[#0077b3] transition-colors font-medium"
                  >
                    <MessageCircle size={20} />
                    Зарегистрироваться через Telegram
                  </motion.button>

                  <p className="text-center text-sm text-gray-600">
                    Нет аккаунта?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('register')}
                      className="text-red-600 hover:text-red-700 font-medium"
                    >
                      Зарегистрироваться
                    </button>
                  </p>
                </div>
              </>
            )}

            {/* ==================== REGISTER MODE ==================== */}
            {mode === 'register' && (
              <>
                {renderBackButton()}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      Имя
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Иван"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Номер телефона
                    </label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="tel"
                        id="phone"
                        value={phone}
                        onChange={handlePhoneChange}
                        placeholder="+7 (999) 123-45-67"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Пароль
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                        minLength={8}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700 mb-1">
                      Подтверждение пароля
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="password"
                        id="passwordConfirm"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                        minLength={8}
                      />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                  </motion.button>
                </form>

                <p className="mt-4 text-center text-sm text-gray-600">
                  Уже есть аккаунт?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-red-600 hover:text-red-700 font-medium"
                  >
                    Войти
                  </button>
                </p>
              </>
            )}

            {/* ==================== TELEGRAM REGISTER MODE ==================== */}
            {mode === 'telegram-register' && (
              <>
                {renderBackButton()}
                <form onSubmit={handleTelegramRegister} className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-md mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>Регистрация через Telegram</strong>
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      Введите номер телефона, затем нажмите кнопку ниже, чтобы перейти в Telegram и подтвердить номер.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="tg-phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Номер телефона
                    </label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="tel"
                        id="tg-phone"
                        value={phone}
                        onChange={handlePhoneChange}
                        placeholder="+7 (999) 123-45-67"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0088cc]"
                        required
                      />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-[#0088cc] text-white py-3 px-4 rounded-md hover:bg-[#0077b3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    <MessageCircle size={20} />
                    {loading ? 'Подготовка...' : 'Перейти в Telegram'}
                  </motion.button>
                </form>
              </>
            )}

            {/* ==================== TELEGRAM WAITING MODE ==================== */}
            {mode === 'telegram-waiting' && (
              <div className="text-center py-4">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-[#0088cc] rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle size={32} className="text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Ожидание подтверждения</h3>
                  <p className="text-gray-600 mb-4">
                    Перейдите в Telegram и нажмите кнопку <strong>"Передать номер телефона"</strong>
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={openTelegram}
                  className="w-full flex items-center justify-center gap-2 bg-[#0088cc] text-white py-3 px-4 rounded-md hover:bg-[#0077b3] transition-colors font-medium mb-4"
                >
                  <MessageCircle size={20} />
                  Открыть Telegram
                </motion.button>

                <div className="flex items-center justify-center gap-2 text-gray-500">
                  <RefreshCw size={16} className="animate-spin" />
                  <span className="text-sm">Ожидание подтверждения...</span>
                </div>

                <button
                  type="button"
                  onClick={() => setMode('telegram-register')}
                  className="mt-4 text-sm text-gray-500 hover:text-gray-700"
                >
                  Отменить
                </button>
              </div>
            )}

            {/* ==================== TELEGRAM PASSWORD MODE ==================== */}
            {mode === 'telegram-password' && (
              <>
                <div className="bg-green-50 p-4 rounded-md mb-4">
                  <p className="text-sm text-green-800">
                    <strong>Номер подтверждён!</strong>
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    Теперь установите пароль для входа на сайт.
                  </p>
                </div>

                <form onSubmit={handleTelegramComplete} className="space-y-4">
                  <div>
                    <label htmlFor="tg-password" className="block text-sm font-medium text-gray-700 mb-1">
                      Пароль
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="password"
                        id="tg-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                        minLength={8}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="tg-password-confirm" className="block text-sm font-medium text-gray-700 mb-1">
                      Подтверждение пароля
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="password"
                        id="tg-password-confirm"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                        minLength={8}
                      />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {loading ? 'Завершение...' : 'Завершить регистрацию'}
                  </motion.button>
                </form>
              </>
            )}

            {/* ==================== FORGOT PASSWORD MODE ==================== */}
            {mode === 'forgot-password' && (
              <>
                {renderBackButton()}
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="bg-yellow-50 p-4 rounded-md mb-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Восстановление пароля</strong>
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Введите номер телефона, на который зарегистрирован аккаунт. Мы отправим код подтверждения в Telegram.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="reset-phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Номер телефона
                    </label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="tel"
                        id="reset-phone"
                        value={phone}
                        onChange={handlePhoneChange}
                        placeholder="+7 (999) 123-45-67"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                      />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-[#0088cc] text-white py-3 px-4 rounded-md hover:bg-[#0077b3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    <MessageCircle size={20} />
                    {loading ? 'Отправка...' : 'Получить код в Telegram'}
                  </motion.button>
                </form>
              </>
            )}

            {/* ==================== FORGOT VERIFY MODE ==================== */}
            {mode === 'forgot-verify' && (
              <>
                {renderBackButton()}
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-md mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>Проверьте Telegram</strong>
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      {codeSentDirectly
                        ? 'Код отправлен вам в Telegram.'
                        : 'Перейдите в Telegram, чтобы получить код подтверждения.'}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="reset-code" className="block text-sm font-medium text-gray-700 mb-1">
                      Код подтверждения
                    </label>
                    <input
                      type="text"
                      id="reset-code"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-center text-2xl tracking-widest"
                      required
                      maxLength={6}
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading || resetCode.length !== 6}
                    className="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {loading ? 'Проверка...' : 'Подтвердить'}
                  </motion.button>
                </form>
              </>
            )}

            {/* ==================== FORGOT NEW PASSWORD MODE ==================== */}
            {mode === 'forgot-new-password' && (
              <>
                {renderBackButton()}
                <form onSubmit={handleResetComplete} className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-md mb-4">
                    <p className="text-sm text-green-800">
                      <strong>Код подтверждён!</strong>
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      Установите новый пароль для входа.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                      Новый пароль
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="password"
                        id="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                        minLength={8}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="new-password-confirm" className="block text-sm font-medium text-gray-700 mb-1">
                      Подтверждение пароля
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="password"
                        id="new-password-confirm"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                        minLength={8}
                      />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {loading ? 'Сохранение...' : 'Сохранить новый пароль'}
                  </motion.button>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
