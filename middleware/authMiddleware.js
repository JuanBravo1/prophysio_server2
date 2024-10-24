const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // Verificar el token en las cookies o en el header Authorization
  const token = req.cookies.token || req.header('Authorization')?.split(' ')[1]; // Se asegura de que el formato sea "Bearer token"

  if (!token) {
    return res.status(401).json({ message: 'Acceso denegado. No se proporcionó token.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verifica el token usando la clave secreta
    req.user = decoded; // Almacena los datos del usuario decodificados en el request
    next(); // Continúa con el siguiente middleware o controlador
  } catch (err) {
    // Si el token es inválido o ha expirado, devolvemos un mensaje claro
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado. Por favor, inicia sesión de nuevo.' });
    }
    return res.status(401).json({ message: 'Token no válido.' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next(); // Si el usuario es admin, permite el acceso
  } else {
    return res.status(403).json({ message: 'Acceso denegado. Solo administradores.' });
  }
};

module.exports = { authMiddleware, adminMiddleware };
