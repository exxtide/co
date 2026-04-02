# Быстрый деплой на Render.com - Шпаргалка

## Предварительные требования

✅ Аккаунт на [render.com](https://render.com)
✅ Код загружен на GitHub
✅ Все изменения закоммичены

## Быстрый старт (3 шага)

### 1. Создать базу данных (2 минуты)

```
Dashboard → New + → PostgreSQL
Name: kofeinya-db
Region: Frankfurt
Plan: Free
→ Create Database
→ Скопировать Internal Database URL
```

### 2. Создать Backend (5 минут)

```
Dashboard → New + → Web Service
Repository: ваш-репозиторий
Name: kofeinya-backend
Root Directory: kofeinya_backend
Runtime: Python 3
Build Command: chmod +x build.sh && ./build.sh
Start Command: gunicorn kofeinya_backend.wsgi:application --bind 0.0.0.0:$PORT
Plan: Free
```

**Environment Variables:**
```
DJANGO_ENV = production
DJANGO_SECRET_KEY = [Generate]
DJANGO_DEBUG = false
DJANGO_ALLOWED_HOSTS = kofeinya-backend.onrender.com
CORS_ALLOWED_ORIGINS = https://kofeinya-frontend.onrender.com
DJANGO_CSRF_TRUSTED_ORIGINS = https://kofeinya-backend.onrender.com,https://kofeinya-frontend.onrender.com
FRONTEND_URL = https://kofeinya-frontend.onrender.com
DJANGO_BEHIND_PROXY = true
DATABASE_URL = [Internal Database URL из шага 1]
```

### 3. Создать Frontend (3 минуты)

```
Dashboard → New + → Static Site
Repository: ваш-репозиторий
Name: kofeinya-frontend
Root Directory: ponyatnaya-eda-main
Build Command: npm install && npm run build
Publish Directory: dist
Plan: Free
```

**Environment Variables:**
```
VITE_API_ORIGIN = https://kofeinya-backend.onrender.com
```

**Redirects/Rewrites:**
```
Source: /*
Destination: /index.html
Action: Rewrite
```

## После деплоя

### Обновить URL в переменных бэкенда

После создания фронтенда, вернитесь в бэкенд и замените:
- `kofeinya-backend` → ваш реальный URL бэкенда
- `kofeinya-frontend` → ваш реальный URL фронтенда

### Создать суперпользователя

```
Backend → Shell → python manage.py createsuperuser
```

## Готово! 🎉

Откройте URL фронтенда и проверьте работу сайта.

## Частые проблемы

**Бэкенд не запускается:**
- Проверьте DATABASE_URL (должен быть Internal, не External)
- Проверьте логи: Backend → Logs

**CORS ошибки:**
- Проверьте CORS_ALLOWED_ORIGINS (должен быть с https://)
- Обновите переменные с реальными URL
- Перезапустите бэкенд: Backend → Manual Deploy → Deploy latest commit

**Фронтенд показывает ошибки API:**
- Проверьте VITE_API_ORIGIN (должен быть с https://)
- Убедитесь, что бэкенд запущен и доступен

## Автоматический деплой

После настройки, каждый `git push` автоматически обновит приложение!

```bash
git add .
git commit -m "Update"
git push origin main
```

Render автоматически:
1. Обнаружит изменения
2. Соберет приложение
3. Применит миграции
4. Перезапустит сервисы

---

📖 Подробная инструкция: см. DEPLOY_RENDER.md
