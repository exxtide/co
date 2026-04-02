# Кофейня - Сайт для заказа еды и напитков

Полнофункциональный веб-сайт для кофейни с возможностью онлайн-заказа, админ-панелью и системой управления заказами.

## 🚀 Технологии

### Backend
- Django 6.0.3
- Django REST Framework
- PostgreSQL (продакшен) / SQLite (разработка)
- Token Authentication
- WhiteNoise для статики

### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS
- Axios
- React Router

## 📋 Возможности

### Для клиентов:
- ✅ Регистрация и авторизация
- ✅ Просмотр меню с категориями и подкатегориями
- ✅ Добавление товаров в корзину
- ✅ Оформление заказа (доставка или в заведении)
- ✅ История заказов с русскими статусами
- ✅ Отмена заказа
- ✅ Личный кабинет

### Для администраторов:
- ✅ Управление текущими заказами
- ✅ История заказов с фильтром по дате
- ✅ Кнопка "Завершить" для заказов
- ✅ Управление товарами (добавление, редактирование, удаление)
- ✅ Управление категориями и подкатегориями
- ✅ Удаление категорий и подкатегорий
- ✅ Управление акциями
- ✅ Уведомления о новых заказах

## 🛠️ Локальная разработка

### Требования
- Python 3.11+
- Node.js 16+
- npm или yarn

### Backend

```bash
cd coffee-main/kofeinya_backend

# Создать виртуальное окружение
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate  # Windows

# Установить зависимости
pip install -r requirements.txt

# Применить миграции
python manage.py migrate

# Создать суперпользователя
python manage.py createsuperuser

# Запустить сервер
python manage.py runserver
```

Backend будет доступен на http://127.0.0.1:8000

### Frontend

```bash
cd coffee-main/ponyatnaya-eda-main

# Установить зависимости
npm install

# Создать .env файл
cp .env.example .env
# Отредактировать .env и указать VITE_API_ORIGIN=http://127.0.0.1:8000

# Запустить dev-сервер
npm run dev
```

Frontend будет доступен на http://localhost:5173

## 🌐 Деплой на Render.com

### Быстрый старт

См. [QUICK_DEPLOY.md](QUICK_DEPLOY.md) для быстрой инструкции (10 минут)

### Подробная инструкция

См. [DEPLOY_RENDER.md](DEPLOY_RENDER.md) для детальной инструкции со всеми настройками

### Чеклист перед деплоем

См. [PRE_DEPLOY_CHECKLIST.md](PRE_DEPLOY_CHECKLIST.md) для проверки готовности к деплою

## 📝 Последние изменения

См. [CHANGES.md](CHANGES.md) для списка последних изменений и новых функций

## 🧪 Тестирование

См. [TESTING.md](TESTING.md) для инструкций по тестированию функционала

## 📁 Структура проекта

```
coffee-main/
├── kofeinya_backend/          # Django Backend
│   ├── accounts/              # Приложение аутентификации
│   ├── menu/                  # Приложение меню и заказов
│   ├── kofeinya_backend/      # Настройки проекта
│   ├── media/                 # Загруженные файлы
│   ├── requirements.txt       # Python зависимости
│   ├── build.sh              # Скрипт сборки для Render
│   └── manage.py             # Django CLI
│
├── ponyatnaya-eda-main/      # React Frontend
│   ├── src/
│   │   ├── components/       # React компоненты
│   │   ├── contexts/         # React контексты
│   │   ├── pages/            # Страницы
│   │   ├── services/         # API сервисы
│   │   └── App.tsx           # Главный компонент
│   ├── package.json          # npm зависимости
│   └── vite.config.ts        # Конфигурация Vite
│
├── render.yaml               # Конфигурация Render
├── DEPLOY_RENDER.md          # Инструкция по деплою
├── QUICK_DEPLOY.md           # Быстрая инструкция
└── README.md                 # Этот файл
```

## 🔐 Переменные окружения

### Backend (.env)

```env
DJANGO_ENV=production
DJANGO_SECRET_KEY=your-secret-key
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=your-domain.com
CORS_ALLOWED_ORIGINS=https://your-frontend.com
DJANGO_CSRF_TRUSTED_ORIGINS=https://your-backend.com
FRONTEND_URL=https://your-frontend.com
DATABASE_URL=postgresql://...
```

### Frontend (.env)

```env
VITE_API_ORIGIN=https://your-backend.com
```

## 🤝 Вклад в проект

1. Fork проекта
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'Add some AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

## 📄 Лицензия

Этот проект создан для образовательных целей.

## 📞 Поддержка

Если возникли вопросы или проблемы:
1. Проверьте документацию в папке проекта
2. Посмотрите логи приложения
3. Создайте Issue в репозитории

## 🎯 Roadmap

- [ ] Интеграция онлайн-оплаты
- [ ] Push-уведомления для клиентов
- [ ] Мобильное приложение
- [ ] Программа лояльности
- [ ] Отзывы и рейтинги товаров
- [ ] Интеграция с доставкой

---

Сделано с ❤️ для любителей кофе
