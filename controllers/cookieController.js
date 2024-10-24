const cookies = async (req, res) => {
    // Establecer la cookie con la aceptación
    res.cookie('cookiesAccepted', 'true', {
        httpOnly: false, // Se puede acceder desde JavaScript
        secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
        sameSite: 'strict', // Protección contra CSRF
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 año
    });

    res.status(200).json({ message: 'Cookies aceptadas' });
};

const clearCookies = async (req, res) => {
    // Eliminar la cookie 'cookiesAccepted'
    res.clearCookie('cookiesAccepted', {
        path: '/',
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
    });

    res.status(200).json({ message: 'Cookies reiniciadas' });
};

const checkCookies = async (req, res) => {
    // Verificar si la cookie 'cookiesAccepted' existe
    const cookiesAccepted = req.cookies.cookiesAccepted;

    if (cookiesAccepted === 'true') {
        res.status(200).json({ cookiesAccepted: true });
    } else {
        res.status(200).json({ cookiesAccepted: false });
    }
};

module.exports = { cookies, clearCookies, checkCookies };
