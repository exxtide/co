import React from 'react'
import { MapPin, Phone, Clock, Navigation } from 'lucide-react'

export const MapSection: React.FC = () => {
  return (
    <section id="contacts" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Где нас найти</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Мы находимся в центре Ульяновска и доставляем по всему городу
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Contact Information */}
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Контактная информация</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center text-white">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold">Адрес</h4>
                    <p className="text-gray-600">г. Ульяновск, ул. Московское шоссе, 100</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center text-white">
                    <Phone size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold">Телефон</h4>
                    <p className="text-gray-600">+7 (842) 123-45-67</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center text-white">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold">Время работы</h4>
                    <p className="text-gray-600">Ежедневно с 9:00 до 22:00</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center text-white">
                    <Navigation size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold">Зона доставки</h4>
                    <p className="text-gray-600">По всему Ульяновску и области</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Info */}
            <div id="delivery" className="bg-red-50 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-red-800">Информация о доставке</h3>
              <div className="space-y-3 text-red-700">
                <div className="flex justify-between">
                  <span>Центр города:</span>
                  <span className="font-semibold">200₽ (от 1000₽)</span>
                </div>
                <div className="flex justify-between">
                  <span>Спальные районы:</span>
                  <span className="font-semibold">300₽ (от 1500₽)</span>
                </div>
                <div className="flex justify-between">
                  <span>Загородная зона:</span>
                  <span className="font-semibold">500₽ (от 2000₽)</span>
                </div>
                <hr className="border-red-200" />
                <div className="flex justify-between font-bold">
                  <span>Время доставки:</span>
                  <span>30-60 минут</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-100 rounded-lg overflow-hidden h-96 relative">
            <iframe
              src="https://www.openstreetmap.org/export/embed.html?bbox=48.3461%2C54.3051%2C48.4461%2C54.3551&layer=mapnik&marker=54.3301%2C48.3961"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Карта Ульяновска"
            ></iframe>
            
            // внутри компонента, в оверлее карты:
            <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3">
              <div className="flex items-center space-x-2">
                 <MapPin size={16} className="text-red-600" />
                 <span className="text-sm font-medium">Понятная еда</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">Московское шоссе, 100</p>
              </div>
          </div>
        </div>
      </div>
    </section>
  )
}