// Middleware penanganan error terpusat
export function errorHandler(err, req, res, next) {
    console.error('❌ [Error Occurred]:', err.message);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Terjadi kesalahan internal pada server.';

    res.status(statusCode).json({
        success: false,
        statusCode,
        error: message
    });
}
