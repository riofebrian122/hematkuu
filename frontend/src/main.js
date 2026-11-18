// =================================================================
// HEMATKU PRO - FULL-FEATURED FINANCIAL APP (VITE + PNPM + PWA)
// =================================================================

import { authAPI, transactionAPI, HEALTH_URL } from './api.js';

// State Aplikasi
let currentUser = JSON.parse(localStorage.getItem('hematku_user')) || null;
let currentAuthTab = 'login';
let currentAppView = 'dashboard';
let currentChartMode = 'expense'; // 'expense' | 'income'
let currentTransactionFilter = 'all'; // 'all' | 'income' | 'expense'
let transactions = [];
let editingTransactionId = null;
let deferredInstallPrompt = null;

// Chart Instances
let donutChartInstance = null;
let cashflowChartInstance = null;

// Kategori & Ikon
const categories = {
    income: ['Gaji', 'Bonus', 'Investasi', 'Penjualan', 'Lainnya'],
    expense: ['Makanan & Minuman', 'Transportasi', 'Belanja', 'Tagihan & Utilitas', 'Hiburan', 'Kesehatan', 'Lainnya']
};

const categoryConfig = {
    'Makanan & Minuman': { icon: 'fa-utensils', bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30', color: '#f87171' },
    'Belanja': { icon: 'fa-bag-shopping', bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30', color: '#fb923c' },
    'Transportasi': { icon: 'fa-gas-pump', bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', color: '#facc15' },
    'Tagihan & Utilitas': { icon: 'fa-file-invoice-dollar', bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30', color: '#a78bfa' },
    'Hiburan': { icon: 'fa-gamepad', bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30', color: '#ec4899' },
    'Kesehatan': { icon: 'fa-heart-pulse', bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', color: '#34d399' },
    'Gaji': { icon: 'fa-money-bill-wave', bg: 'bg-lime-500/20', text: 'text-lime-400', border: 'border-lime-500/30', color: '#a3e635' },
    'Bonus': { icon: 'fa-gift', bg: 'bg-sky-500/20', text: 'text-sky-400', border: 'border-sky-500/30', color: '#38bdf8' },
    'Investasi': { icon: 'fa-chart-line', bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', color: '#f59e0b' },
    'Penjualan': { icon: 'fa-shop', bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/30', color: '#14b8a6' },
    'Lainnya': { icon: 'fa-receipt', bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30', color: '#94a3b8' }
};

// DOM Elements
const authSection = document.getElementById('authSection');
const mainApp = document.getElementById('mainApp');
const userProfileBar = document.getElementById('userProfileBar');
const userNameGreeting = document.getElementById('userNameGreeting');
const logoutBtn = document.getElementById('logoutBtn');
const desktopTabBar = document.getElementById('desktopTabBar');
const mobileBottomNav = document.getElementById('mobileBottomNav');

// Auth Form Elements
const tabLogin = document.getElementById('tabLogin');
const tabRegister = document.getElementById('tabRegister');
const authForm = document.getElementById('authForm');
const authUsername = document.getElementById('authUsername');
const authPassword = document.getElementById('authPassword');
const authSubmitText = document.getElementById('authSubmitText');
const authHint = document.getElementById('authHint');
const authAlert = document.getElementById('authAlert');

// Transaction Modal & Form Elements
const transactionModal = document.getElementById('transactionModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const headerAddBtn = document.getElementById('headerAddBtn');
const formTitle = document.getElementById('formTitle');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const transactionForm = document.getElementById('transactionForm');
const dateInput = document.getElementById('date');
const descriptionInput = document.getElementById('description');
const typeInput = document.getElementById('type');
const categoryInput = document.getElementById('category');
const amountInput = document.getElementById('amount');
const submitTransactionBtn = document.getElementById('submitTransactionBtn');
const btnTypeIncome = document.getElementById('btnTypeIncome');
const btnTypeExpense = document.getElementById('btnTypeExpense');

// Filter Elements
const filterMonth = document.getElementById('filterMonth');
const filterYear = document.getElementById('filterYear');
const currentPeriodLabel = document.getElementById('currentPeriodLabel');
const prevMonthBtn = document.getElementById('prevMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');
const transactionSearchInput = document.getElementById('transactionSearchInput');

// Summary Cards Elements
const totalIncomeEl = document.getElementById('totalIncome');
const totalExpenseEl = document.getElementById('totalExpense');
const netBalanceEl = document.getElementById('netBalance');
const balanceCard = document.getElementById('balanceCard');
const statusBadge = document.getElementById('statusBadge');
const statusMessage = document.getElementById('statusMessage');
const balanceIcon = document.getElementById('balanceIcon');

// Feed & List Elements
const recentTransactionsList = document.getElementById('recentTransactionsList');
const groupedTransactionContainer = document.getElementById('groupedTransactionContainer');
const transactionEmptyState = document.getElementById('transactionEmptyState');

// Analytics Elements
const chartModeExpense = document.getElementById('chartModeExpense');
const chartModeIncome = document.getElementById('chartModeIncome');
const chartTitleText = document.getElementById('chartTitleText');
const chartCenterTotal = document.getElementById('chartCenterTotal');
const categoryBreakdownList = document.getElementById('categoryBreakdownList');
const breakdownSectionTitle = document.getElementById('breakdownSectionTitle');
const breakdownCountBadge = document.getElementById('breakdownCountBadge');

// Account View Elements
const accountProfileName = document.getElementById('accountProfileName');
const accountTotalTransactions = document.getElementById('accountTotalTransactions');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const exportJsonBtn = document.getElementById('exportJsonBtn');
const pwaInstallBtn = document.getElementById('pwaInstallBtn');
const directInstallBtn = document.getElementById('directInstallBtn');

// =================================================================
// 1. INITIALIZATION & SERVICE WORKER
// =================================================================
window.addEventListener('DOMContentLoaded', () => {
    // Set tanggal default ke hari ini
    const today = new Date();
    const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    dateInput.value = localDate;

    filterMonth.value = today.getMonth();
    populateYearFilter(today.getFullYear());
    updateCategoryOptions();
    updatePeriodLabel();

    initEventListeners();
    initPWA();
    updateAuthUI();

    if (currentUser) {
        loadTransactions();
    }
});

function initPWA() {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(err => {
            console.log('SW registration error:', err);
        });
    }

    // PWA Install prompt listener
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredInstallPrompt = e;
        if (pwaInstallBtn) pwaInstallBtn.classList.remove('hidden');
    });

    const triggerInstall = async () => {
        if (!deferredInstallPrompt) {
            alert('HematKu dapat dipasang langsung melalui menu "Tambahkan ke Layar Utama" (Add to Home screen) di browser Chrome/Safari HP Anda!');
            return;
        }
        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') {
            if (pwaInstallBtn) pwaInstallBtn.classList.add('hidden');
        }
        deferredInstallPrompt = null;
    };

    if (pwaInstallBtn) pwaInstallBtn.addEventListener('click', triggerInstall);
    if (directInstallBtn) directInstallBtn.addEventListener('click', triggerInstall);
}

function initEventListeners() {
    // Auth Tab & Submit
    tabLogin.addEventListener('click', () => switchAuthTab('login'));
    tabRegister.addEventListener('click', () => switchAuthTab('register'));
    authForm.addEventListener('submit', handleAuthSubmit);
    logoutBtn.addEventListener('click', handleLogout);

    // Desktop Tabs & Logo
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchView(btn.getAttribute('data-tab')));
    });
    document.getElementById('navLogoBtn').addEventListener('click', () => switchView('dashboard'));
    const headerProfilePill = document.getElementById('headerProfilePill');
    if (headerProfilePill) {
        headerProfilePill.addEventListener('click', () => switchView('account'));
    }

    // Modal Triggers
    if (headerAddBtn) headerAddBtn.addEventListener('click', () => openTransactionModal());
    closeModalBtn.addEventListener('click', closeTransactionModal);
    transactionModal.addEventListener('click', (e) => {
        if (e.target === transactionModal) closeTransactionModal();
    });

    // Form Type Switcher (Pemasukan / Pengeluaran)
    btnTypeIncome.addEventListener('click', () => setModalType('income'));
    btnTypeExpense.addEventListener('click', () => setModalType('expense'));
    typeInput.addEventListener('change', updateCategoryOptions);

    // Period Filters
    filterMonth.addEventListener('change', () => {
        updatePeriodLabel();
        loadTransactions();
    });
    filterYear.addEventListener('change', () => {
        updatePeriodLabel();
        loadTransactions();
    });

    prevMonthBtn.addEventListener('click', () => stepMonth(-1));
    nextMonthBtn.addEventListener('click', () => stepMonth(1));

    // Search and Filter Transactions
    transactionSearchInput.addEventListener('input', () => renderGroupedTransactions(filterTransactions()));
    document.getElementById('filterTypeAll').addEventListener('click', () => setTransactionTypeFilter('all'));
    document.getElementById('filterTypeIncome').addEventListener('click', () => setTransactionTypeFilter('income'));
    document.getElementById('filterTypeExpense').addEventListener('click', () => setTransactionTypeFilter('expense'));

    // Analytics Mode Switcher (Expense / Income)
    chartModeExpense.addEventListener('click', () => setChartMode('expense'));
    chartModeIncome.addEventListener('click', () => setChartMode('income'));

    // Data Exports
    exportCsvBtn.addEventListener('click', exportToCsv);
    exportJsonBtn.addEventListener('click', exportToJson);

    // Form Submit & Cancel
    transactionForm.addEventListener('submit', handleTransactionSubmit);
    cancelEditBtn.addEventListener('click', resetTransactionForm);
}

// =================================================================
// 2. VIEW NAVIGATION & MOBILE SHELL
// =================================================================
window.switchView = function(viewName) {
    if (!currentUser) return;
    currentAppView = viewName;

    // Sembunyikan semua views
    document.querySelectorAll('.app-view').forEach(v => v.classList.add('hidden'));

    // Tampilkan view yang dipilih
    if (viewName === 'dashboard') {
        document.getElementById('viewDashboard').classList.remove('hidden');
    } else if (viewName === 'transactions') {
        document.getElementById('viewTransactions').classList.remove('hidden');
        renderGroupedTransactions(filterTransactions());
    } else if (viewName === 'analytics') {
        document.getElementById('viewAnalytics').classList.remove('hidden');
        renderAnalytics();
    } else if (viewName === 'account') {
        document.getElementById('viewAccount').classList.remove('hidden');
        updateAccountView();
    }

    // Update Desktop Tabs
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
        const tab = btn.getAttribute('data-tab');
        if (tab === viewName) {
            btn.className = "nav-tab-btn px-4 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 bg-[#a3e635] text-[#0c0f0d] shadow-[0_0_15px_rgba(163,230,53,0.25)]";
        } else {
            btn.className = "nav-tab-btn px-4 py-1.5 rounded-xl text-xs font-bold text-[#8a958e] hover:text-white hover:bg-[#181e19] transition flex items-center gap-2";
        }
    });

    // Update Mobile Bottom Nav Buttons
    document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
        const tab = btn.getAttribute('data-mobile-tab');
        if (tab === viewName) {
            btn.className = "mobile-nav-btn flex flex-col items-center gap-0.5 text-[#a3e635]";
        } else {
            btn.className = "mobile-nav-btn flex flex-col items-center gap-0.5 text-[#8a958e]";
        }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// =================================================================
// 3. AUTHENTICATION HANDLERS
// =================================================================
function switchAuthTab(tab) {
    currentAuthTab = tab;
    hideAlert();

    if (tab === 'login') {
        tabLogin.className = "flex-1 py-1.5 sm:py-2.5 text-xs sm:text-sm font-extrabold text-[#0c0f0d] bg-[#a3e635] rounded-lg sm:rounded-xl shadow-[0_0_15px_rgba(163,230,53,0.25)] flex items-center justify-center gap-2 transition duration-200";
        tabRegister.className = "flex-1 py-1.5 sm:py-2.5 text-xs sm:text-sm font-bold text-[#8a958e] hover:text-white rounded-lg sm:rounded-xl flex items-center justify-center gap-2 transition duration-200";
        authSubmitText.textContent = "Masuk ke HematKu";
        authHint.innerHTML = "Belum punya akun? Klik tab <b class=\"text-[#a3e635]\">Daftar Akun</b> di atas.";
    } else {
        tabRegister.className = "flex-1 py-1.5 sm:py-2.5 text-xs sm:text-sm font-extrabold text-[#0c0f0d] bg-[#a3e635] rounded-lg sm:rounded-xl shadow-[0_0_15px_rgba(163,230,53,0.25)] flex items-center justify-center gap-2 transition duration-200";
        tabLogin.className = "flex-1 py-1.5 sm:py-2.5 text-xs sm:text-sm font-bold text-[#8a958e] hover:text-white rounded-lg sm:rounded-xl flex items-center justify-center gap-2 transition duration-200";
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
        
        // Tampilkan Tab Bar & Tombol Tambah Transaksi HANYA jika sudah login
        if (desktopTabBar) {
            desktopTabBar.classList.remove('hidden');
            desktopTabBar.classList.add('md:flex');
        }
        if (headerAddBtn) {
            headerAddBtn.classList.remove('hidden');
            headerAddBtn.classList.add('md:flex');
        }
        if (mobileBottomNav) {
            mobileBottomNav.classList.remove('hidden');
            mobileBottomNav.classList.add('flex', 'md:hidden');
        }
        
        userNameGreeting.textContent = currentUser.username;
        if (bannerUserName) {
            bannerUserName.textContent = currentUser.username;
        }
        if (accountProfileName) {
            accountProfileName.textContent = currentUser.username;
        }
    } else {
        authSection.classList.remove('hidden');
        mainApp.classList.add('hidden');
        userProfileBar.classList.add('hidden');
        
        // Sembunyikan TOTAL saat belum login (halaman login bersih tanpa tab navigasi & tanpa tombol transaksi)
        if (desktopTabBar) {
            desktopTabBar.classList.add('hidden');
            desktopTabBar.classList.remove('md:flex');
        }
        if (headerAddBtn) {
            headerAddBtn.classList.add('hidden');
            headerAddBtn.classList.remove('md:flex');
        }
        if (mobileBottomNav) {
            mobileBottomNav.classList.add('hidden');
            mobileBottomNav.classList.remove('flex', 'md:hidden');
        }
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
// 4. TRANSACTION DATA & CRUD
// =================================================================
async function loadTransactions() {
    if (!currentUser) return;

    try {
        const month = filterMonth.value;
        const year = filterYear.value;

        transactions = await transactionAPI.getAll({
            userId: currentUser.id,
            month,
            year
        });

        renderAll();
    } catch (err) {
        console.error('Gagal mengambil data:', err);
    }
}

function renderAll() {
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
    renderRecentTransactions(transactions);
    renderGroupedTransactions(filterTransactions());
    renderAnalytics();
    renderCashflowChart();
}

// Modal Form Controllers
window.openTransactionModal = function(editId = null) {
    if (!currentUser) {
        switchAuthTab('login');
        showAlert('Silakan masuk ke akun Anda terlebih dahulu.', 'info');
        return;
    }
    if (editId) {
        startEditTransaction(editId);
    } else {
        resetTransactionForm();
    }
    transactionModal.classList.remove('hidden');
    amountInput.focus();
};

window.closeTransactionModal = function() {
    transactionModal.classList.add('hidden');
    resetTransactionForm();
};

function setModalType(type) {
    typeInput.value = type;
    if (type === 'income') {
        btnTypeIncome.className = "py-2.5 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 bg-[#a3e635] text-[#0c0f0d] shadow-md";
        btnTypeExpense.className = "py-2.5 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 text-[#8a958e]";
    } else {
        btnTypeExpense.className = "py-2.5 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 bg-[#f87171] text-white shadow-md";
        btnTypeIncome.className = "py-2.5 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 text-[#8a958e]";
    }
    updateCategoryOptions();
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
            await transactionAPI.update(editingTransactionId, data);
        } else {
            await transactionAPI.create(data);
        }

        closeTransactionModal();

        // Sesuaikan filter bulan & tahun jika tanggal berbeda
        const [tYear, tMonth] = data.date.split('-').map(Number);
        filterMonth.value = tMonth - 1;
        if (![...filterYear.options].some(opt => parseInt(opt.value) === tYear)) {
            const opt = document.createElement('option');
            opt.value = tYear;
            opt.textContent = tYear;
            filterYear.appendChild(opt);
        }
        filterYear.value = tYear;
        updatePeriodLabel();

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
    setModalType(item.type);
    categoryInput.value = item.category;
    amountInput.value = item.amount;

    formTitle.innerHTML = '<i class="fa-solid fa-pen-to-square text-amber-400"></i> <span>Edit Transaksi</span>';
    cancelEditBtn.classList.remove('hidden');
    submitTransactionBtn.className = "w-full bg-amber-400 hover:bg-amber-300 text-[#0c0f0d] font-black py-3 rounded-xl transition duration-200 text-sm shadow-[0_0_20px_rgba(251,191,36,0.3)] flex items-center justify-center gap-2";
    submitTransactionBtn.innerHTML = '<i class="fa-solid fa-check font-bold"></i> <span>Perbarui Transaksi</span>';
};

function resetTransactionForm() {
    editingTransactionId = null;
    formTitle.innerHTML = '<i class="fa-solid fa-circle-plus text-[#a3e635]"></i> <span>Tambah Transaksi</span>';
    cancelEditBtn.classList.add('hidden');
    submitTransactionBtn.className = "w-full bg-[#a3e635] hover:bg-[#bef264] text-[#0c0f0d] font-black py-3 rounded-xl transition duration-200 text-sm shadow-[0_0_20px_rgba(163,230,53,0.3)] hover:shadow-[0_0_30px_rgba(163,230,53,0.5)] flex items-center justify-center gap-2 touch-manipulation active:scale-[0.99]";
    submitTransactionBtn.innerHTML = '<i class="fa-solid fa-check font-bold"></i> <span>Simpan Transaksi</span>';

    descriptionInput.value = '';
    amountInput.value = '';
    setModalType('expense');
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
// 5. GROUPED TRANSACTIONS FEED (MATCHING USER SCREENSHOT 1)
// =================================================================
function setTransactionTypeFilter(filter) {
    currentTransactionFilter = filter;
    document.querySelectorAll('.type-filter-btn').forEach(btn => {
        btn.className = "type-filter-btn px-3 py-1 rounded-lg text-xs font-semibold text-[#8a958e] hover:text-white bg-[#181e19]";
    });
    if (filter === 'all') {
        document.getElementById('filterTypeAll').className = "type-filter-btn px-3 py-1 rounded-lg text-xs font-bold bg-[#a3e635] text-[#0c0f0d]";
    } else if (filter === 'income') {
        document.getElementById('filterTypeIncome').className = "type-filter-btn px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500 text-white";
    } else if (filter === 'expense') {
        document.getElementById('filterTypeExpense').className = "type-filter-btn px-3 py-1 rounded-lg text-xs font-bold bg-rose-500 text-white";
    }
    renderGroupedTransactions(filterTransactions());
}

function filterTransactions() {
    const keyword = (transactionSearchInput.value || '').toLowerCase().trim();
    return transactions.filter(t => {
        const matchesType = currentTransactionFilter === 'all' || t.type === currentTransactionFilter;
        const matchesKeyword = !keyword || 
            t.description.toLowerCase().includes(keyword) || 
            t.category.toLowerCase().includes(keyword);
        return matchesType && matchesKeyword;
    });
}

function renderGroupedTransactions(data) {
    groupedTransactionContainer.innerHTML = '';

    if (data.length === 0) {
        transactionEmptyState.classList.remove('hidden');
        return;
    } else {
        transactionEmptyState.classList.add('hidden');
    }

    // Grouping by date
    const groups = {};
    data.forEach(t => {
        if (!groups[t.date]) groups[t.date] = [];
        groups[t.date].push(t);
    });

    // Urutkan tanggal dari yang paling baru
    const sortedDates = Object.keys(groups).sort((a, b) => new Date(b) - new Date(a));

    sortedDates.forEach(dateStr => {
        const items = groups[dateStr];
        const dayTotal = items.reduce((sum, item) => {
            return sum + (item.type === 'income' ? item.amount : -item.amount);
        }, 0);

        const [y, m, d] = dateStr.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);
        const dayNumber = d;
        const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'long' });
        const monthYear = dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

        const dayCard = document.createElement('div');
        dayCard.className = "bg-[#141815] rounded-2xl sm:rounded-3xl border border-[#242c26] shadow-xl overflow-hidden";

        // Day Header (Matching Screenshot: 26 Senin Oktober 2026 ... -44,300)
        const headerDiv = document.createElement('div');
        headerDiv.className = "px-4 py-3 bg-[#111512] border-b border-[#1e2520] flex items-center justify-between";
        
        const subtotalClass = dayTotal >= 0 ? 'text-[#a3e635]' : 'text-[#f87171]';
        const subtotalSign = dayTotal >= 0 ? '+' : '';

        headerDiv.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="text-xl sm:text-2xl font-black text-white leading-none">${dayNumber}</span>
                <div class="flex flex-col">
                    <span class="text-xs font-bold text-white leading-tight">${dayName}</span>
                    <span class="text-[10px] text-[#8a958e] leading-tight">${monthYear}</span>
                </div>
            </div>
            <div class="text-right">
                <span class="text-xs sm:text-sm font-black ${subtotalClass} tracking-tight">
                    ${subtotalSign} ${formatRupiah(dayTotal)}
                </span>
                <div class="text-[10px] text-[#8a958e]">${items.length} mutasi</div>
            </div>
        `;
        dayCard.appendChild(headerDiv);

        // Transaction items under this date
        const itemsList = document.createElement('div');
        itemsList.className = "divide-y divide-[#1c221e]";

        items.forEach(item => {
            const isIncome = item.type === 'income';
            const amountClass = isIncome ? 'text-[#a3e635]' : 'text-[#f87171]';
            const amountSign = isIncome ? '+' : '-';
            const catConf = categoryConfig[item.category] || categoryConfig['Lainnya'];

            const itemDiv = document.createElement('div');
            itemDiv.className = "p-3.5 sm:p-4 flex items-center justify-between hover:bg-[#19201b] transition-colors group";

            itemDiv.innerHTML = `
                <div class="flex items-center gap-3 min-w-0 pr-2">
                    <div class="w-10 h-10 rounded-xl ${catConf.bg} ${catConf.text} border ${catConf.border} flex items-center justify-center text-base shrink-0 shadow-xs">
                        <i class="fa-solid ${catConf.icon}"></i>
                    </div>
                    <div class="min-w-0">
                        <div class="text-xs sm:text-sm font-bold text-white truncate">${escapeHtml(item.category)}</div>
                        <div class="text-[11px] text-[#8a958e] truncate mt-0.5">${escapeHtml(item.description)}</div>
                    </div>
                </div>

                <div class="flex items-center gap-3 shrink-0">
                    <span class="text-xs sm:text-sm font-black ${amountClass} tracking-tight">
                        ${amountSign} ${formatRupiah(item.amount)}
                    </span>
                    <div class="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                        <button onclick="openTransactionModal(${item.id})" class="w-7 h-7 rounded-lg hover:bg-[#25231c] text-[#8a958e] hover:text-amber-400 flex items-center justify-center transition" title="Edit">
                            <i class="fa-regular fa-pen-to-square text-xs"></i>
                        </button>
                        <button onclick="deleteTransactionItem(${item.id})" class="w-7 h-7 rounded-lg hover:bg-[#281618] text-[#8a958e] hover:text-[#f87171] flex items-center justify-center transition" title="Hapus">
                            <i class="fa-regular fa-trash-can text-xs"></i>
                        </button>
                    </div>
                </div>
            `;
            itemsList.appendChild(itemDiv);
        });

        dayCard.appendChild(itemsList);
        groupedTransactionContainer.appendChild(dayCard);
    });
}

function renderRecentTransactions(data) {
    if (!recentTransactionsList) return;
    recentTransactionsList.innerHTML = '';

    const recent = data.slice(0, 5);
    if (recent.length === 0) {
        recentTransactionsList.innerHTML = `
            <div class="p-4 text-center text-xs text-[#8a958e]">Belum ada mutasi bulan ini.</div>
        `;
        return;
    }

    recent.forEach(item => {
        const isIncome = item.type === 'income';
        const amountClass = isIncome ? 'text-[#a3e635]' : 'text-[#f87171]';
        const amountSign = isIncome ? '+' : '-';
        const catConf = categoryConfig[item.category] || categoryConfig['Lainnya'];

        const div = document.createElement('div');
        div.className = "flex items-center justify-between p-2.5 rounded-xl bg-[#181e19] border border-[#242c26]";
        div.innerHTML = `
            <div class="flex items-center gap-2.5 min-w-0 pr-2">
                <div class="w-8 h-8 rounded-lg ${catConf.bg} ${catConf.text} flex items-center justify-center text-xs shrink-0">
                    <i class="fa-solid ${catConf.icon}"></i>
                </div>
                <div class="min-w-0">
                    <div class="text-xs font-bold text-white truncate">${escapeHtml(item.description)}</div>
                    <div class="text-[10px] text-[#8a958e]">${formatDate(item.date)}</div>
                </div>
            </div>
            <span class="text-xs font-black ${amountClass} whitespace-nowrap">
                ${amountSign} ${formatRupiah(item.amount)}
            </span>
        `;
        recentTransactionsList.appendChild(div);
    });
}

// =================================================================
// 6. ANALYTICS & INTERACTIVE CHARTS (MATCHING SCREENSHOT 2)
// =================================================================
function setChartMode(mode) {
    currentChartMode = mode;
    if (mode === 'expense') {
        chartModeExpense.className = "flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-black bg-[#f87171] text-white transition shadow-sm";
        chartModeIncome.className = "flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold text-[#8a958e] hover:text-white transition";
        chartTitleText.textContent = "Distribusi Pengeluaran";
        breakdownSectionTitle.textContent = "Rincian Pengeluaran Kategori";
    } else {
        chartModeIncome.className = "flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-black bg-[#a3e635] text-[#0c0f0d] transition shadow-sm";
        chartModeExpense.className = "flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold text-[#8a958e] hover:text-white transition";
        chartTitleText.textContent = "Distribusi Pemasukan";
        breakdownSectionTitle.textContent = "Rincian Pemasukan Kategori";
    }
    renderAnalytics();
}

function renderAnalytics() {
    const canvas = document.getElementById('categoryDonutChart');
    if (!canvas || typeof Chart === 'undefined') return;

    // Filter data sesuai chart mode (expense atau income)
    const filtered = transactions.filter(t => t.type === currentChartMode);
    const totalAmount = filtered.reduce((sum, t) => sum + t.amount, 0);

    chartCenterTotal.textContent = formatRupiah(totalAmount);

    // Group per category
    const catTotals = {};
    const catCounts = {};
    filtered.forEach(t => {
        catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
        catCounts[t.category] = (catCounts[t.category] || 0) + 1;
    });

    // Urutkan dari nominal terbesar ke terkecil
    const sortedCategories = Object.keys(catTotals).sort((a, b) => catTotals[b] - catTotals[a]);

    breakdownCountBadge.textContent = `${sortedCategories.length} Kategori`;

    // Render Breakdown List (Kanan)
    categoryBreakdownList.innerHTML = '';
    if (sortedCategories.length === 0) {
        categoryBreakdownList.innerHTML = `
            <div class="p-8 text-center text-xs text-[#8a958e]">
                Belum ada data ${currentChartMode === 'expense' ? 'pengeluaran' : 'pemasukan'} pada periode ini.
            </div>
        `;
    }

    const chartLabels = [];
    const chartData = [];
    const chartColors = [];

    sortedCategories.forEach(cat => {
        const amount = catTotals[cat];
        const count = catCounts[cat];
        const percentage = totalAmount > 0 ? ((amount / totalAmount) * 100).toFixed(1) : '0';
        const catConf = categoryConfig[cat] || categoryConfig['Lainnya'];

        chartLabels.push(cat);
        chartData.push(amount);
        chartColors.push(catConf.color);

        // Render List item matching right phone screenshot
        const itemRow = document.createElement('div');
        itemRow.className = "p-3 rounded-2xl bg-[#181e19] border border-[#242c26] hover:border-[#303a32] transition";
        itemRow.innerHTML = `
            <div class="flex items-center justify-between mb-1.5">
                <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-xl ${catConf.bg} ${catConf.text} border ${catConf.border} flex items-center justify-center text-xs shrink-0">
                        <i class="fa-solid ${catConf.icon}"></i>
                    </div>
                    <div>
                        <div class="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>${cat}</span>
                            <span class="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-[#222a24] text-[#a3e635]">${percentage}%</span>
                        </div>
                        <div class="text-[10px] text-[#8a958e]">${count} transaksi</div>
                    </div>
                </div>
                <div class="text-right">
                    <span class="text-xs font-black text-white">${formatRupiah(amount)}</span>
                </div>
            </div>
            <!-- Progress Bar -->
            <div class="w-full bg-[#111412] h-1.5 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-500" style="width: ${percentage}%; background-color: ${catConf.color};"></div>
            </div>
        `;
        categoryBreakdownList.appendChild(itemRow);
    });

    // Render or update Donut Chart
    if (donutChartInstance) {
        donutChartInstance.destroy();
    }

    if (sortedCategories.length === 0) {
        donutChartInstance = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: ['Kosong'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['#242c26'],
                    borderWidth: 0
                }]
            },
            options: {
                cutout: '72%',
                plugins: { legend: { display: false }, tooltip: { enabled: false } }
            }
        });
        return;
    }

    donutChartInstance = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: chartLabels,
            datasets: [{
                data: chartData,
                backgroundColor: chartColors,
                borderColor: '#141815',
                borderWidth: 3,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#161a17',
                    titleColor: '#ffffff',
                    bodyColor: '#a3e635',
                    borderColor: '#242c26',
                    borderWidth: 1,
                    padding: 10,
                    boxPadding: 4,
                    callbacks: {
                        label: function(context) {
                            const val = context.raw || 0;
                            const pct = totalAmount > 0 ? ((val / totalAmount) * 100).toFixed(1) : 0;
                            return ` ${context.label}: ${formatRupiah(val)} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

function renderCashflowChart() {
    const canvas = document.getElementById('cashflowBarChart');
    if (!canvas || typeof Chart === 'undefined') return;

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    if (cashflowChartInstance) {
        cashflowChartInstance.destroy();
    }

    cashflowChartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: ['Total Pemasukan', 'Total Pengeluaran'],
            datasets: [{
                label: 'Nominal (Rp)',
                data: [totalIncome, totalExpense],
                backgroundColor: ['#a3e635', '#f87171'],
                borderRadius: 12,
                barThickness: 45
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#161a17',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#242c26',
                    borderWidth: 1,
                    callbacks: {
                        label: (ctx) => ` ${formatRupiah(ctx.raw)}`
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#8a958e', font: { family: 'Plus Jakarta Sans', weight: 'bold' } }
                },
                y: {
                    grid: { color: '#1a221c' },
                    ticks: {
                        color: '#8a958e',
                        callback: (val) => 'Rp ' + (val >= 1000000 ? (val / 1000000) + ' Jt' : (val / 1000) + ' Rb')
                    }
                }
            }
        }
    });
}

// =================================================================
// 7. EXPORT DATA & ACCOUNT VIEW
// =================================================================
function updateAccountView() {
    if (accountTotalTransactions) {
        accountTotalTransactions.textContent = `${transactions.length} mutasi tersimpan`;
    }
}

function exportToCsv() {
    if (transactions.length === 0) {
        alert('Belum ada transaksi untuk diekspor.');
        return;
    }

    const headers = ['ID', 'Tanggal', 'Tipe', 'Kategori', 'Deskripsi', 'Nominal (Rp)'];
    const rows = transactions.map(t => [
        t.id,
        t.date,
        t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
        `"${t.category}"`,
        `"${t.description.replace(/"/g, '""')}"`,
        t.amount
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
        [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HematKu_Mutasi_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportToJson() {
    if (transactions.length === 0) {
        alert('Belum ada transaksi untuk dicadangkan.');
        return;
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(transactions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `HematKu_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

// =================================================================
// 8. HELPERS & FORMATTERS
// =================================================================
function updatePeriodLabel() {
    const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const m = parseInt(filterMonth.value);
    const y = filterYear.value;
    if (currentPeriodLabel) {
        currentPeriodLabel.textContent = `${monthNames[m]} ${y}`;
    }
}

function stepMonth(delta) {
    let m = parseInt(filterMonth.value) + delta;
    let y = parseInt(filterYear.value);

    if (m < 0) {
        m = 11;
        y -= 1;
    } else if (m > 11) {
        m = 0;
        y += 1;
    }

    filterMonth.value = m;
    if (![...filterYear.options].some(opt => parseInt(opt.value) === y)) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        filterYear.appendChild(opt);
    }
    filterYear.value = y;
    updatePeriodLabel();
    loadTransactions();
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

function updateStatusCard(balance, dataCount) {
    balanceCard.className = "p-4 sm:p-5 rounded-2xl sm:rounded-3xl border shadow-xl flex flex-col justify-between transition-all duration-300 ";

    if (dataCount === 0) {
        balanceCard.classList.add("bg-[#141815]", "border-[#242c26]");
        statusBadge.className = "text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-[#1c241e] text-[#8a958e] font-extrabold border border-[#2b372e]";
        statusBadge.textContent = "Netral";
        statusMessage.textContent = "Belum ada transaksi";
        balanceIcon.className = "w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-[#1c221e] text-[#8a958e] border border-[#273229] flex items-center justify-center text-xs shrink-0";
        balanceIcon.innerHTML = '<i class="fa-solid fa-scale-balanced"></i>';
    } else if (balance > 0) {
        balanceCard.classList.add("bg-gradient-to-b", "from-[#162725]/90", "via-[#141815]", "to-[#141815]", "border-[#233530]");
        statusBadge.className = "text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-[#a3e635]/15 text-[#a3e635] font-extrabold border border-[#a3e635]/30 shadow-[0_0_10px_rgba(163,230,53,0.15)]";
        statusBadge.textContent = "Surplus ✨";
        statusMessage.textContent = "Luar biasa! Keuanganmu tumbuh aman.";
        balanceIcon.className = "w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-[#a3e635]/20 text-[#a3e635] border border-[#a3e635]/30 flex items-center justify-center text-xs shrink-0";
        balanceIcon.innerHTML = '<i class="fa-solid fa-face-smile"></i>';
    } else if (balance < 0) {
        balanceCard.classList.add("bg-gradient-to-b", "from-[#2d181c]/90", "via-[#141815]", "to-[#141815]", "border-[#3d2328]");
        statusBadge.className = "text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-[#f87171]/15 text-[#f87171] font-extrabold border border-[#f87171]/30 shadow-[0_0_10px_rgba(248,113,113,0.15)]";
        statusBadge.textContent = "Defisit ⚠️";
        statusMessage.textContent = "Perhatian! Pengeluaran melebihi pemasukan.";
        balanceIcon.className = "w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-[#f87171]/20 text-[#f87171] border border-[#f87171]/30 flex items-center justify-center text-xs shrink-0";
        balanceIcon.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
    } else {
        balanceCard.classList.add("bg-[#141815]", "border-[#242c26]");
        statusBadge.className = "text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-[#1c241e] text-[#8a958e] font-extrabold border border-[#2b372e]";
        statusBadge.textContent = "Impas";
        statusMessage.textContent = "Pemasukan & Pengeluaran seimbang.";
        balanceIcon.className = "w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-[#1c221e] text-[#8a958e] border border-[#273229] flex items-center justify-center text-xs shrink-0";
        balanceIcon.innerHTML = '<i class="fa-solid fa-equals"></i>';
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
