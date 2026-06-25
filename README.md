# Expense Tracker

A simple full-stack web app to track income and expenses, built with **Flask** (backend) and **React** (frontend).

## Features

- Add income and expense transactions with a category and date
- Delete transactions
- See total income, total expenses, and current balance
- Pie chart showing expenses by category (Chart.js)

## Tech Stack

- **Backend:** Python, Flask, SQLite
- **Frontend:** React, Chart.js

## Project Structure

```
expense-tracker/
├── backend/
│   ├── app.py              # All Flask routes + database logic
│   └── requirements.txt
└── frontend/
    ├── public/index.html
    └── src/
        ├── App.js          # Whole UI in one component
        ├── index.js
        └── index.css
```

## How to run

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate      # on Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

The API runs at `http://localhost:5001`. A file `expenses.db` is created automatically the first time you run it, with a few default categories already inside.

### 2. Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm start
```

The app opens at `http://localhost:3000`.

## How it works

- The database has only **2 tables**: `categories` and `transactions`.
- There is **no login** — it's a single-user app, all data is stored locally in `expenses.db`.
- The whole frontend is **one component** (`App.js`) using `useState` and `useEffect` — no routing, no global state libraries.
- The backend is **one file** (`app.py`) with simple Flask routes that read/write to SQLite using plain SQL queries.

## Possible improvements

- Add edit functionality for transactions
- Add monthly filters
- Add a login system
- Deploy online (e.g. Render for backend, Vercel for frontend)

