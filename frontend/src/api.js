// =================================================================
// HEMATKU - API CLIENT
// Terhubung langsung ke Backend Vercel: https://hematkuu.vercel.app
// =================================================================

// Menggunakan URL Vercel sebagai default backend produksi
const RAW_BACKEND_URL = import.meta.env.VITE_API_URL || 'https://hematkuu.vercel.app';
export const BASE_URL = `${RAW_BACKEND_URL.replace(/\/$/, '')}/api`;
export const HEALTH_URL = `${RAW_BACKEND_URL.replace(/\/$/, '')}/health`;

async function request(url, options = {}) {
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        },
        ...options
    };

    try {
        const response = await fetch(url, config);

        // Periksa apakah server mengembalikan JSON
        const contentType = response.headers.get('content-type') || '';
        let data;

        if (contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const rawText = await response.text();
            throw new Error(`Server tidak mengembalikan JSON (Status ${response.status}): ${rawText.substring(0, 80)}`);
        }

        if (!response.ok) {
            throw new Error(data.error || data.message || 'Terjadi kesalahan pada server');
        }

        return data;
    } catch (err) {
        console.error(`API Error [${url}]:`, err.message);
        throw err;
    }
}

// 1. Modul Autentikasi
export const authAPI = {
    async register(username, password) {
        return request(`${BASE_URL}/auth/register`, {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    },

    async login(username, password) {
        return request(`${BASE_URL}/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    },

    async getMe(userId) {
        return request(`${BASE_URL}/auth/me?userId=${userId}`);
    }
};

// 2. Modul Transaksi Keuangan
export const transactionAPI = {
    async getAll({ userId, month, year, type, category } = {}) {
        const params = new URLSearchParams();
        if (userId) params.append('userId', userId);
        if (month !== undefined && month !== null) params.append('month', month);
        if (year !== undefined && year !== null) params.append('year', year);
        if (type) params.append('type', type);
        if (category) params.append('category', category);

        const queryString = params.toString() ? `?${params.toString()}` : '';
        const res = await request(`${BASE_URL}/transactions${queryString}`);
        return res.data || [];
    },

    async getSummary({ userId, month, year } = {}) {
        const params = new URLSearchParams();
        if (userId) params.append('userId', userId);
        if (month !== undefined && month !== null) params.append('month', month);
        if (year !== undefined && year !== null) params.append('year', year);

        const res = await request(`${BASE_URL}/transactions/summary?${params.toString()}`);
        return res.data;
    },

    async create(data) {
        return request(`${BASE_URL}/transactions`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async update(id, data) {
        return request(`${BASE_URL}/transactions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    async delete(id, userId) {
        return request(`${BASE_URL}/transactions/${id}?userId=${userId || ''}`, {
            method: 'DELETE'
        });
    }
};
