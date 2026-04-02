# Инструкция по деплою на Render.com

## Подготовка

### 1. Создайте аккаунт на Render.com

1. Перейдите на [render.com](https://render.com)
2. Зарегистрируйтесь через GitHub (рекомендуется) или email
3. Подтвердите email

### 2. Подготовьте Git репозиторий

Если у вас еще нет репозитория на GitHub:

```bash
cd coffee-main
git init
git add .
git commit -m "Initial commit"
```

Создайте репозиторий на GitHub и загрузите код:

```bash
git remote add origin https://github.com/ваш-username/ваш-репозиторий.git
git branch -M main
git push -u origin main
```

## Автоматический деплой через render.yaml

### Вариант 1: Использование Blueprint (рекомендуется)

1. Войдите в [Render Dashboard](https://dashboard.render.com)
2. Нажмите **"New +"** → **"Blueprint"**
3. Подключите ваш GitHub репозиторий
4. Render автоматически обнаружит `render.yaml` и создаст все сервисы
5. Нажмите **"Apply"**

### Вариант 2: Ручная настройка

Если автоматический деплой не сработал, следуйте инструкциям ниже.

## Ручной деплой

### Шаг 1: Создание базы данных PostgreSQL

1. В Render Dashboard нажмите **"New +"** → **"PostgreSQL"**
2. Заполните форму:
   - **Name**: `kofeinya-db`
   - **Database**: `kofeinya`
   - **User**: `kofeinya`
   - **Region**: Frankfurt (или ближайший к вам)
   - **Plan**: Free
3. Нажмите **"Create Database"**
4. Дождитесь создания (2-3 минуты)
5. Скопируйте **Internal Database URL** (понадобится для бэкенда)

### Шаг 2: Деплой Backend (Django)

1. Нажмите **"New +"** → **"Web Service"**
2. Подключите ваш GitHub репозиторий
3. Заполните форму:
   - **Name**: `kofeinya-backend`
   - **Region**: Frankfurt
   - **Branch**: `main`
   - **Root Directory**: `kofeinya_backend`
   - **Runtime**: Python 3
   - **Build Command**: 
     ```bash
     chmod +x build.sh && ./build.sh
     ```
   - **Start Command**: 
     ```bash
     gunicorn kofeinya_backend.wsgi:application --bind 0.0.0.0:$PORT
     ```
   - **Plan**: Free

4. Добавьте переменные окружения (Environment Variables):

   Нажмите **"Advanced"** → **"Add Environment Variable"**

   ```
   DJANGO_ENV = production
   DJANGO_SECRET_KEY = [Generate] (нажмите кнопку Generate)
   DJANGO_DEBUG = false
   DJANGO_ALLOWED_HOSTS = kofeinya-backend.onrender.com
   CORS_ALLOWED_ORIGINS = https://kofeinya-frontend.onrender.com
   DJANGO_CSRF_TRUSTED_ORIGINS = https://kofeinya-backend.onrender.com,https://kofeinya-frontend.onrender.com
   FRONTEND_URL = https://kofeinya-frontend.onrender.com
   DJANGO_BEHIND_PROXY = true
   DATABASE_URL = [Internal Database URL из Шага 1]
   ```

   **Важно:** Замените `kofeinya-backend` и `kofeinya-frontend` на ваши реальные имена сервисов!

5. Нажмите **"Create Web Service"**
6. Дождитесь завершения деплоя (5-10 минут)
7. Скопируйте URL вашего бэкенда (например, `https://kofeinya-backend.onrender.com`)

### Шаг 3: Деплой Frontend (React/Vite)

1. Нажмите **"New +"** → **"Static Site"**
2. Подключите тот же GitHub репозиторий
3. Заполните форму:
   - **Name**: `kofeinya-frontend`
   - **Region**: Frankfurt
   - **Branch**: `main`
   - **Root Directory**: `ponyatnaya-eda-main`
   - **Build Command**: 
     ```bash
     npm install && npm run build
     ```
   - **Publish Directory**: `dist`

4. Добавьте переменную окружения:
   ```
   VITE_API_ORIGIN = https://kofeinya-backend.onrender.com
   ```
   (Используйте URL из Шага 2)

5. Добавьте правило перенаправления (Redirects/Rewrites):
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Action**: Rewrite

6. Нажмите **"Create Static Site"**
7. Дождитесь завершения деплоя (3-5 минут)

### Шаг 4: Обновление переменных окружения

После создания обоих сервисов, вернитесь к бэкенду и обновите переменные:

1. Откройте **kofeinya-backend** в Dashboard
2. Перейдите в **Environment**
3. Обновите переменные с реальными URL:
   - `DJANGO_ALLOWED_HOSTS` = ваш-backend-url.onrender.com
   - `CORS_ALLOWED_ORIGINS` = https://ваш-frontend-url.onrender.com
   - `DJANGO_CSRF_TRUSTED_ORIGINS` = https://ваш-backend-url.onrender.com,https://ваш-frontend-url.onrender.com
   - `FRONTEND_URL` = https://ваш-frontend-url.onrender.com

4. Нажмите **"Save Changes"**
5. Сервис автоматически перезапустится

### Шаг 5: Создание суперпользователя

1. Откройте **kofeinya-backend** в Dashboard
2. Перейдите в **Shell**
3. Выполните команды:
   ```bash
   python manage.py createsuperuser
   ```
4. Введите email, имя и пароль для администратора

## Проверка работы

1. Откройте URL фронтенда (например, `https://kofeinya-frontend.onrender.com`)
2. Проверьте, что сайт загружается
3. Попробуйте зарегистрироваться
4. Войдите как администратор и откройте админ-панель

## Настройка домена (опционально)

### Для бэкенда:

1. Откройте **kofeinya-backend** → **Settings**
2. Прокрутите до **Custom Domain**
3. Добавьте ваш домен (например, `api.yourdomain.com`)
4. Настройте DNS записи согласно инструкциям Render

### Для фронтенда:

1. Откройте **kofeinya-frontend** → **Settings**
2. Прокрутите до **Custom Domain**
3. Добавьте ваш домен (например, `yourdomain.com`)
4. Настройте DNS записи

После добавления домена обновите переменные окружения!

## Настройка email (опционально)

Для отправки писем подтверждения регистрации:

1. Создайте App Password в Gmail:
   - Перейдите в Google Account → Security
   - Включите 2FA
   - Создайте App Password

2. Добавьте переменные в бэкенд:
   ```
   EMAIL_BACKEND = django.core.mail.backends.smtp.EmailBackend
   EMAIL_HOST = smtp.gmail.com
   EMAIL_PORT = 587
   EMAIL_USE_TLS = true
   EMAIL_HOST_USER = your-email@gmail.com
   EMAIL_HOST_PASSWORD = your-app-password
   DEFAULT_FROM_EMAIL = noreply@yourdomain.com
   ```

## Мониторинг и логи

### Просмотр логов:

1. Откройте сервис в Dashboard
2. Перейдите в **Logs**
3. Здесь отображаются все логи приложения

### Метрики:

1. Откройте сервис в Dashboard
2. Перейдите в **Metrics**
3. Здесь можно увидеть использование CPU, памяти, запросов

## Обновление приложения

Render автоматически деплоит при каждом push в GitHub:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Render автоматически:
1. Обнаружит изменения
2. Запустит build
3. Применит миграции (для бэкенда)
4. Перезапустит сервис

## Ограничения Free плана

- **Backend**: 
  - 512 MB RAM
  - Засыпает после 15 минут неактивности
  - Первый запрос после сна занимает ~30 секунд
  - 750 часов в месяц

- **Frontend**: 
  - 100 GB bandwidth/месяц
  - Не засыпает

- **Database**: 
  - 1 GB хранилища
  - Автоматически удаляется через 90 дней

## Переход на платный план

Для production рекомендуется:
- **Backend**: Starter ($7/месяц) - не засыпает, больше ресурсов
- **Database**: Starter ($7/месяц) - не удаляется, больше места

## Troubleshooting

### Ошибка "Application failed to respond"

1. Проверьте логи бэкенда
2. Убедитесь, что `DATABASE_URL` правильный
3. Проверьте, что миграции применились

### Ошибка CORS

1. Проверьте `CORS_ALLOWED_ORIGINS` в бэкенде
2. Убедитесь, что URL фронтенда правильный (с https://)
3. Перезапустите бэкенд после изменения переменных

### Статика не загружается

1. Проверьте, что `collectstatic` выполнился в build.sh
2. Проверьте логи на ошибки
3. Убедитесь, что WhiteNoise установлен

### База данных не подключается

1. Проверьте, что `DATABASE_URL` скопирован правильно
2. Используйте **Internal Database URL**, а не External
3. Проверьте, что база данных создана и активна

## Полезные ссылки

- [Render Documentation](https://render.com/docs)
- [Django Deployment Checklist](https://docs.djangoproject.com/en/stable/howto/deployment/checklist/)
- [Render Community Forum](https://community.render.com/)

## Поддержка

Если возникли проблемы:
1. Проверьте логи в Render Dashboard
2. Посмотрите документацию Render
3. Задайте вопрос в Render Community Forum
