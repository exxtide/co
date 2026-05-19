import React, { useState } from 'react';
import { X, Send, MessageCircle, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'phone' | 'code';
type Method = 'telegram' | 'max';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [method, setMethod] = useState<Method>('telegram');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugCode, setDebugCode] = useState(''); // Только для отладки
  const { sendCode, verifyCode } = useAuth();

  const resetForm = () => {
    setStep('phone');
    setPhone('');
    setCode('');
    setError('');
    setDebugCode('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const formatPhone = (value: string) => {
    // Форматируем телефон: +7 (XXX) XXX-XX-XX
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

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const digits = phone.replace(/\D/g, '');
      if (digits.length < 10) {
        throw new Error('Введите корректный номер телефона');
      }

      const response = await sendCode(phone, method);
      setDebugCode(response.code || ''); // В режиме отладки показываем код
      setStep('code');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка отправки кода';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await verifyCode(phone, code);
      handleClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Неверный код';
      setError(message);
    } finally {
      setLoading(false);
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
                {step === 'phone' ? 'Вход по телефону' : 'Подтверждение'}
              </h2>
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

            {step === 'phone' ? (
              <form onSubmit={handleSendCode} className="space-y-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Куда отправить код?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setMethod('telegram')}
                      className={`flex items-center justify-center gap-2 py-3 px-4 rounded-md border-2 transition-colors ${
                        method === 'telegram'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 hover:border-red-300'
                      }`}
                    >
                      <Send size={20} />
                      <span>Telegram</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMethod('max')}
                      className={`flex items-center justify-center gap-2 py-3 px-4 rounded-md border-2 transition-colors ${
                        method === 'max'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 hover:border-red-300'
                      }`}
                    >
                      <MessageCircle size={20} />
                      <span>MAX</span>
                    </button>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {loading ? 'Отправка...' : 'Получить код'}
                </motion.button>

                <p className="text-xs text-gray-500 text-center">
                  В режиме отладки код будет показан на следующем шаге
                </p>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-gray-600">
                    Код отправлен на <strong>{phone}</strong> через {method === 'telegram' ? 'Telegram' : 'MAX'}
                  </p>
                </div>

                {debugCode && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-center"
                  >
                    <p className="text-sm text-yellow-800 mb-1">Код подтверждения (только для отладки):</p>
                    <p className="text-2xl font-bold text-yellow-900 tracking-widest">{debugCode}</p>
                  </motion.div>
                )}

                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                    Код подтверждения
                  </label>
                  <input
                    type="text"
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-center text-2xl tracking-widest"
                    required
                    maxLength={6}
                    autoFocus
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {loading ? 'Проверка...' : 'Войти'}
                </motion.button>

                <div className="flex justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => setStep('phone')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ← Назад
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSendCode({ preventDefault: () => {} } as React.FormEvent)}
                    disabled={loading}
                    className="text-red-600 hover:text-red-700"
                  >
                    Отправить код повторно
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
