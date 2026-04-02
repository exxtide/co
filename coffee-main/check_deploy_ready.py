#!/usr/bin/env python3
"""
Скрипт для проверки готовности проекта к деплою на Render.com
"""

import os
import sys
from pathlib import Path

def check_file_exists(file_path, description):
    """Проверка существования файла"""
    if Path(file_path).exists():
        print(f"✅ {description}: {file_path}")
        return True
    else:
        print(f"❌ {description} не найден: {file_path}")
        return False

def check_file_contains(file_path, search_string, description):
    """Проверка содержимого файла"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            if search_string in content:
                print(f"✅ {description}")
                return True
            else:
                print(f"❌ {description} - не найдено: {search_string}")
                return False
    except Exception as e:
        print(f"❌ Ошибка чтения {file_path}: {e}")
        return False

def main():
    print("=" * 60)
    print("Проверка готовности к деплою на Render.com")
    print("=" * 60)
    print()
    
    checks_passed = 0
    checks_total = 0
    
    # Проверка структуры проекта
    print("📁 Проверка структуры проекта:")
    print("-" * 60)
    
    checks_total += 1
    if check_file_exists("kofeinya_backend/manage.py", "Backend manage.py"):
        checks_passed += 1
    
    checks_total += 1
    if check_file_exists("ponyatnaya-eda-main/package.json", "Frontend package.json"):
        checks_passed += 1
    
    print()
    
    # Проверка Backend файлов
    print("🐍 Проверка Backend файлов:")
    print("-" * 60)
    
    checks_total += 1
    if check_file_exists("kofeinya_backend/requirements.txt", "requirements.txt"):
        checks_passed += 1
        
        # Проверка зависимостей
        checks_total += 1
        if check_file_contains("kofeinya_backend/requirements.txt", "gunicorn", "gunicorn в requirements.txt"):
            checks_passed += 1
        
        checks_total += 1
        if check_file_contains("kofeinya_backend/requirements.txt", "whitenoise", "whitenoise в requirements.txt"):
            checks_passed += 1
        
        checks_total += 1
        if check_file_contains("kofeinya_backend/requirements.txt", "psycopg2-binary", "psycopg2-binary в requirements.txt"):
            checks_passed += 1
        
        checks_total += 1
        if check_file_contains("kofeinya_backend/requirements.txt", "dj-database-url", "dj-database-url в requirements.txt"):
            checks_passed += 1
    
    checks_total += 1
    if check_file_exists("kofeinya_backend/build.sh", "build.sh"):
        checks_passed += 1
    
    checks_total += 1
    if check_file_exists("kofeinya_backend/runtime.txt", "runtime.txt"):
        checks_passed += 1
    
    checks_total += 1
    if check_file_exists("kofeinya_backend/Procfile", "Procfile"):
        checks_passed += 1
    
    checks_total += 1
    if check_file_exists("kofeinya_backend/accounts/management/commands/create_default_admin.py", "create_default_admin.py команда"):
        checks_passed += 1
    
    # Проверка settings.py
    checks_total += 1
    if check_file_contains("kofeinya_backend/kofeinya_backend/settings.py", "dj_database_url", "dj_database_url импортирован"):
        checks_passed += 1
    
    checks_total += 1
    if check_file_contains("kofeinya_backend/kofeinya_backend/settings.py", "whitenoise", "WhiteNoise в MIDDLEWARE"):
        checks_passed += 1
    
    checks_total += 1
    if check_file_contains("kofeinya_backend/kofeinya_backend/settings.py", "STATIC_ROOT", "STATIC_ROOT настроен"):
        checks_passed += 1
    
    print()
    
    # Проверка Frontend файлов
    print("⚛️  Проверка Frontend файлов:")
    print("-" * 60)
    
    checks_total += 1
    if check_file_exists("ponyatnaya-eda-main/.env.example", ".env.example"):
        checks_passed += 1
    
    checks_total += 1
    if check_file_contains("ponyatnaya-eda-main/package.json", '"build"', "build скрипт в package.json"):
        checks_passed += 1
    
    print()
    
    # Проверка конфигурации Render
    print("🚀 Проверка конфигурации Render:")
    print("-" * 60)
    
    checks_total += 1
    if check_file_exists("render.yaml", "render.yaml"):
        checks_passed += 1
    
    print()
    
    # Проверка документации
    print("📚 Проверка документации:")
    print("-" * 60)
    
    checks_total += 1
    if check_file_exists("DEPLOY_RENDER.md", "DEPLOY_RENDER.md"):
        checks_passed += 1
    
    checks_total += 1
    if check_file_exists("QUICK_DEPLOY.md", "QUICK_DEPLOY.md"):
        checks_passed += 1
    
    checks_total += 1
    if check_file_exists("PRE_DEPLOY_CHECKLIST.md", "PRE_DEPLOY_CHECKLIST.md"):
        checks_passed += 1
    
    print()
    
    # Проверка .gitignore
    print("🔒 Проверка безопасности:")
    print("-" * 60)
    
    checks_total += 1
    if check_file_contains(".gitignore", ".env", ".env в .gitignore"):
        checks_passed += 1
    
    checks_total += 1
    if check_file_contains(".gitignore", "*.sqlite3", "*.sqlite3 в .gitignore"):
        checks_passed += 1
    
    checks_total += 1
    if not check_file_exists("kofeinya_backend/.env", ".env файл НЕ должен быть в репозитории"):
        checks_passed += 1
        print("✅ .env файл не найден (это хорошо!)")
    else:
        print("⚠️  ВНИМАНИЕ: .env файл найден! Убедитесь, что он в .gitignore")
    
    print()
    
    # Итоги
    print("=" * 60)
    print(f"Результат: {checks_passed}/{checks_total} проверок пройдено")
    print("=" * 60)
    
    if checks_passed == checks_total:
        print("🎉 Отлично! Проект готов к деплою на Render.com!")
        print()
        print("Следующие шаги:")
        print("1. Закоммитьте все изменения: git add . && git commit -m 'Ready for deploy'")
        print("2. Загрузите на GitHub: git push origin main")
        print("3. Следуйте инструкциям в QUICK_DEPLOY.md")
        return 0
    else:
        print(f"⚠️  Внимание! Не пройдено {checks_total - checks_passed} проверок.")
        print("Исправьте ошибки перед деплоем.")
        print()
        print("См. PRE_DEPLOY_CHECKLIST.md для подробностей.")
        return 1

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\nПроверка прервана пользователем.")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Ошибка: {e}")
        sys.exit(1)
