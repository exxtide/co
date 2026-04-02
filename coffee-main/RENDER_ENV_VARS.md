# Переменные окружения для Render.com

## Backend Environment Variables

Скопируйте эти переменные в Render Dashboard → Backend Service → Environment

```
DJANGO_ENV
production

DJANGO_SECRET_KEY
[Нажмите Generate в Render]

DJANGO_DEBUG
false

DJANGO_ALLOWED_HOSTS
your-backend-name.onrender.com

CORS_ALLOWED_ORIGINS
https://your-frontend-name.onrender.com

DJANGO_CSRF_TRUSTED_ORIGINS
https://your-backend-name.onrender.com,https://your-frontend-name.onrender.com

FRONTEND_URL
https://your-frontend-name.onrender.com

DJANGO_BEHIND_PROXY
true

DJANGO_ADMIN_EMAIL
admin@example.com

DJANGO_ADMIN_PASSWORD
YourSecurePassword123!

DJANGO_ADMIN_NAME
Admin

DATABASE_URL
[Скопируйте Internal Database URL из PostgreSQL сервиса]
```

## Frontend Environment Variables

Скопируйте эти переменные в Render Dashboard → Frontend Service → Environment

```
VITE_API_ORIGIN
https://your-backend-name.onrender.com
```

## Опциональные переменные (Email)

Если хотите настроить отправку email:

```
EMAIL_BACKEND
django.core.mail.backends.smtp.EmailBackend

EMAIL_HOST
smtp.gmail.com

EMAIL_PORT
587

EMAIL_USE_TLS
true

EMAIL_HOST_USER
your-email@gmail.com

EMAIL_HOST_PASSWORD
your-app-password

DEFAULT_FROM_EMAIL
noreply@yourdomain.com
```

## Опциональные переменные (DaData)

Для автоподстановки адресов:

```
DADATA_TOKEN
your-dadata-token
```

---

## Важные замечания:

1. **Замените placeholder значения:**
   - `your-backend-name` → реальное имя вашего backend сервиса
   - `your-frontend-name` → реальное имя вашего frontend сервиса

2. **DATABASE_URL:**
   - Используйте **Internal Database URL**, не External
   - Найдите его в: PostgreSQL Service → Connect → Internal Database URL

3. **DJANGO_SECRET_KEY:**
   - Используйте кнопку "Generate" в Render
   - Или сгенерируйте свой: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`

4. **DJANGO_ADMIN_EMAIL и DJANGO_ADMIN_PASSWORD:**
   - ⚠️ **ОБЯЗАТЕЛЬНО установите эти переменные!**
   - Администратор будет создан автоматически при первом деплое
   - Email будет использоваться как username для входа
   - Используйте надежный пароль (минимум 8 символов)
   - **ВАЖНО:** Смените пароль после первого входа!

5. **DJANGO_ADMIN_NAME:**
   - Опционально, по умолчанию "Admin"
   - Это имя будет отображаться в админ-панели

6. **После создания сервисов:**
   - Вернитесь и обновите URL с placeholder на реальные
   - Сохраните изменения
   - Сервисы автоматически перезапустятся

7. **HTTPS обязателен:**
   - Все URL должны начинаться с `https://`
   - Render автоматически предоставляет SSL сертификаты

## Проверка переменных

После настройки проверьте:

```bash
# В Backend Shell (Render Dashboard → Backend → Shell)
python manage.py shell

>>> import os
>>> print(os.environ.get('DJANGO_ALLOWED_HOSTS'))
>>> print(os.environ.get('DATABASE_URL'))
>>> print(os.environ.get('CORS_ALLOWED_ORIGINS'))
```

Все переменные должны отображаться правильно.
