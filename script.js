// ============================================
//  Expenzo — Expense Tracker Logic
//  Author : Mojammil Ansari
//  Email  : mojammilansari820@gmail.com
//  Phone  : +91 7644067426
// ============================================

// ============================================
//  CATEGORY CONFIG
// ============================================
const CATEGORIES = {
  Food:          { emoji: '🍔', color: '#e8821a', bg: '#fef3e2' },
  Travel:        { emoji: '✈️', color: '#3b7dd8', bg: '#e8f0fc' },
  Rent:          { emoji: '🏠', color: '#7c4dbb', bg: '#f1eaf9' },
  Study:         { emoji: '📚', color: '#2d9e6b', bg: '#e8f7f1' },
  Shopping:      { emoji: '🛍️', color: '#e85d4a', bg: '#fef0ee' },
  Health:        { emoji: '💊', color: '#0ea5a0', bg: '#e6f7f7' },
  Entertainment: { emoji: '🎮', color: '#d45db7', bg: '#faeef8' },
  Bills:         { emoji: '⚡', color: '#c2860a', bg: '#fdf4e0' },
  Other:         { emoji: '📦', color: '#6b7280', bg: '#f3f4f6' },
};

// ============================================
//  STATE
// ============================================
let expenses   = JSON.parse(localStorage.getItem('expenzo_data') || '[]');
let editingId  = null;
let currentView = 'dashboard';

// Monthly navigation state
const now = new Date();
let viewMonth = now.getMonth();   // 0-based
let viewYear  = now.getFullYear();

// ============================================
//  INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  setTodayDate();
  setDefaultFormDate();
  renderAll();
});

/** Display today's date in the dashboard header */
function setTodayDate() {
  const el = document.getElementById('today-date');
  if (el) {
    el.textContent = new Date().toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }
}

/** Pre-fill the date field in the modal with today's date */
function setDefaultFormDate() {
  const d = document.getElementById('f-date');
  if (d) d.value = new Date().toISOString().split('T')[0];
}

/** Re-render everything */
function renderAll() {
  renderDashboard();
  renderExpenses();
  renderMonthly();
  renderCategories();
}

// ============================================
//  VIEW SWITCHING
// ============================================
/**
 * Shows the selected view, hides others, updates nav buttons.
 * @param {string} view - 'dashboard' | 'expenses' | 'monthly' | 'categories'
 */
function switchView(view) {
  currentView = view;

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  document.getElementById(`view-${view}`).classList.add('active');
  document.querySelector(`[data-view="${view}"]`).classList.add('active');

  if (view === 'monthly') renderMonthly();
}

// ============================================
//  MODAL OPEN / CLOSE
// ============================================
/** Open the modal for adding a new expense */
function openModal() {
  editingId = null;
  clearModalForm();
  setDefaultFormDate();
  document.getElementById('modal-title').textContent     = 'Add Expense';
  document.getElementById('modal-btn-label').textContent = 'Save Expense';
  document.getElementById('modal-overlay').classList.add('open');
}

/** Pre-fill modal with existing data for editing */
function openEditModal(id) {
  const exp = expenses.find(e => e.id === id);
  if (!exp) return;

  editingId = id;
  document.getElementById('f-desc').value   = exp.desc;
  document.getElementById('f-amount').value = exp.amount;
  document.getElementById('f-cat').value    = exp.category;
  document.getElementById('f-date').value   = exp.date;
  document.getElementById('f-note').value   = exp.note || '';
  document.getElementById('modal-title').textContent     = 'Edit Expense';
  document.getElementById('modal-btn-label').textContent = 'Update Expense';
  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  clearModalForm();
  editingId = null;
}

/** Close when clicking outside the modal box */
function closeModalOutside(e) {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
}

function clearModalForm() {
  ['f-desc', 'f-amount', 'f-cat', 'f-date', 'f-note'].forEach(id => {
    document.getElementById(id).value = '';
  });
}

// ============================================
//  SAVE EXPENSE (Add / Edit)
// ============================================
function saveExpense() {
  const desc   = document.getElementById('f-desc').value.trim();
  const amount = parseFloat(document.getElementById('f-amount').value);
  const cat    = document.getElementById('f-cat').value;
  const date   = document.getElementById('f-date').value;
  const note   = document.getElementById('f-note').value.trim();

  // Validation
  if (!desc)             return showToast('❗ Please enter a description', 'error');
  if (!amount || amount <= 0) return showToast('❗ Please enter a valid amount', 'error');
  if (!cat)              return showToast('❗ Please select a category', 'error');
  if (!date)             return showToast('❗ Please select a date', 'error');

  if (editingId) {
    // Update existing
    const idx = expenses.findIndex(e => e.id === editingId);
    expenses[idx] = { ...expenses[idx], desc, amount, category: cat, date, note };
    showToast('✅ Expense updated!', 'success');
  } else {
    // Add new
    expenses.push({
      id:       Date.now().toString(),
      desc,
      amount,
      category: cat,
      date,
      note,
      createdAt: new Date().toISOString()
    });
    showToast('✅ Expense added!', 'success');
  }

  saveToStorage();
  closeModal();
  renderAll();
}

// ============================================
//  DELETE EXPENSE
// ============================================
/**
 * Removes an expense after confirmation.
 * @param {string} id - Expense ID
 */
function deleteExpense(id) {
  if (!confirm('Delete this expense? This cannot be undone.')) return;
  expenses = expenses.filter(e => e.id !== id);
  saveToStorage();
  renderAll();
  showToast('🗑️ Expense deleted', 'success');
}

// ============================================
//  PERSIST
// ============================================
function saveToStorage() {
  localStorage.setItem('expenzo_data', JSON.stringify(expenses));
}

// ============================================
//  HELPERS
// ============================================
/** Format number as Indian Rupee string */
function fmt(num) {
  return '₹' + Number(num).toLocaleString('en-IN', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });
}

/** Format date string (YYYY-MM-DD) to readable format */
function fmtDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
}

/** Get category config; fallback to Other */
function getCat(name) {
  return CATEGORIES[name] || CATEGORIES['Other'];
}

/** Compute totals grouped by category for a given expense list */
function groupByCategory(list) {
  const map = {};
  list.forEach(e => {
    if (!map[e.category]) map[e.category] = 0;
    map[e.category] += e.amount;
  });
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1]);
}

/** Get all expenses for a given month/year */
function getMonthExpenses(month, year) {
  return expenses.filter(e => {
    const [y, m] = e.date.split('-');
    return parseInt(m) - 1 === month && parseInt(y) === year;
  });
}

// ============================================
//  RENDER — DASHBOARD
// ============================================
function renderDashboard() {
  const total      = expenses.reduce((s, e) => s + e.amount, 0);
  const monthExps  = getMonthExpenses(now.getMonth(), now.getFullYear());
  const monthTotal = monthExps.reduce((s, e) => s + e.amount, 0);

  // Unique days that have expenses (for daily average)
  const uniqueDays = [...new Set(expenses.map(e => e.date))].length || 1;
  const dailyAvg   = total / uniqueDays;

  // Top category overall
  const byCat = groupByCategory(expenses);
  const topCat = byCat.length ? byCat[0] : null;

  document.getElementById('dash-total').textContent       = fmt(total);
  document.getElementById('dash-count').textContent       = `${expenses.length} transaction${expenses.length !== 1 ? 's' : ''}`;
  document.getElementById('dash-month').textContent       = fmt(monthTotal);
  document.getElementById('dash-month-count').textContent = `${monthExps.length} this month`;
  document.getElementById('dash-top-cat').textContent     = topCat ? `${getCat(topCat[0]).emoji} ${topCat[0]}` : '—';
  document.getElementById('dash-top-amt').textContent     = topCat ? fmt(topCat[1]) : 'No data yet';
  document.getElementById('dash-avg').textContent         = fmt(dailyAvg);

  // Recent 5 transactions
  renderRecentList();

  // Category breakdown
  renderCatBreakdown();
}

function renderRecentList() {
  const el    = document.getElementById('recent-list');
  const recent = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  if (recent.length === 0) {
    el.innerHTML = '<div class="empty-msg">No expenses yet. Add one!</div>';
    return;
  }

  el.innerHTML = recent.map(e => {
    const c = getCat(e.category);
    return `
      <div class="txn-item">
        <div class="txn-left">
          <div class="txn-icon" style="background:${c.bg}">${c.emoji}</div>
          <div>
            <div class="txn-desc">${escHtml(e.desc)}</div>
            <div class="txn-meta">${fmtDate(e.date)} · ${e.category}</div>
          </div>
        </div>
        <div class="txn-amount">${fmt(e.amount)}</div>
      </div>
    `;
  }).join('');
}

function renderCatBreakdown() {
  const el     = document.getElementById('cat-breakdown');
  const byCat  = groupByCategory(expenses);
  const total  = expenses.reduce((s, e) => s + e.amount, 0);

  if (byCat.length === 0) {
    el.innerHTML = '<div class="empty-msg">No data yet.</div>';
    return;
  }

  el.innerHTML = byCat.map(([cat, amt]) => {
    const c   = getCat(cat);
    const pct = total > 0 ? ((amt / total) * 100).toFixed(1) : 0;
    return `
      <div class="cat-bar-item">
        <div class="cat-bar-row">
          <span class="cat-bar-name">${c.emoji} ${cat}</span>
          <span class="cat-bar-amt">${fmt(amt)} <span style="color:var(--text-3);font-weight:400">(${pct}%)</span></span>
        </div>
        <div class="cat-bar-track">
          <div class="cat-bar-fill" style="width:${pct}%;background:${c.color}"></div>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================
//  RENDER — ALL EXPENSES TABLE
// ============================================
function renderExpenses() {
  const q       = (document.getElementById('search-input')?.value || '').toLowerCase().trim();
  const filterCat  = document.getElementById('filter-cat')?.value || '';
  const filterFrom = document.getElementById('filter-from')?.value || '';
  const filterTo   = document.getElementById('filter-to')?.value || '';

  let list = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Apply filters
  if (q)          list = list.filter(e => e.desc.toLowerCase().includes(q) || (e.note && e.note.toLowerCase().includes(q)));
  if (filterCat)  list = list.filter(e => e.category === filterCat);
  if (filterFrom) list = list.filter(e => e.date >= filterFrom);
  if (filterTo)   list = list.filter(e => e.date <= filterTo);

  const tbody       = document.getElementById('expense-tbody');
  const countLabel  = document.getElementById('expense-count-label');
  const totalLabel  = document.getElementById('filtered-total');
  const filteredSum = list.reduce((s, e) => s + e.amount, 0);

  countLabel.textContent = `${list.length} record${list.length !== 1 ? 's' : ''}`;
  totalLabel.textContent = fmt(filteredSum);

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-td">No expenses match your filters.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(e => {
    const c = getCat(e.category);
    return `
      <tr>
        <td class="td-date">${fmtDate(e.date)}</td>
        <td>
          <div class="td-desc">${escHtml(e.desc)}</div>
          ${e.note ? `<div class="td-note">${escHtml(e.note)}</div>` : ''}
        </td>
        <td>
          <span class="cat-pill" style="background:${c.bg};color:${c.color}">
            ${c.emoji} ${e.category}
          </span>
        </td>
        <td class="td-amt">${fmt(e.amount)}</td>
        <td>
          <div class="tbl-actions">
            <button class="btn-tbl btn-edit-tbl" onclick="openEditModal('${e.id}')">✏️ Edit</button>
            <button class="btn-tbl btn-del-tbl"  onclick="deleteExpense('${e.id}')">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/** Clear all filter inputs and re-render */
function clearFilters() {
  ['search-input', 'filter-cat', 'filter-from', 'filter-to'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  renderExpenses();
}

// ============================================
//  RENDER — MONTHLY VIEW
// ============================================
const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];

function renderMonthly() {
  document.getElementById('month-label').textContent = `${MONTH_NAMES[viewMonth]} ${viewYear}`;

  const list  = getMonthExpenses(viewMonth, viewYear);
  const total = list.reduce((s, e) => s + e.amount, 0);

  // Days in month for avg
  const daysInMonth  = new Date(viewYear, viewMonth + 1, 0).getDate();
  const activeDays   = [...new Set(list.map(e => e.date))].length || 1;
  const avg          = total / activeDays;

  // Highest spending day
  const dayTotals = {};
  list.forEach(e => {
    dayTotals[e.date] = (dayTotals[e.date] || 0) + e.amount;
  });
  const maxDayEntry = Object.entries(dayTotals).sort((a,b) => b[1]-a[1])[0];

  document.getElementById('m-total').textContent   = fmt(total);
  document.getElementById('m-count').textContent   = list.length;
  document.getElementById('m-avg').textContent     = fmt(avg);
  document.getElementById('m-max-day').textContent = maxDayEntry
    ? `${fmtDate(maxDayEntry[0])} (${fmt(maxDayEntry[1])})`
    : '—';

  // Category bars for this month
  const catBarsEl = document.getElementById('monthly-cat-bars');
  const byCat     = groupByCategory(list);

  if (byCat.length === 0) {
    catBarsEl.innerHTML = '<div class="empty-msg">No data for this month.</div>';
  } else {
    catBarsEl.innerHTML = byCat.map(([cat, amt]) => {
      const c   = getCat(cat);
      const pct = total > 0 ? ((amt / total) * 100).toFixed(1) : 0;
      return `
        <div class="cat-bar-item">
          <div class="cat-bar-row">
            <span class="cat-bar-name">${c.emoji} ${cat}</span>
            <span class="cat-bar-amt">${fmt(amt)} <span style="color:var(--text-3);font-weight:400">(${pct}%)</span></span>
          </div>
          <div class="cat-bar-track">
            <div class="cat-bar-fill" style="width:${pct}%;background:${c.color}"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Sorted transaction list for this month
  const listEl     = document.getElementById('monthly-expense-list');
  const sortedList = [...list].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (sortedList.length === 0) {
    listEl.innerHTML = '<div class="empty-msg">No expenses this month.</div>';
  } else {
    listEl.innerHTML = sortedList.map(e => {
      const c = getCat(e.category);
      return `
        <div class="txn-item">
          <div class="txn-left">
            <div class="txn-icon" style="background:${c.bg}">${c.emoji}</div>
            <div>
              <div class="txn-desc">${escHtml(e.desc)}</div>
              <div class="txn-meta">${fmtDate(e.date)} · ${e.category}${e.note ? ' · ' + escHtml(e.note) : ''}</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <div class="txn-amount">${fmt(e.amount)}</div>
            <button class="btn-tbl btn-del-tbl" onclick="deleteExpense('${e.id}')">🗑️</button>
          </div>
        </div>
      `;
    }).join('');
  }
}

function prevMonth() {
  if (viewMonth === 0) { viewMonth = 11; viewYear--; }
  else viewMonth--;
  renderMonthly();
}

function nextMonth() {
  if (viewMonth === 11) { viewMonth = 0; viewYear++; }
  else viewMonth++;
  renderMonthly();
}

// ============================================
//  RENDER — CATEGORIES VIEW
// ============================================
function renderCategories() {
  const el    = document.getElementById('cat-grid');
  const byCat = groupByCategory(expenses);
  const total = expenses.reduce((s, e) => s + e.amount, 0);

  if (byCat.length === 0) {
    el.innerHTML = '<div class="empty-msg" style="grid-column:1/-1">Add some expenses to see category analysis.</div>';
    return;
  }

  el.innerHTML = byCat.map(([cat, amt]) => {
    const c      = getCat(cat);
    const count  = expenses.filter(e => e.category === cat).length;
    const pct    = total > 0 ? ((amt / total) * 100).toFixed(1) : 0;
    const avg    = amt / count;

    return `
      <div class="cat-analysis-card">
        <div class="cat-header">
          <div class="cat-emoji" style="background:${c.bg}">${c.emoji}</div>
          <div>
            <div class="cat-info-name">${cat}</div>
            <div class="cat-info-count">${count} transaction${count !== 1 ? 's' : ''}</div>
          </div>
        </div>
        <div class="cat-total">${fmt(amt)}</div>
        <div class="cat-pct-bar-track">
          <div class="cat-pct-bar-fill" style="width:${pct}%;background:${c.color}"></div>
        </div>
        <div class="cat-pct-label">${pct}% of total · Avg ${fmt(avg)} per entry</div>
      </div>
    `;
  }).join('');
}

// ============================================
//  TOAST
// ============================================
/**
 * Shows a temporary bottom-right toast notification.
 * @param {string} msg  - Message text
 * @param {string} type - 'success' | 'error'
 */
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className   = `toast show ${type}`;
  setTimeout(() => t.classList.remove('show'), 2600);
}

// ============================================
//  SECURITY HELPER
// ============================================
/** Escape HTML to prevent XSS when inserting user content */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
