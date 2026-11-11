// =================================================================
// HEMATKU - FRONTEND APPLICATION LOGIC (VITE + PNPM)
// =================================================================

import { authAPI, transactionAPI } from './api.js';

// State Aplikasi
let currentUser = JSON.parse(localStorage.getItem('hematku_user')) || null;
let currentAuthTab = 'login';
let transactions = [];
let editingTransactionId = null;

const categories = {
    income: ['Gaji', 'Bonus', 'Investasi', 'Penjualan', 'Lainnya'],
    expense: ['Makanan & Minuman', 'Transportasi', 'Belanja', 'Tagihan & Utilitas', 'Hiburan', 'Kesehatan', 'Lainnya']
};

// DOM Elements
const authSection = document.getElementById('authSection');
const mainApp = document.getElementById('mainApp');
const userProfileBar = document.getElementById('userProfileBar');
const userNameGreeting = document.getElementById('userNameGreeting');
const logoutBtn = document.getElementById('logoutBtn');
const backendStatus = document.getElementById('backendStatus');

const tabLogin = document.getElementById('tabLogin');
const tabRegister = document.getElementById('tabRegister');
const authForm = document.getElementById('authForm');
const authUsername = document.getElementById('authUsername');
const authPassword = document.getElementById('authPassword');
const authSubmitText = document.getElementById('authSubmitText');
const authHint = document.getElementById('authHint');
const authAlert = document.getElementById('authAlert');

const formTitle = document.getElementById('formTitle');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const transactionForm = document.getElementById('transactionForm');
const dateInput = document.getElementById('date');
const descriptionInput = document.getElementById('description');
const typeInput = document.getElementById('type');
const categoryInput = document.getElementById('category');
const amountInput = document.getElementById('amount');
const submitTransactionBtn = document.getElementById('submitTransactionBtn');

const filterMonth = document.getElementById('filterMonth');
const filterYear = document.getElementById('filterYear');

const totalIncomeEl = document.getElementById('totalIncome');
const totalExpenseEl = document.getElementById('totalExpense');
const netBalanceEl = document.getElementById('netBalance');
const balanceCard = document.getElementById('balanceCard');
const statusBadge = document.getElementById('statusBadge');
const statusMessage = document.getElementById('statusMessage');
const balanceIcon = document.getElementById('balanceIcon');

const transactionList = document.getElementById('transactionList');
const emptyState = document.getElementById('emptyState');
const transactionCount = document.getElementById('transactionCount');

// =================================================================
// 1. INITIALIZATION
// =================================================================
window.addEventListener('DOMContentLoaded', () => {
    // Set tanggal default ke hari ini (zona waktu lokal)
    const today = new Date();
    const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    dateInput.value = localDate;

    filterMonth.value = today.getMonth();
    populateYearFilter(today.getFullYear());
    updateCategoryOptions();

    initEventListeners();
    updateAuthUI();
    checkBackendHealth();

    if (currentUser) {
        loadTransactions();
    }
});

function initEventListeners() {
    tabLogin.addEventListener('click', () => switchAuthTab('login'));
    tabRegister.addEventListener('click', () => switchAuthTab('register'));
    authForm.addEventListener('submit', handleAuthSubmit);
    logoutBtn.addEventListener('click', handleLogout);

    typeInput.addEventListener('change', updateCategoryOptions);
    filterMonth.addEventListener('change', loadTransactions);
    filterYear.addEventListener('change', loadTransactions);

    transactionForm.addEventListener('submit', handleTransactionSubmit);
    cancelEditBtn.addEventListener('click', resetTransactionForm);
}

// =================================================================
// 2. AUTHENTICATION HANDLERS
// =================================================================
function switchAuthTab(tab) {
    currentAuthTab = tab;
    hideAlert();

    if (tab === 'login') {
        tabLogin.className = "flex-1 pb-2 text-sm font-bold text-indigo-600 border-b-2 border-indigo-600 flex items-center justify-center gap-2 transition";
        tabRegister.className = "flex-1 pb-2 text-sm font-semibold text-slate-400 hover:text-slate-600 border-b-2 border-transparent flex items-center justify-center gap-2 transition";
        authSubmitText.textContent = "Masuk ke HematKu";
        authHint.innerHTML = "Belum punya akun? Klik tab <b>Daftar Akun</b> di atas untuk membuat akun baru.";
    } else {
        tabRegister.className = "flex-1 pb-2 text-sm font-bold text-indigo-600 border-b-2 border-indigo-600 flex items-center justify-center gap-2 transition";
        tabLogin.className = "flex-1 pb-2 text-sm font-semibold text-slate-400 hover:text-slate-600 border-b-2 border-transparent flex items-center justify-center gap-2 transition";
        authSubmitText.textContent = "Buat Akun Sekarang";
        authHint.innerHTML = "Sudah punya akun? Klik tab <b>Masuk (Login)</b> untuk masuk.";
    }
}

async function handleAuthSubmit(e) {
    e.preventDefault();
    hideAlert();

    const username = authUsername.value.trim();
    const password = authPassword.value.trim();

    try {
        if (currentAuthTab === 'register') {
            await authAPI.register(username, password);
            showAlert('Pendaftaran akun berhasil! Silakan masuk dengan akun Anda.', 'success');
            switchAuthTab('login');
            authPassword.value = '';
        } else {
            const res = await authAPI.login(username, password);
            currentUser = res.data;
            localStorage.setItem('hematku_user', JSON.stringify(currentUser));

            authUsername.value = '';
            authPassword.value = '';
            updateAuthUI();
            loadTransactions();
        }
    } catch (err) {
        showAlert(err.message || 'Gagal memproses autentikasi.', 'error');
    }
}

function handleLogout() {
    if (!confirm('Apakah Anda yakin ingin keluar dari akun ini?')) return;
    currentUser = null;
    localStorage.removeItem('hematku_user');
    transactions = [];
    resetTransactionForm();
    updateAuthUI();
    showAlert('Anda telah berhasil keluar.', 'info');
}

function updateAuthUI() {
    if (currentUser) {
        authSection.classList.add('hidden');
        mainApp.classList.remove('hidden');
        userProfileBar.classList.remove('hidden');
        userNameGreeting.textContent = currentUser.username;
    } else {
        authSection.classList.remove('hidden');
        mainApp.classList.add('hidden');
        userProfileBar.classList.add('hidden');
    }
}

function showAlert(msg, type = 'error') {
    authAlert.classList.remove('hidden');
    if (type === 'error') {
        authAlert.className = "mb-4 p-3 rounded-xl text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-2";
        authAlert.innerHTML = `<i class="fa-solid fa-circle-exclamation text-rose-500"></i> <span>${msg}</span>`;
    } else if (type === 'success') {
        authAlert.className = "mb-4 p-3 rounded-xl text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-2";
        authAlert.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-500"></i> <span>${msg}</span>`;
    } else {
        authAlert.className = "mb-4 p-3 rounded-xl text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-2";
        authAlert.innerHTML = `<i class="fa-solid fa-circle-info text-indigo-500"></i> <span>${msg}</span>`;
    }
}

function hideAlert() {
    authAlert.classList.add('hidden');
}

// =================================================================
// 3. TRANSACTION DATA & CRUD
// =================================================================
async function checkBackendHealth() {
    try {
        const res = await fetch('/health');
        if (res.ok) {
            backendStatus.className = "bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5 shadow-sm";
            backendStatus.innerHTML = '<i class="fa-solid fa-circle-check text-xs"></i> <span>Backend Aktif (Port 3000)</span>';
        }
    } catch {
        backendStatus.className = "bg-rose-500 text-white text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5 shadow-sm";
        backendStatus.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-xs"></i> <span>Backend Offline</span>';
    }
}

async function loadTransactions() {
    if (!currentUser) return;

    try {
        const month = filterMonth.value;
        const year = filterYear.value;

        // Ambil data transaksi dan summary statistik
        transactions = await transactionAPI.getAll({
            userId: currentUser.id,
            month,
            year
        });

        render();
    } catch (err) {
        console.error('Gagal mengambil data:', err);
    }
}

async function handleTransactionSubmit(e) {
    e.preventDefault();

    const data = {
        userId: currentUser ? currentUser.id : null,
        date: dateInput.value,
        description: descriptionInput.value.trim(),
        type: typeInput.value,
        category: categoryInput.value,
        amount: parseFloat(amountInput.value)
    };

    try {
        if (editingTransactionId) {
            // Mode EDIT (PUT)
            await transactionAPI.update(editingTransactionId, data);
            resetTransactionForm();
        } else {
            // Mode TAMBAH (POST)
            await transactionAPI.create(data);
            descriptionInput.value = '';
            amountInput.value = '';
        }

        // Sesuaikan filter bulan & tahun
        const [tYear, tMonth] = data.date.split('-').map(Number);
        filterMonth.value = tMonth - 1;
        if (![...filterYear.options].some(opt => parseInt(opt.value) === tYear)) {
            const opt = document.createElement('option');
            opt.value = tYear;
            opt.textContent = tYear;
            filterYear.appendChild(opt);
        }
        filterYear.value = tYear;

        await loadTransactions();
    } catch (err) {
        alert(err.message || 'Gagal menyimpan transaksi.');
    }
}

window.startEditTransaction = function(id) {
    const item = transactions.find(t => t.id === id);
    if (!item) return;

    editingTransactionId = id;
    dateInput.value = item.date;
    descriptionInput.value = item.description;
    typeInput.value = item.type;
    updateCategoryOptions();
    categoryInput.value = item.category;
    amountInput.value = item.amount;

    formTitle.innerHTML = '<i class="fa-solid fa-pen-to-square text-amber-500"></i> <span>Edit Transaksi</span>';
    cancelEditBtn.classList.remove('hidden');
    submitTransactionBtn.className = "w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-2.5 rounded-lg transition duration-200 text-sm shadow flex items-center justify-center gap-1.5";
    submitTransactionBtn.innerHTML = '<i class="fa-solid fa-check"></i> <span>Perbarui Transaksi</span>';

    // Scroll form into view
    dateInput.focus();
};

function resetTransactionForm() {
    editingTransactionId = null;
    formTitle.innerHTML = '<i class="fa-solid fa-plus-circle text-indigo-600"></i> <span>Tambah Transaksi</span>';
    cancelEditBtn.classList.add('hidden');
    submitTransactionBtn.className = "w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition duration-200 text-sm shadow flex items-center justify-center gap-1.5";
    submitTransactionBtn.innerHTML = '<i class="fa-solid fa-arrow-down-to-bracket"></i> <span>Simpan Transaksi</span>';

    descriptionInput.value = '';
    amountInput.value = '';
}

window.deleteTransactionItem = async function(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) return;

    try {
        await transactionAPI.delete(id, currentUser ? currentUser.id : null);
        if (editingTransactionId === id) resetTransactionForm();
        await loadTransactions();
    } catch (err) {
        alert(err.message || 'Gagal menghapus transaksi.');
    }
};

// =================================================================
// 4. RENDERING & UI HELPERS
// =================================================================
function render() {
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const netBalance = totalIncome - totalExpense;

    totalIncomeEl.textContent = formatRupiah(totalIncome);
    totalExpenseEl.textContent = formatRupiah(totalExpense);
    netBalanceEl.textContent = (netBalance < 0 ? '- ' : '') + formatRupiah(netBalance);

    updateStatusCard(netBalance, transactions.length);
    renderTable(transactions);
}

function updateStatusCard(balance, dataCount) {
    balanceCard.className = "p-5 rounded-2xl shadow-sm border transition-all duration-300 ";

    if (dataCount === 0) {
        balanceCard.classList.add("bg-white", "border-slate-200");
        statusBadge.className = "text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold";
        statusBadge.textContent = "Kosong";
        statusMessage.textContent = "Belum ada transaksi";
        balanceIcon.className = "w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-sm";
        balanceIcon.innerHTML = '<i class="fa-solid fa-scale-balanced"></i>';
    } else if (balance > 0) {
        balanceCard.classList.add("bg-emerald-50/50", "border-emerald-200");
        statusBadge.className = "text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold";
        statusBadge.textContent = "Surplus / Hemat";
        statusMessage.textContent = "Keuanganmu aman bulan ini!";
        balanceIcon.className = "w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm";
        balanceIcon.innerHTML = '<i class="fa-solid fa-face-smile"></i>';
    } else if (balance < 0) {
        balanceCard.classList.add("bg-rose-50/50", "border-rose-200");
        statusBadge.className = "text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold";
        statusBadge.textContent = "Defisit / Rugi";
        statusMessage.textContent = "Waspada! Pengeluaran membengkak";
        balanceIcon.className = "w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-sm";
        balanceIcon.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
    } else {
        balanceCard.classList.add("bg-slate-50", "border-slate-200");
        statusBadge.className = "text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold";
        statusBadge.textContent = "Impas";
        statusMessage.textContent = "Pemasukan & Pengeluaran sama";
        balanceIcon.className = "w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-sm";
        balanceIcon.innerHTML = '<i class="fa-solid fa-equals"></i>';
    }
}

function renderTable(data) {
    transactionList.innerHTML = '';
    transactionCount.textContent = `${data.length} Transaksi`;

    if (data.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    } else {
        emptyState.classList.add('hidden');
    }

    data.forEach(item => {
        const row = document.createElement('tr');
        row.className = "hover:bg-slate-50/80 transition-colors";

        const isIncome = item.type === 'income';
        const amountClass = isIncome ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold';
        const amountSign = isIncome ? '+' : '-';

        row.innerHTML = `
            <td class="p-2.5 sm:p-3 pl-3 sm:pl-4 text-xs text-slate-500 whitespace-nowrap">${formatDate(item.date)}</td>
            <td class="p-2.5 sm:p-3 font-medium text-slate-800 max-w-[130px] sm:max-w-xs truncate" title="${escapeHtml(item.description)}">${escapeHtml(item.description)}</td>
            <td class="p-2.5 sm:p-3 text-xs whitespace-nowrap">
                <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                    ${item.category}
                </span>
            </td>
            <td class="p-2.5 sm:p-3 text-right ${amountClass} whitespace-nowrap font-medium">
                ${amountSign} ${formatRupiah(item.amount)}
            </td>
            <td class="p-2.5 sm:p-3 text-center whitespace-nowrap space-x-1">
                <button onclick="startEditTransaction(${item.id})" 
                    class="text-slate-400 hover:text-amber-500 p-1.5 sm:p-2 rounded-lg hover:bg-amber-50 transition-colors touch-manipulation inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8"
                    title="Edit Transaksi">
                    <i class="fa-regular fa-pen-to-square text-xs sm:text-sm"></i>
                </button>
                <button onclick="deleteTransactionItem(${item.id})" 
                    class="text-slate-400 hover:text-rose-600 p-1.5 sm:p-2 rounded-lg hover:bg-rose-50 transition-colors touch-manipulation inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8"
                    title="Hapus Transaksi">
                    <i class="fa-regular fa-trash-can text-xs sm:text-sm"></i>
                </button>
            </td>
        `;
        transactionList.appendChild(row);
    });
}

function updateCategoryOptions() {
    const selectedType = typeInput.value;
    const options = categories[selectedType];

    categoryInput.innerHTML = '';
    options.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categoryInput.appendChild(option);
    });
}

function populateYearFilter(currentYear) {
    filterYear.innerHTML = '';
    for (let y = currentYear - 5; y <= currentYear + 1; y++) {
        const option = document.createElement('option');
        option.value = y;
        option.textContent = y;
        if (y === currentYear) option.selected = true;
        filterYear.appendChild(option);
    }
}

function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(Math.abs(number));
}

function formatDate(dateString) {
    const [y, m, d] = dateString.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
}
