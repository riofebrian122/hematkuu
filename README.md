# 💰 HematKu - Money Tracker Application

Aplikasi pencatat dan pengelola keuangan bulanan modern dengan arsitektur bersih (**Controller-Service Layer Architecture**), autentikasi akun terenkripsi, database **MySQL**, dan frontend terpisah berbasis **Vite + pnpm**.

---

## 🏗️ Struktur Arsitektur Monorepo

```text
PROJEK PENGELUARAN DAN PEMASUKAN/
├── backend/                  # REST API Backend (Node.js + Express + MySQL)
│   ├── src/
│   │   ├── config/           # Konfigurasi Database & Environment
│   │   │   └── db.js
│   │   ├── controllers/      # Menangani HTTP Request & Response
│   │   │   ├── authController.js
│   │   │   └── transactionController.js
│   │   ├── services/         # Business Logic & Database Query
│   │   │   ├── authService.js
│   │   │   └── transactionService.js
│   │   ├── routes/           # Endpoint Routing Express
│   │   │   ├── authRoutes.js
│   │   │   ├── transactionRoutes.js
│   │   │   └── index.js
│   │   ├── middlewares/      # Error handling & middleware
│   │   │   └── errorHandler.js
│   │   └── app.js            # Express App configuration
│   ├── .env                  # Environment Variables (Database Credentials)
│   ├── server.js             # Entry point backend
│   └── package.json
│
├── frontend/                 # Frontend Modern (Vite + Tailwind CSS + pnpm)
│   ├── src/
│   │   ├── api.js            # API Client (terhubung ke backend)
│   │   └── main.js           # State & UI Interactivity
│   ├── index.html            # UI Layout & Komponen
│   ├── vite.config.js        # Konfigurasi Vite & API Reverse Proxy
│   └── package.json
│
├── pnpm-workspace.yaml       # Konfigurasi Monorepo pnpm
└── package.json              # Root package dengan skrip terpadu
```

---

## 🚀 Cara Menjalankan Aplikasi

### 1. Menjalankan Backend (Server & Database)
Buka terminal dan masuk ke folder `backend`:
```powershell
cd backend
pnpm dev
```
> Server backend berjalan di: **`http://localhost:3000`** (Base API: `http://localhost:3000/api`)

### 2. Menjalankan Frontend (Vite)
Buka terminal baru dan masuk ke folder `frontend`:
```powershell
cd frontend
pnpm dev
```
> Website frontend terbuka di: **`http://localhost:5173`** (Otomatis terhubung ke backend lewat Vite Proxy)

---

## ✨ Fitur Unggulan HematKu
- **Autentikasi Aman:** Pendaftaran & login akun dengan hashing SHA-256.
- **Isolasi Data Per-Pengguna:** Transaksi tersimpan privat per akun (`user_id`).
- **CRUD Transaksi Lengkap:** Tambah, lihat, ubah (*Edit*), dan hapus transaksi.
- **Filter Periode Dinamis:** Memilih bulan dan tahun pencatatan.
- **Ringkasan Real-Time:** Pemasukan, pengeluaran, selisih bersih, dan status keuangan adaptif.
