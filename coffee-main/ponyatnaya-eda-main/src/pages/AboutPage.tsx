import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Award, Clock, Truck, Users, Coffee, Star, Shield } from 'lucide-react';

const AboutPage: React.FC = () => {
  const stats = [
    { value: '500+', label: 'Довольных клиентов', icon: Users },
    { value: '1000+', label: 'Тортов изготовлено', icon: Award },
    { value: '5', label: 'Лет опыта', icon: Clock },
    { value: '100%', label: 'Натуральные продукты', icon: Heart },
  ];

  const team = [
    { name: 'Анна Иванова', role: 'Шеф-кондитер', image: 'https://images.pexels.com/photos/3962341/pexels-photo-3962341.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop' },
    { name: 'Мария Петрова', role: 'Дизайнер тортов', image: 'https://images.pexels.com/photos/3764646/pexels-photo-3764646.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop' },
    { name: 'Елена Смирнова', role: 'Технолог', image: 'https://images.pexels.com/photos/4064701/pexels-photo-4064701.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop' },
    { name: 'Дмитрий Козлов', role: 'Руководитель доставки', image: 'https://images.pexels.com/photos/3778210/pexels-photo-3778210.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop' },
  ];

  const reviews = [
    { name: 'Ольга', text: 'Заказывала торт на день рождения — невероятно вкусно и красиво! Спасибо команде!', rating: 5 },
    { name: 'Алексей', text: 'Доставка вовремя, торт свежий, состав натуральный. Рекомендую!', rating: 5 },
    { name: 'Екатерина', text: 'Очень приятно удивлена качеством. Обязательно закажу ещё.', rating: 5 },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white"
    >
      {/* Hero секция */}
      <section className="relative bg-gradient-to-r from-red-700 to-red-900 text-white py-20">
        <div className="absolute inset-0 bg-black/40" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">О нас</h1>
            <p className="text-xl md:text-2xl mb-8">
              Мы создаём вкусные моменты с 2019 года
            </p>
          </motion.div>
        </div>
      </section>

      {/* Наша история */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            <motion.div variants={itemVariants}>
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Наша история</h2>
              <p className="text-gray-600 text-lg mb-4">
                Всё началось в 2019 году с маленькой домашней кондитерской, где мы с любовью готовили торты для друзей и семьи. 
                Нас вдохновляла идея, что настоящий торт может быть не только вкусным, но и полезным, 
                приготовленным из натуральных ингредиентов без искусственных добавок.
              </p>
              <p className="text-gray-600 text-lg mb-4">
                Сегодня мы — команда профессионалов, которая ежедневно радует жителей Ульяновска 
                свежими десертами. Мы выросли, но наши принципы остались неизменными: качество, 
                натуральность и любовь к своему делу.
              </p>
              <p className="text-gray-600 text-lg">
                Мы гордимся тем, что наши торты становятся частью самых важных событий в жизни наших клиентов — 
                свадеб, дней рождений, юбилеев. Каждый торт мы создаём как произведение искусства, 
                вкладывая душу и мастерство.
              </p>
            </motion.div>
            <motion.div variants={itemVariants} className="relative">
              <img
                src="https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Наша кондитерская"
                className="rounded-lg shadow-xl w-full"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-red-600/20 to-transparent rounded-lg" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Статистика */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="text-center bg-white rounded-lg p-8 shadow-md"
              >
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <stat.icon size={32} className="text-white" />
                </div>
                <div className="text-4xl font-bold text-red-600 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Наша команда */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Наша команда</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Профессионалы, которые ежедневно творят для вас волшебство
            </p>
          </motion.div>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {team.map((member, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="text-center"
              >
                <div className="w-40 h-40 mx-auto rounded-full overflow-hidden mb-4 shadow-lg">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">{member.name}</h3>
                <p className="text-red-600">{member.role}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Наши ценности */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Наши ценности</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              То, что делает нас особенными
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Heart, title: 'Натуральность', desc: 'Только свежие и качественные продукты' },
              { icon: Award, title: 'Качество', desc: 'Строгий контроль на всех этапах' },
              { icon: Clock, title: 'Пунктуальность', desc: 'Доставка точно в срок' },
              { icon: Truck, title: 'Забота', desc: 'Индивидуальный подход к каждому клиенту' },
            ].map((value, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-lg p-6 text-center shadow-md"
              >
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <value.icon size={32} className="text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Отзывы */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Что говорят наши клиенты</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Делимся впечатлениями наших довольных покупателей
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {reviews.map((review, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-gray-50 rounded-lg p-6 shadow-md"
              >
                <div className="flex mb-4">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} size={18} className="text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4">"{review.text}"</p>
                <p className="font-semibold text-gray-800">{review.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Присоединяйтесь */}
      <section className="py-16 bg-red-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-4">Хотите стать частью нашей истории?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Закажите торт уже сегодня и убедитесь в качестве сами!
            </p>
            <a
              href="/catalog"
              className="inline-block bg-white text-red-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
            >
              Перейти в каталог
            </a>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
};

export default AboutPage;