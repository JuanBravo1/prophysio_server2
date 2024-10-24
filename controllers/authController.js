const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const sanitize = require('mongo-sanitize');
const crypto = require('crypto');

const { logAndReset } = require('./logsController');


const fs = require('fs');
const path = require('path');

const getConfig = () => {
  const configPath = path.join(__dirname, 'settings.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  return config;
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 1️⃣ Registro de usuario (no cambiamos mucho aquí)
const register = async (req, res) => {
  const { nombre, apellidos, correo, contraseña, comentarios, captchaToken } = sanitize(req.body);

  if (!nombre || !apellidos || !correo || !contraseña || !captchaToken) {
    return res.status(400).json({ message: 'Por favor, complete todos los campos y resuelva el captcha.' });
  }

  const secretKey = process.env.RECAPTCHA_SECRET_KEY; // Asegúrate de tener esta clave en tu .env
  const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captchaToken}`;

  try {
    // Verificar el reCAPTCHA
    const captchaResponse = await fetch(url, { method: 'POST' });
    const captchaData = await captchaResponse.json();
    const existingUser = await User.findOne({ correo });
    
    if (existingUser) {
      return res.status(400).json({ message: 'Este correo ya está registrado.' });
    }
    if (!captchaData.success) {
      return res.status(400).json({ message: 'Captcha inválido. Por favor, inténtelo de nuevo.' });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(contraseña, 10);

    // Crear el nuevo usuario
    const newUser = new User({
      nombre,
      apellidos,
      correo,
      contraseña: hashedPassword,
      comentarios,
      status: 'inactive',
    });

    await newUser.save();

    // Generar un token para la verificación por correo
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // El enlace de verificación ahora apunta a una ruta del backend
    const verificationLink = `https://prophysio-server2.onrender.com/api/auth/verify/${token}`;

    // Opciones del correo
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: correo,
      subject: 'Verificación de cuenta - PROphysio',
      html: `
    <h1>¡Bienvenido, ${nombre}!</h1>
    <p>Verifica tu cuenta haciendo clic en el siguiente enlace:</p>
    <a href="${verificationLink}">Verificar mi cuenta</a>
    <p>El enlace es válido por 24 horas.</p>
  `,
    };
    // Enviar el correo de verificación
    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.error('Error al enviar el correo:', error);
        return res.status(500).json({ message: 'Error al enviar el correo de verificación.' });
      }
      res.status(201).json({ message: 'Registro exitoso. Verifique su correo para activar su cuenta.' });
    });
  } catch (err) {
    console.error('Error en el registro:', err);
    res.status(500).json({ message: 'Error al registrar el usuario.' });
  }
};

const verifyAccount = async (req, res) => {
  const { token } = req.params;  // Capturar el token de la URL

  try {
    // Decodificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (user.status === 'active') {
      // Si ya está activo, redirigir directamente al home
      return res.redirect(`${process.env.CLIENT_URL}/`);
    }

    // Activar la cuenta
    user.status = 'active';
    await user.save();

    // Redirigir al usuario al home después de la verificación exitosa
    return res.redirect(`${process.env.CLIENT_URL}/`);
  } catch (error) {
    // Si el token es inválido o expirado, redirigir a una página de error o al home
    return res.redirect(`${process.env.CLIENT_URL}/error`);
  }
};

// 2️⃣ Enviar OTP después de la autenticación correcta

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// 4️⃣ Verificación del OTP
const login = async (req, res) => {
  const { correo, contraseña } = req.body;
  const config = getConfig();
  const MAX_INTENTOS = config.MAX_INTENTOS;
  const BLOQUEO_TIEMPO_MINUTOS = config.BLOQUEO_TIEMPO_MINUTOS;

  try {
    const user = await User.findOne({ correo });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Verificar si el usuario está baneado
    if (user.banned) {
      return res.status(403).json({
        message: 'Esta cuenta ha sido baneada. Ponte en contacto con el administrador.',
      });
    }

    // Verificar si la cuenta está bloqueada temporalmente
    if (user.bloquedTo && user.bloquedTo > new Date()) {
      const minutosRestantes = Math.ceil((user.bloquedTo - new Date()) / 1000 / 60);

      return res.status(403).json({
        message: `Cuenta bloqueada. Inténtalo de nuevo en ${minutosRestantes} minutos.`,
      });
    }

    // Verificar la contraseña
    const esContraseñaCorrecta = await bcrypt.compare(contraseña, user.contraseña);
    if (!esContraseñaCorrecta) {
      user.failtrys += 1; // Incrementar los intentos fallidos

      // Si alcanza el límite de intentos, bloquear la cuenta
      if (user.failtrys >= MAX_INTENTOS) {
        user.bloquedTo = new Date(Date.now() + BLOQUEO_TIEMPO_MINUTOS * 60 * 1000); // Bloquear por el tiempo especificado
        await user.save();

        // Registrar en los logs que la cuenta fue bloqueada
        await logAndReset('warn', `Cuenta bloqueada: ${correo} tras ${MAX_INTENTOS} intentos fallidos.`);

        return res.status(403).json({
          message: 'Cuenta bloqueada por múltiples intentos fallidos.',
        });
      }

      await user.save(); // Guardar el incremento de intentos

      return res.status(401).json({ message: 'Contraseña incorrecta. Inténtalo de nuevo.' });
    }

    // Si la contraseña es correcta, reiniciar los intentos fallidos y limpiar bloqueo
    user.failtrys = 0;
    user.bloquedTo = null;

    // Generar OTP y guardarlo en el usuario
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000; // Expira en 5 minutos
    await user.save();

    // Enviar OTP por correo
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: correo,
      subject: 'Tu código OTP para iniciar sesión',
      text: `Tu código OTP es: ${otp}. Este código expira en 5 minutos.`,
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.error('Error al enviar el OTP:', error);
        return res.status(500).json({ message: 'Error al enviar el OTP.' });
      }

      // Responder al cliente para que proceda con la verificación del OTP
      res.status(200).json({ message: 'OTP enviado. Por favor, verifica tu correo.' });
    });

  } catch (error) {
    console.error('Error en el login:', error);
    res.status(500).json({ message: 'Error en el servidor.' });
  }
};


// Verificar OTP (Paso 2)
const verifyOtp = async (req, res) => {
  const { correo, otp } = sanitize(req.body);

  try {
    const user = await User.findOne({ correo });

    if (!user || user.otp !== otp || Date.now() > user.otpExpires) {
      return res.status(400).json({ message: 'OTP inválido o expirado.' });
    }

    // Limpiar OTP después de la verificación
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    // Generar token JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Guardar el JWT en una cookie HTTP-Only
    res.cookie('token', token, {
      httpOnly: true, // Protección contra acceso desde JavaScript
      secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
      maxAge: 3600000, // 1 hora
    });

    res.status(200).json({ message: 'Inicio de sesión exitoso.', role: user.role });
  } catch (error) {
    console.error('Error en la verificación del OTP:', error);
    res.status(500).json({ message: 'Error al verificar el OTP.' });
  }
};

const logout = (req, res) => {
  res.clearCookie('token'); // Elimina la cookie del token
  res.status(200).json({ message: 'Sesión cerrada exitosamente.' });
};



module.exports = { register, login, verifyOtp, verifyAccount, logout };


