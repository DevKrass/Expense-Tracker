import { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

function App() {
  // ---------- State ----------
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, balance: 0, by_category: [] });

  // form fields
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // ---------- Load data when the page opens ----------
  useEffect(() => {
    loadTransactions();
    loadCategories();
    loadSummary();
  }, []);

  function loadTransactions() {
    fetch("/api/transactions")
      .then((res) => res.json())
      .then((data) => setTransactions(data));
  }

  function loadCategories() {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data));
  }

  function loadSummary() {
    fetch("/api/summary")
      .then((res) => res.json())
      .then((data) => setSummary(data));
  }

  // ---------- Add a new transaction ----------
  function handleSubmit(event) {
    event.preventDefault();

    const newTransaction = {
      description: description,
      amount: parseFloat(amount),
      type: type,
      category_id: categoryId ? parseInt(categoryId) : null,
      date: date,
    };

    fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTransaction),
    }).then(() => {
      // clear the form
      setDescription("");
      setAmount("");
      setCategoryId("");

      // reload data so the UI updates
      loadTransactions();
      loadSummary();
    });
  }

  // ---------- Delete a transaction ----------
  function handleDelete(id) {
    fetch(`/api/transactions/${id}`, { method: "DELETE" }).then(() => {
      loadTransactions();
      loadSummary();
    });
  }

  // ---------- Filter categories based on selected type ----------
  const filteredCategories = categories.filter((c) => c.type === type);

  // ---------- Pie chart data ----------
  const chartData = {
    labels: summary.by_category.map((c) => c.name),
    datasets: [
      {
        data: summary.by_category.map((c) => c.total),
        backgroundColor: ["#f87171", "#fbbf24", "#34d399", "#60a5fa", "#a78bfa", "#f472b6"],
      },
    ],
  };

  // ---------- Render ----------
  return (
    <div className="container">
      <h1>Expense Tracker</h1>

      {/* Summary boxes */}
      <div className="summary">
        <div className="summary-box">
          <h3>Income</h3>
          <p className="income-text">€{summary.total_income.toFixed(2)}</p>
        </div>
        <div className="summary-box">
          <h3>Expenses</h3>
          <p className="expense-text">€{summary.total_expense.toFixed(2)}</p>
        </div>
        <div className="summary-box">
          <h3>Balance</h3>
          <p>€{summary.balance.toFixed(2)}</p>
        </div>
      </div>

      {/* Form to add a new transaction */}
      <form onSubmit={handleSubmit}>
        <label>Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Groceries"
        />

        <label>Amount (€)</label>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        <label>Type</label>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>

        <label>Category</label>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">-- No category --</option>
          {filteredCategories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <label>Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        <button type="submit">Add transaction</button>
      </form>

      {/* Pie chart of expenses by category */}
      {summary.by_category.length > 0 && (
        <div className="chart-box">
          <h3>Expenses by category</h3>
          <Pie data={chartData} />
        </div>
      )}

      {/* Transactions table */}
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Category</th>
            <th>Amount</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id}>
              <td>{t.date}</td>
              <td>{t.description}</td>
              <td>{t.category_name || "-"}</td>
              <td className={t.type === "income" ? "income-text" : "expense-text"}>
                {t.type === "income" ? "+" : "-"}€{t.amount.toFixed(2)}
              </td>
              <td>
                <button className="delete-btn" onClick={() => handleDelete(t.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
