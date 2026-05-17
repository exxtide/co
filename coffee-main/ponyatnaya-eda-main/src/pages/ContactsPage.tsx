import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Navigation, MessageCircle } from 'lucide-react';

const ContactsPage: React.FC = () => {

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  const contacts = [
    { icon: MapPin, title: 'Адрес', value: 'Ульяновск, улица Железной Дивизии, 7', link: null },
    { icon: Phone, title: 'Телефон', value: '+7 (842) 123-45-67', link: 'tel:+78421234567' },
    { icon: Mail, title: 'Email', value: 'info@ponyatnaya-eda.ru', link: 'mailto:info@ponyatnaya-eda.ru' },
    { icon: Clock, title: 'Время работы', value: 'Ежедневно с 9:00 до 22:00', link: null },
  ];

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
            <h1 className="text-4xl md:text-5xl font-bold mb-6 font-alternates">Контакты</h1>
            <p className="text-xl md:text-2xl mb-8">
              Мы всегда на связи и готовы ответить на ваши вопросы
            </p>
          </motion.div>
        </div>
      </section>

      {/* Контактная информация */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {contacts.map((contact, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="bg-gray-50 rounded-lg p-6 text-center shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <contact.icon size={32} className="text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{contact.title}</h3>
                {contact.link ? (
                  <a
                    href={contact.link}
                    className="text-gray-600 hover:text-red-600 transition-colors"
                  >
                    {contact.value}
                  </a>
                ) : (
                  <p className="text-gray-600">{contact.value}</p>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Карта и как нас найти */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-4 font-alternates">Как нас найти</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Мы находимся в центре Ульяновска и доставляем по всему городу
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Блок с дополнительной информацией */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Navigation size={24} className="text-red-600" />
                  Как добраться
                </h3>
                <div className="space-y-4 text-gray-600">
                  <p>
                    <strong className="text-gray-800">На общественном транспорте:</strong> Остановка «улица Железной Дивизии» (автобусы № 2, 5, 10, маршрутки № 15, 27).
                  </p>
                  <p>
                    <strong className="text-gray-800">На автомобиле:</strong> Бесплатная парковка перед зданием. Вход со стороны главного фасада.
                  </p>
                  <p>
                    <strong className="text-gray-800">Для доставки:</strong> Мы работаем ежедневно с 9:00 до 22:00. Доставка в пределах города — от 30 минут.
                  </p>
                </div>
              </div>

              <div className="bg-red-50 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-red-800">Свяжитесь с нами</h3>
                <div className="space-y-3">
                  <a
                    href="tel:+78421234567"
                    className="flex items-center gap-3 text-red-700 hover:text-red-800 transition-colors"
                  >
                    <Phone size={20} />
                    <span>+7 (842) 123-45-67</span>
                  </a>
                  <a
                    href="mailto:info@ponyatnaya-eda.ru"
                    className="flex items-center gap-3 text-red-700 hover:text-red-800 transition-colors"
                  >
                    <Mail size={20} />
                    <span>info@ponyatnaya-eda.ru</span>
                  </a>
                  <a
                    href="#"
                    className="flex items-center gap-3 text-red-700 hover:text-red-800 transition-colors"
                  >
                    <MessageCircle size={20} />
                    <span>WhatsApp / Telegram</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Карта */}
            <div className="bg-gray-100 rounded-lg overflow-hidden h-96 relative shadow-md">
              <div style={{position:'relative',overflow:'hidden',width:'100%',height:'100%'}}>
                <a href="https://yandex.ru/maps/org/ponyatnaya_yeda/218896215154/?utm_medium=mapframe&utm_source=maps" style={{color:'#eee',fontSize:'12px',position:'absolute',top:'0px'}}>Понятная Еда</a>
                <a href="https://yandex.ru/maps/195/ulyanovsk/category/cafe/184106390/?utm_medium=mapframe&utm_source=maps" style={{color:'#eee',fontSize:'12px',position:'absolute',top:'14px'}}>Кафе в Ульяновске</a>
                <a href="https://yandex.ru/maps/195/ulyanovsk/category/fast_food/184106386/?utm_medium=mapframe&utm_source=maps" style={{color:'#eee',fontSize:'12px',position:'absolute',top:'28px'}}>Быстрое питание в Ульяновске</a>
                <iframe src="https://yandex.ru/map-widget/v1/?ll=48.387534%2C54.310921&mode=search&oid=218896215154&ol=biz&sctx=ZAAAAAgBEAAaKAoSCUbu6eqOMUhAEWQ6dHreJ0tAEhIJdCMsKuJ0cj8RJ2ppboWwWj8iBgABAgMEBSgKOABAwwFIAWoCcnWdAc3MzD2gAQCoAQC9ARFr7VrCAQby2Oy5rwaCAhfQn9C%2B0L3Rj9GC0L3QsNGPINC10LTQsIoCAJICAJoCDGRlc2t0b3AtbWFwcw%3D%3D&sll=48.387405%2C54.310921&sspn=0.000909%2C0.000329&text=%D0%9F%D0%BE%D0%BD%D1%8F%D1%82%D0%BD%D0%B0%D1%8F%20%D0%B5%D0%B4%D0%B0&z=21" width="100%" height="100%" frameBorder="0" allowFullScreen={true} style={{position:'relative'}}></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Призыв к действию */}
      <section className="py-16 bg-red-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-4 font-alternates">Готовы сделать заказ?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Свяжитесь с нами любым удобным способом, и мы поможем выбрать идеальный торт
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a
                href="tel:+78421234567"
                className="inline-block bg-white text-red-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
              >
                Позвонить
              </a>
              <a
                href="/catalog"
                className="inline-block bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/10 transition-colors"
              >
                Перейти в каталог
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
};

export default ContactsPage;
