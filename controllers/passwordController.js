const User = require('../models/User');
const crypto = require('crypto'); // Para generar el token de recuperación
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Solicitar restablecimiento de contraseña
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Variable del entorno para correo
      pass: process.env.EMAIL_PASS, // Variable del entorno para contraseña
    },
  });
const requestPasswordReset = async (req, res) => {
  const { correo } = req.body;
  
  try {
    const user = await User.findOne({ correo });
    if (!user) {
      return res.status(404).json({ message: 'Correo no registrado.' });
    }

    // Generar un token de recuperación
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Guardar el token en el usuario con un tiempo de expiración
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hora de validez
    await user.save();

    // Crear enlace de restablecimiento
    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    // Opciones del correo
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.correo,
      subject: 'Recuperación de Contraseña - PROphysio',
      html: `
        <h1>Recuperación de contraseña</h1>
        <p>Haz clic en el enlace para restablecer tu contraseña:</p>
        <a href="${resetLink}">Restablecer contraseña</a>
        <p>Este enlace es válido por 1 hora.</p>
      `,
    };

    // Enviar correo
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error al enviar correo:', error);
        return res.status(500).json({ message: 'Error al enviar el correo.' });
      }
      res.status(200).json({ message: 'Correo enviado. Verifica tu bandeja de entrada.' });
    });
  } catch (error) {
    console.error('Error en solicitud de restablecimiento:', error);
    res.status(500).json({ message: 'Error en la solicitud.' });
  }
};

// Restablecer contraseña
const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { nuevaContraseña } = req.body;

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Token inválido o expirado.' });
    }

    user.contraseña = await bcrypt.hash(nuevaContraseña, 10);
    user.resetPasswordToken = undefined; // Limpiar token
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Contraseña actualizada con éxito.' });
  } catch (error) {
    console.error('Error al restablecer la contraseña:', error);
    res.status(500).json({ message: 'Error al restablecer la contraseña.' });
  }
};

module.exports = { requestPasswordReset, resetPassword };
