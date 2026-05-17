import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock, Instagram, Facebook, Youtube } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Колонка 1: Информация о компании */}
          <div>
            <h3 className="text-2xl font-bold text-red-500 mb-4">Понятная еда</h3>
            <p className="text-gray-300 mb-4">
              Доставляем самые вкусные торты и десерты по Ульяновску. 
              Свежие продукты, быстрая доставка, доступные цены.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-white transition-colors"><Instagram size={24} /></a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors"><Facebook size={24} /></a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors"><Youtube size={24} /></a>
            </div>
          </div>

          {/* Колонка 2: Контакты */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Контакты</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone size={18} className="text-red-500" />
                <span>+7 (842) 123-45-67</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail size={18} className="text-red-500" />
                <span>info@ponyatnaya-eda.ru</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin size={18} className="text-red-500" />
                <span>Ульяновск, улица Железной Дивизии, 7</span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock size={18} className="text-red-500" />
                <span>Ежедневно с 9:00 до 22:00</span>
              </div>
            </div>
          </div>

          {/* Колонка 3: Навигация по сайту */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Быстрые ссылки</h4>
            <ul className="space-y-2">
              <li><Link to="/catalog" className="text-gray-300 hover:text-white transition-colors">Меню</Link></li>
              <li><Link to="/about" className="text-gray-300 hover:text-white transition-colors">О нас</Link></li>
              <li><Link to="/delivery" className="text-gray-300 hover:text-white transition-colors">Доставка</Link></li>
              <li><Link to="/contacts" className="text-gray-300 hover:text-white transition-colors">Контакты</Link></li>
              <li><Link to="/promotions" className="text-gray-300 hover:text-white transition-colors">Акции</Link></li>
              <li><Link to="/custom-order" className="text-gray-300 hover:text-white transition-colors">На заказ</Link></li>
            </ul>
          </div>

          {/* Колонка 4: Документы */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Документы</h4>
            <ul className="space-y-2">
              <li><Link to="/terms" className="text-gray-300 hover:text-white transition-colors">Пользовательское соглашение</Link></li>
              <li><Link to="/privacy" className="text-gray-300 hover:text-white transition-colors">Политика конфиденциальности</Link></li>
              <li><Link to="/delivery-terms" className="text-gray-300 hover:text-white transition-colors">Условия доставки</Link></li>
              <li><Link to="/offer" className="text-gray-300 hover:text-white transition-colors">Публичная оферта</Link></li>
            </ul>
          </div>
        </div>

        <hr className="border-gray-600 my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-300 text-sm">© 2026 Понятная еда. Все права защищены.</p>
          <p className="text-gray-300 text-sm mt-2 md:mt-0">Разработано с ❤️ для города Ульяновска</p>
        </div>
      </div>
    </footer>
  );
};
