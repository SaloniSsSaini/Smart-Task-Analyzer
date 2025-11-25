

# 🚀 Smart Task Analyzer — Advanced Neon Edition

A full-featured **AI-inspired Task Prioritization System** built using  
**Django + Django REST Framework + Vanilla JavaScript + Mixed Neon UI theme**.

This project intelligently analyzes and prioritizes tasks using multiple weighted factors:
- **Urgency**
- **Importance**
- **Effort**
- **Dependencies**
- **Circular dependency detection**
- **Scenario simulation**
- **ML-like feedback learning**

The frontend features a **beautiful Mixed Neon UI** with glowing accents, colorful priorities and a modern dashboard feel.

---

# 🌈 UI Preview (Mixed Neon Jull Theme)

*(You can replace this screenshot with your own inside the repo)*

---

# 📌 Features Overview

### 🔥 Core Features
| Feature | Description |
|--------|-------------|
| **Smart Priority Engine** | Weighted multi-factor score generation |
| **Custom Strategies** | Fastest Wins, High Impact, Deadline Driven, Smart Balance |
| **Circular Dependency Detection** | Highlights blocking loops |
| **Top 3 Suggestions** | High-priority actionable tasks |
| **Bulk JSON Input** | Add many tasks at once |
| **CSV Export** | Generate CSV report |
| **Neon UI + Responsive layout** | Modern, glowing interface |

---

# 🌟 Advanced Features (Enabled)

- 🧠 **AI-like scoring with adjustable weights**  
- 🗂 **Kanban board** (drag & drop)  
- 🎤 **Voice input support**  
- 🔍 **Advanced search & filters**  
- 📈 **Dashboard charts (ready for Chart.js)**  
- 📅 **Calendar View (UI-ready)**  
- 🧵 **Gantt Chart View (UI-ready)**  
- 🔌 **Plugin-ready scoring extensions**  
- 📈 **Scenario simulation mode**  
- 🔄 **Real-time collaboration (Channels-ready)**  
- 🧩 **ML-like Feedback Learning** (`/feedback/` endpoint)  

---

# 🧱 Project Architecture

```
task-analyzer/
│
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── task_analyzer/
│   │   ├── settings.py
│   │   ├── urls.py
│   └── tasks/
│       ├── scoring.py
│       ├── serializers.py
│       ├── views.py
│       ├── urls.py
│       └── tests.py
│
└── frontend/
    ├── index.html
    ├── script.js
    └── styles.css
```

---

# ⚙️ Backend Setup (Django)

```bash
cd backend
python -m venv venv
venv\Scripts\activate     # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Backend starts at:
```
http://127.0.0.1:8000/
```

---

# 🎨 Frontend Setup

Open directly:

```
frontend/index.html
```

OR run via Live Server in VS Code.

---

# 🛠 API Documentation

## 1️⃣ POST /api/tasks/analyze/
Analyzes tasks and returns:
- Score  
- Explanation  
- Errors  
- Cycle detection  

---

## 2️⃣ POST /api/tasks/suggest/
Returns:
- Top 3 high-priority tasks  
- Alerts  
- Cycles  

---

## 3️⃣ POST /api/tasks/export/
Exports analysis to CSV.

---

## 4️⃣ POST /api/tasks/feedback/
Records user feedback:
```json
{ "task_id": "123", "label": "helpful" }
```

Used for ML-like adaptive scoring.

---

# 🧪 Testing

```bash
python manage.py test
```

---

# 🚀 Future Improvements

- Calendar API sync  
- Real-time collab mode  
- AI-powered task rewriting  
- Reminder notifications  
- Team priority management  

---

# 🕒 Time Breakdown

| Task | Time |
|------|------|
| Backend scoring engine | 1 hr |
| REST API development | 1 hr |
| UI + Neon Theme | 1 hr |
| Advanced features | 1 hr |
| README Documentation | 20 mins |

---

# 👩‍💻 Author  
**Saloni Saini**  
Smart Task Analyzer — Advanced Neon Edition
