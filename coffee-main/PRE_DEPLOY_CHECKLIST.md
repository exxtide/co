# Чеклист перед деплоем

## ✅ Подготовка кода

- [ ] Все изменения закоммичены
- [ ] Код загружен на GitHub
- [ ] Проверена работа локально (backend + frontend)
- [ ] Нет критических ошибок в коде

## ✅ Backend (Django)

- [ ] `requirements.txt` содержит все зависимости:
  - gunicorn
  - whitenoise
  - psycopg2-binary
  - dj-database-url
  
- [ ] `settings.py` настроен:
  - Импортирован `dj_database_url`
  - Добавлен WhiteNoise в MIDDLEWARE
  - Настроена база данных с DATABASE_URL
  - Настроены STATIC_ROOT и STORAGES
  
- [ ] `build.sh` создан и содержит:
  - pip install
  - collectstatic
  - migrate
  
- [ ] `build.sh` имеет права на выполнение (chmod +x)

- [ ] Проверены миграции:
  ```bash
  python manage.py makemigrations
  python manage.py migrate
  ```

## ✅ Frontend (React/Vite)

- [ ] `.env.example` создан с VITE_API_ORIGIN
- [ ] `package.json` содержит скрипт build
- [ ] Локальная сборка работает:
  ```bash
  npm run build
  npm run preview
  ```

## ✅ Конфигурация

- [ ] `render.yaml` создан (для автоматического деплоя)
- [ ] `.gitignore` обновлен
- [ ] `.env` файлы НЕ закоммичены (только .env.example)

## ✅ Документация

- [ ] `DEPLOY_RENDER.md` - подробная инструкция
- [ ] `QUICK_DEPLOY.md` - быстрая шпаргалка
- [ ] `README.md` обновлен (если нужно)

## ✅ Безопасность

- [ ] SECRET_KEY не захардкожен в коде
- [ ] DEBUG=False для продакшена
- [ ] Нет паролей и токенов в коде
- [ ] .env файлы в .gitignore

## ✅ Тестирование

- [ ] Проверена регистрация пользователя
- [ ] Проверен вход в систему
- [ ] Проверена админ-панель
- [ ] Проверено создание заказа
- [ ] Проверена работа API

## ✅ После деплоя

- [ ] Создан суперпользователь
- [ ] Проверена работа сайта
- [ ] Проверены логи на ошибки
- [ ] Настроены переменные окружения с реальными URL
- [ ] Проверена работа CORS
- [ ] Проверена загрузка статики
- [ ] Проверена работа медиа файлов

## Команды для проверки локально

### Backend:

```bash
cd coffee-main/kofeinya_backend

# Проверка зависимостей
pip install -r requirements.txt

# Проверка миграций
python manage.py makemigrations --check
python manage.py migrate --check

# Проверка статики
python manage.py collectstatic --noinput --dry-run

# Запуск сервера
python manage.py runserver
```

### Frontend:

```bash
cd coffee-main/ponyatnaya-eda-main

# Установка зависимостей
npm install

# Проверка сборки
npm run build

# Проверка типов
npm run typecheck

# Запуск preview
npm run preview
```

## Готово к деплою! 🚀

Если все пункты отмечены, можно приступать к деплою на Render.com!

См. QUICK_DEPLOY.md для быстрого старта или DEPLOY_RENDER.md для подробной инструкции.
