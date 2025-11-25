# Smart Task Analyzer — Enhanced

This project is an enhanced version of the Smart Task Analyzer. It includes: configurable weights via sliders, dependency graph (D3), Eisenhower matrix, alerts, and circular dependency detection.

## Setup
1. Backend
   - Create and activate virtualenv
   - pip install -r backend/requirements.txt
   - cd backend
   - python manage.py migrate
   - python manage.py runserver
2. Frontend
   - Open frontend/index.html in browser (if backend on different port, update fetch URLs in script.js)

## Notes
- API endpoints: POST /api/tasks/analyze/ and POST /api/tasks/suggest/
- You can pass custom weights in the body: { tasks: [...], weights: { w_u:0.4, w_i:0.3, w_e:0.2, w_d:0.1 } }
