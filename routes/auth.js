const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Ruta de verificación de correo
router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar el usuario por ID y actualizar el estado a "active"
    const user = await User.findByIdAndUpdate(decoded.id, { status: 'active' });

    if (!user) {
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    res.json({ message: 'Cuenta activada exitosamente. Ya puedes iniciar sesión.' });
  } catch (error) {
    res.status(400).json({ message: 'Token inválido o expirado', error });
  }
});

module.exports = router;
