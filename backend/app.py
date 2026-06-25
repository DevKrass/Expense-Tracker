from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app)  # allows the React app (different port) to talk to this API

DB_NAME = "expenses.db"


# ---------- Database helpers ----------

def get_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row  # lets us access columns by name
    return conn


def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL  -- 'income' or 'expense'
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT,
            amount REAL NOT NULL,
            type TEXT NOT NULL,        -- 'income' or 'expense'
            category_id INTEGER,
            date TEXT NOT NULL,
            FOREIGN KEY (category_id) REFERENCES categories (id)
        )
    """)

    # Insert some default categories the first time the app runs
    cursor.execute("SELECT COUNT(*) FROM categories")
    if cursor.fetchone()[0] == 0:
        default_categories = [
            ("Food", "expense"),
            ("Transport", "expense"),
            ("Rent", "expense"),
            ("Fun", "expense"),
            ("Other", "expense"),
            ("Salary", "income"),
            ("Other Income", "income"),
        ]
        cursor.executemany("INSERT INTO categories (name, type) VALUES (?, ?)", default_categories)

    conn.commit()
    conn.close()


# ---------- Routes: Categories ----------

@app.route("/api/categories", methods=["GET"])
def get_categories():
    conn = get_connection()
    categories = conn.execute("SELECT * FROM categories").fetchall()
    conn.close()
    return jsonify([dict(c) for c in categories])


# ---------- Routes: Transactions ----------

@app.route("/api/transactions", methods=["GET"])
def get_transactions():
    conn = get_connection()
    # Join with categories so we get the category name directly
    transactions = conn.execute("""
        SELECT t.*, c.name AS category_name
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        ORDER BY t.date DESC
    """).fetchall()
    conn.close()
    return jsonify([dict(t) for t in transactions])


@app.route("/api/transactions", methods=["POST"])
def add_transaction():
    data = request.get_json()

    description = data.get("description", "")
    amount = data.get("amount")
    type_ = data.get("type")
    category_id = data.get("category_id")
    date = data.get("date")

    if not amount or not type_ or not date:
        return jsonify({"error": "amount, type and date are required"}), 400

    conn = get_connection()
    conn.execute(
        "INSERT INTO transactions (description, amount, type, category_id, date) VALUES (?, ?, ?, ?, ?)",
        (description, amount, type_, category_id, date),
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "Transaction added"}), 201


@app.route("/api/transactions/<int:transaction_id>", methods=["DELETE"])
def delete_transaction(transaction_id):
    conn = get_connection()
    conn.execute("DELETE FROM transactions WHERE id = ?", (transaction_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Transaction deleted"})


# ---------- Routes: Summary (for the dashboard) ----------

@app.route("/api/summary", methods=["GET"])
def get_summary():
    conn = get_connection()

    income_row = conn.execute(
        "SELECT SUM(amount) AS total FROM transactions WHERE type = 'income'"
    ).fetchone()
    expense_row = conn.execute(
        "SELECT SUM(amount) AS total FROM transactions WHERE type = 'expense'"
    ).fetchone()

    total_income = income_row["total"] or 0
    total_expense = expense_row["total"] or 0

    # Totals grouped by category, used for the pie chart
    by_category = conn.execute("""
        SELECT c.name, SUM(t.amount) AS total
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE t.type = 'expense'
        GROUP BY c.name
    """).fetchall()

    conn.close()

    return jsonify({
        "total_income": total_income,
        "total_expense": total_expense,
        "balance": total_income - total_expense,
        "by_category": [dict(row) for row in by_category],
    })


if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=5001)
