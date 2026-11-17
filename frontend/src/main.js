// =================================================================
// HEMATKU - FRONTEND APPLICATION LOGIC (VITE + PNPM)
// =================================================================

import { authAPI, transactionAPI, HEALTH_URL } from './api.js';

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
        tabLogin.className = "flex-1 py-2.5 text-xs sm:text-sm font-extrabold text-[#0c0f0d] bg-[#a3e635] rounded-xl shadow-[0_0_15px_rgba(163,230,53,0.25)] flex items-center justify-center gap-2 transition duration-200";
        tabRegister.className = "flex-1 py-2.5 text-xs sm:text-sm font-bold text-[#8a958e] hover:text-white rounded-xl flex items-center justify-center gap-2 transition duration-200";
        authSubmitText.textContent = "Masuk ke HematKu";
        authHint.innerHTML = "Belum punya akun? Klik tab <b class=\"text-[#a3e635]\">Daftar Akun</b> di atas untuk membuat akun baru.";
    } else {
        tabRegister.className = "flex-1 py-2.5 text-xs sm:text-sm font-extrabold text-[#0c0f0d] bg-[#a3e635] rounded-xl shadow-[0_0_15px_rgba(163,230,53,0.25)] flex items-center justify-center gap-2 transition duration-200";
        tabLogin.className = "flex-1 py-2.5 text-xs sm:text-sm font-bold text-[#8a958e] hover:text-white rounded-xl flex items-center justify-center gap-2 transition duration-200";
        authSubmitText.textContent = "Buat Akun Sekarang";
        authHint.innerHTML = "Sudah punya akun? Klik tab <b class=\"text-[#a3e635]\">Masuk</b> untuk masuk.";
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
    const bannerUserName = document.getElementById('bannerUserName');
    if (currentUser) {
        authSection.classList.add('hidden');
        mainApp.classList.remove('hidden');
        userProfileBar.classList.remove('hidden');
        userNameGreeting.textContent = currentUser.username;
        if (bannerUserName) {
            bannerUserName.textContent = currentUser.username;
        }
    } else {
        authSection.classList.remove('hidden');
        mainApp.classList.add('hidden');
        userProfileBar.classList.add('hidden');
    }
}

function showAlert(msg, type = 'error') {
    authAlert.classList.remove('hidden');
    if (type === 'error') {
        authAlert.className = "mb-4 p-3.5 rounded-xl text-xs font-semibold bg-[#2a1618] text-[#fca5a5] border border-[#452025] flex items-center gap-2";
        authAlert.innerHTML = `<i class="fa-solid fa-circle-exclamation text-[#f87171]"></i> <span>${msg}</span>`;
    } else if (type === 'success') {
        authAlert.className = "mb-4 p-3.5 rounded-xl text-xs font-semibold bg-[#16271c] text-[#a3e635] border border-[#243d2c] flex items-center gap-2";
        authAlert.innerHTML = `<i class="fa-solid fa-circle-check text-[#a3e635]"></i> <span>${msg}</span>`;
    } else {
        authAlert.className = "mb-4 p-3.5 rounded-xl text-xs font-semibold bg-[#162028] text-[#93c5fd] border border-[#1e3445] flex items-center gap-2";
        authAlert.innerHTML = `<i class="fa-solid fa-circle-info text-[#38bdf8]"></i> <span>${msg}</span>`;
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
        const res = await fetch(HEALTH_URL);
        if (res.ok) {
            backendStatus.className = "bg-[#171d18] text-[#a3e635] border border-[#27352a] text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(163,230,53,0.15)]";
            backendStatus.innerHTML = '<i class="fa-solid fa-circle-check text-xs text-[#a3e635]"></i> <span>Backend Aktif</span>';
        }
    } catch {
        backendStatus.className = "bg-[#281618] text-[#f87171] border border-[#402024] text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5";
        backendStatus.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-xs text-[#f87171]"></i> <span>Backend Offline</span>';
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

    formTitle.innerHTML = '<i class="fa-solid fa-pen-to-square text-amber-400"></i> <span>Edit Transaksi</span>';
    cancelEditBtn.classList.remove('hidden');
    submitTransactionBtn.className = "w-full bg-amber-400 hover:bg-amber-300 text-[#0c0f0d] font-black py-3 rounded-xl transition duration-200 text-sm shadow-[0_0_20px_rgba(251,191,36,0.3)] flex items-center justify-center gap-2";
    submitTransactionBtn.innerHTML = '<i class="fa-solid fa-check font-bold"></i> <span>Perbarui Transaksi</span>';

    // Scroll form into view
    dateInput.focus();
};

function resetTransactionForm() {
    editingTransactionId = null;
    formTitle.innerHTML = '<i class="fa-solid fa-circle-plus text-[#a3e635]"></i> <span>Tambah Transaksi</span>';
    cancelEditBtn.classList.add('hidden');
    submitTransactionBtn.className = "w-full bg-[#a3e635] hover:bg-[#bef264] text-[#0c0f0d] font-black py-3 rounded-xl transition duration-200 text-sm shadow-[0_0_20px_rgba(163,230,53,0.3)] hover:shadow-[0_0_30px_rgba(163,230,53,0.5)] flex items-center justify-center gap-2 touch-manipulation active:scale-[0.99]";
    submitTransactionBtn.innerHTML = '<i class="fa-solid fa-plus font-bold"></i> <span>Simpan Transaksi</span>';

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
    balanceCard.className = "p-5 rounded-3xl border shadow-xl flex flex-col justify-between transition-all duration-300 ";

    if (dataCount === 0) {
        balanceCard.classList.add("bg-[#141815]", "border-[#242b26]");
        statusBadge.className = "text-[10px] px-2.5 py-0.5 rounded-full bg-[#1c241e] text-[#8a958e] font-extrabold border border-[#2b372e]";
        statusBadge.textContent = "Netral";
        statusMessage.textContent = "Belum ada transaksi";
        balanceIcon.className = "w-8 h-8 rounded-xl bg-[#1c221e] text-[#8a958e] border border-[#273229] flex items-center justify-center text-xs";
        balanceIcon.innerHTML = '<i class="fa-solid fa-scale-balanced"></i>';
    } else if (balance > 0) {
        balanceCard.classList.add("bg-gradient-to-b", "from-[#162725]/90", "via-[#141815]", "to-[#141815]", "border-[#233530]");
        statusBadge.className = "text-[10px] px-2.5 py-0.5 rounded-full bg-[#a3e635]/15 text-[#a3e635] font-extrabold border border-[#a3e635]/30 shadow-[0_0_10px_rgba(163,230,53,0.15)]";
        statusBadge.textContent = "Surplus ✨";
        statusMessage.textContent = "Luar biasa! Keuanganmu tumbuh aman.";
        balanceIcon.className = "w-8 h-8 rounded-xl bg-[#a3e635]/20 text-[#a3e635] border border-[#a3e635]/30 flex items-center justify-center text-xs";
        balanceIcon.innerHTML = '<i class="fa-solid fa-face-smile"></i>';
    } else if (balance < 0) {
        balanceCard.classList.add("bg-gradient-to-b", "from-[#2d181c]/90", "via-[#141815]", "to-[#141815]", "border-[#3d2328]");
        statusBadge.className = "text-[10px] px-2.5 py-0.5 rounded-full bg-[#f87171]/15 text-[#f87171] font-extrabold border border-[#f87171]/30 shadow-[0_0_10px_rgba(248,113,113,0.15)]";
        statusBadge.textContent = "Defisit ⚠️";
        statusMessage.textContent = "Perhatian! Pengeluaran melebihi pemasukan.";
        balanceIcon.className = "w-8 h-8 rounded-xl bg-[#f87171]/20 text-[#f87171] border border-[#f87171]/30 flex items-center justify-center text-xs";
        balanceIcon.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
    } else {
        balanceCard.classList.add("bg-[#141815]", "border-[#242b26]");
        statusBadge.className = "text-[10px] px-2.5 py-0.5 rounded-full bg-[#1c241e] text-[#8a958e] font-extrabold border border-[#2b372e]";
        statusBadge.textContent = "Impas";
        statusMessage.textContent = "Pemasukan & Pengeluaran seimbang.";
        balanceIcon.className = "w-8 h-8 rounded-xl bg-[#1c221e] text-[#8a958e] border border-[#273229] flex items-center justify-center text-xs";
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
        row.className = "hover:bg-[#19201a] transition-colors border-b border-[#1e2520]";

        const isIncome = item.type === 'income';
        const amountClass = isIncome ? 'text-[#a3e635] font-black' : 'text-[#f87171] font-black';
        const amountSign = isIncome ? '+' : '-';

        row.innerHTML = `
            <td class="py-3 px-4 text-xs text-[#8a958e] whitespace-nowrap">${formatDate(item.date)}</td>
            <td class="py-3 px-4 font-bold text-white max-w-[140px] sm:max-w-xs truncate" title="${escapeHtml(item.description)}">${escapeHtml(item.description)}</td>
            <td class="py-3 px-4 text-xs whitespace-nowrap">
                <span class="px-2.5 py-1 rounded-lg bg-[#1a231b] text-[#b0bcb4] border border-[#29352b] font-semibold text-xs">
                    ${item.category}
                </span>
            </td>
            <td class="py-3 px-4 text-right ${amountClass} whitespace-nowrap text-sm tracking-tight">
                ${amountSign} ${formatRupiah(item.amount)}
            </td>
            <td class="py-3 px-4 text-center whitespace-nowrap space-x-1.5">
                <button onclick="startEditTransaction(${item.id})" 
                    class="text-[#8a958e] hover:text-amber-400 p-1.5 sm:p-2 rounded-xl hover:bg-[#25231c] transition-colors touch-manipulation inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8"
                    title="Edit Transaksi">
                    <i class="fa-regular fa-pen-to-square text-xs sm:text-sm"></i>
                </button>
                <button onclick="deleteTransactionItem(${item.id})" 
                    class="text-[#8a958e] hover:text-[#f87171] p-1.5 sm:p-2 rounded-xl hover:bg-[#281618] transition-colors touch-manipulation inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8"
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
