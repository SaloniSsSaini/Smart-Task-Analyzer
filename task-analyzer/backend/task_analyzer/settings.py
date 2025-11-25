import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = 'dev-key'
DEBUG = True
ALLOWED_HOSTS = []


INSTALLED_APPS = [
'django.contrib.contenttypes',
'django.contrib.staticfiles',
'rest_framework',
'tasks',
]
MIDDLEWARE = ['django.middleware.common.CommonMiddleware']
ROOT_URLCONF = 'task_analyzer.urls'
STATIC_URL = '/static/'
STATICFILES_DIRS = [os.path.join(BASE_DIR.parent, 'frontend')]


DATABASES = { 'default': { 'ENGINE': 'django.db.backends.sqlite3', 'NAME': BASE_DIR / 'db.sqlite3' } }


REST_FRAMEWORK = { }