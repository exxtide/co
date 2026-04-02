# 🚀 Начните здесь - Деплой на Render.com

## ✅ Проект готов к деплою!

Все необходимые файлы созданы и настроены. Следуйте этой инструкции для быстрого деплоя.

---

## 📋 Что было сделано

✅ Backend настроен для продакшена:
- Добавлены зависимости: gunicorn, whitenoise, psycopg2-binary, dj-database-url
- Настроена поддержка PostgreSQL
- Настроена раздача статики через WhiteNoise
- Создан скрипт сборки build.sh

✅ Frontend готов к деплою:
- Создан .env.example с переменными
- Настроена сборка через Vite

✅ Конфигурация Render:
- Создан render.yaml для автоматического деплоя
- Созданы все необходимые файлы

✅ Документация:
- Подробная инструкция (DEPLOY_RENDER.md)
- Быстрая шпаргалка (QUICK_DEPLOY.md)
- Чеклист (PRE_DEPLOY_CHECKLIST.md)
- Переменные окружения (RENDER_ENV_VARS.md)

---

## 🎯 Выберите способ деплоя

### Вариант 1: Автоматический (рекомендуется) ⚡

Самый быстрый способ - Render автоматически создаст все сервисы из render.yaml:

1. **Загрузите код на GitHub:**
   ```bash
   cd coffee-main
   git add .
   git commit -m "Ready for Render deploy"
   git push origin main
   ```

2. **Создайте Blueprint на Render:**
   - Войдите на [render.com](https://render.com)
   - Нажмите **"New +"** → **"Blueprint"**
   - Выберите ваш репозиторий
   - Render обнаружит `render.yaml`
   - Нажмите **"Apply"**

3. **Дождитесь создания сервисов** (5-10 минут)

4. **Обновите переменные окружения:**
   - Откройте Backend сервис
   - Перейдите в Environment
   - Замените placeholder URL на реальные
   - Сохраните (сервис перезапустится)

5. **Создайте суперпользователя:**
   - Backend → Shell
   - `python manage.py createsuperuser`

**Готово!** 🎉

---

### Вариант 2: Ручной (пошаговый) 🔧

Если автоматический способ не сработал:

📖 **Следуйте инструкции:** [QUICK_DEPLOY.md](QUICK_DEPLOY.md)

Это займет ~15 минут и включает:
1. Создание PostgreSQL базы данных
2. Создание Backend сервиса
3. Создание Frontend сервиса
4. Настройку переменных окружения

---

## 📚 Полезные документы

| Документ | Описание |
|----------|----------|
| [QUICK_DEPLOY.md](QUICK_DEPLOY.md) | Быстрая инструкция (15 минут) |
| [DEPLOY_RENDER.md](DEPLOY_RENDER.md) | Подробная инструкция со всеми деталями |
| [PRE_DEPLOY_CHECKLIST.md](PRE_DEPLOY_CHECKLIST.md) | Чеклист перед деплоем |
| [RENDER_ENV_VARS.md](RENDER_ENV_VARS.md) | Все переменные окружения для копирования |
| [README.md](README.md) | Общая информация о проекте |
| [CHANGES.md](CHANGES.md) | Последние изменения |

---

## 🔍 Проверка готовности

Запустите скрипт проверки:

```bash
cd coffee-main
python check_deploy_ready.py
```

Должно быть: **22/22 проверок пройдено** ✅

---

## ⚡ Быстрые команды

### Проверка локально перед деплоем:

```bash
# Backend
cd coffee-main/kofeinya_backend
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py runserver

# Frontend (в другом терминале)
cd coffee-main/ponyatnaya-eda-main
npm install
npm run build
npm run preview
```

### Загрузка на GitHub:

```bash
cd coffee-main
git init  # если еще не инициализирован
git add .
git commit -m "Ready for Render deploy"
git remote add origin https://github.com/ваш-username/ваш-репозиторий.git
git push -u origin main
```

---

## 🆘 Нужна помощь?

### Проблемы при деплое:

1. **Проверьте логи** в Render Dashboard → Сервис → Logs
2. **Посмотрите Troubleshooting** в [DEPLOY_RENDER.md](DEPLOY_RENDER.md)
3. **Проверьте переменные окружения** - самая частая причина ошибок

### Частые ошибки:

- **"Application failed to respond"** → Проверьте DATABASE_URL
- **CORS ошибки** → Проверьте CORS_ALLOWED_ORIGINS (должен быть с https://)
- **Статика не загружается** → Проверьте логи collectstatic

---

## 💰 Стоимость

**Free план включает:**
- Backend: 512 MB RAM, засыпает после 15 мин неактивности
- Frontend: 100 GB bandwidth/месяц
- Database: 1 GB, удаляется через 90 дней

**Для production рекомендуется:**
- Backend Starter: $7/месяц (не засыпает)
- Database Starter: $7/месяц (не удаляется)

---

## 🎉 После успешного деплоя

1. ✅ Откройте URL фронтенда
2. ✅ Зарегистрируйте тестового пользователя
3. ✅ Войдите как администратор
4. ✅ Проверьте админ-панель
5. ✅ Создайте тестовый заказ

---

## 📞 Поддержка

- [Render Documentation](https://render.com/docs)
- [Render Community Forum](https://community.render.com/)
- [Django Deployment Checklist](https://docs.djangoproject.com/en/stable/howto/deployment/checklist/)

---

## 🚀 Готовы начать?

1. **Автоматический деплой:** Загрузите на GitHub → Создайте Blueprint
2. **Ручной деплой:** Откройте [QUICK_DEPLOY.md](QUICK_DEPLOY.md)

**Удачи с деплоем!** 🎊
