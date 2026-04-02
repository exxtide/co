import React from 'react'
import { Heart, Award, Clock, Truck } from 'lucide-react'

const features = [
  {
    icon: Heart,
    title: 'Готовим с любовью',
    description: 'Каждый торт создается с особым вниманием к деталям и качеству ингредиентов'
  },
  {
    icon: Award,
    title: 'Высокое качество',
    description: 'Используем только свежие и натуральные продукты от проверенных поставщиков'
  },
  {
    icon: Clock,
    title: 'Быстро и вовремя',
    description: 'Соблюдаем сроки доставки и всегда информируем о готовности заказа'
  },
  {
    icon: Truck,
    title: 'Удобная доставка',
    description: 'Доставляем по всему Ульяновску в удобное для вас время'
  }
]

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">О нашей компании</h2>
          <p className="text-gray-600 max-w-3xl mx-auto text-lg">
            Мы — команда энтузиастов, которая уже более 5 лет радует жителей Ульяновска 
            вкусными тортами и десертами. Наша цель — сделать каждое ваше событие особенным.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <feature.icon size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-2xl font-bold mb-4">Почему выбирают нас?</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-6 h-6 bg-red-600 rounded-full flex-shrink-0 mt-1"></div>
                <div>
                  <h4 className="font-semibold">Собственное производство</h4>
                  <p className="text-gray-600">Все торты готовятся в нашей кондитерской с соблюдением всех стандартов качества</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-6 h-6 bg-red-600 rounded-full flex-shrink-0 mt-1"></div>
                <div>
                  <h4 className="font-semibold">Индивидуальный подход</h4>
                  <p className="text-gray-600">Можем изготовить торт по вашему дизайну и учесть все пожелания</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-6 h-6 bg-red-600 rounded-full flex-shrink-0 mt-1"></div>
                <div>
                  <h4 className="font-semibold">Доступные цены</h4>
                  <p className="text-gray-600">Качественные торты по разумным ценам для любого бюджета</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-6 h-6 bg-red-600 rounded-full flex-shrink-0 mt-1"></div>
                <div>
                  <h4 className="font-semibold">Гарантия свежести</h4>
                  <p className="text-gray-600">Все изделия готовятся в день доставки для максимальной свежести</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <img
              src="https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&cs=tinysrgb&w=600"
              alt="Наша кондитерская"
              className="rounded-lg shadow-xl w-full"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-red-600/20 to-transparent rounded-lg"></div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="bg-white rounded-lg p-8 shadow-md">
            <div className="text-4xl font-bold text-red-600 mb-2">500+</div>
            <div className="text-gray-600">Довольных клиентов</div>
          </div>
          <div className="bg-white rounded-lg p-8 shadow-md">
            <div className="text-4xl font-bold text-red-600 mb-2">1000+</div>
            <div className="text-gray-600">Тортов изготовлено</div>
          </div>
          <div className="bg-white rounded-lg p-8 shadow-md">
            <div className="text-4xl font-bold text-red-600 mb-2">5</div>
            <div className="text-gray-600">Лет опыта</div>
          </div>
        </div>
      </div>
    </section>
  )
}