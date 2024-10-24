const express = require('express');
const { cookies, clearCookies, checkCookies}= require('../controllers/cookieController.js');
const { register, login, verifyAccount, verifyOtp, logout } = require('../controllers/authController');
const { getCollections, getCollectionData } = require('../controllers/dbController')
const { requestPasswordReset, resetPassword } = require('../controllers/passwordController');
const {authMiddleware,adminMiddleware} = require('../middleware/authMiddleware');
const rateLimit = require('express-rate-limit');
const loginValidator = require('../validators/loginValidator'); // Middleware de validación de login
const registerValidator = require('../validators/registervalidator'); // Middleware de validación de registro

const { getAllConfigFront, getConfigFront, updateConfigFront, deleteConfigFront } = require('../controllers/frontController.js');

const {crearDocumento,marcarEliminado,modificarDocumento,obtenerDocumentos,obtenerHistorial}= require('../controllers/documents.js')

const { getConfig, updateConfig, toggleBlockUser, getUsers, textEmailActivation, getconfigConstants,postconfigConstants } = require('../controllers/settingsController.js'); // Asegúrate de ajustar la ruta

const router = express.Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Demasiadas solicitudes desde esta IP, inténtelo más tarde.',
});


router.get('/config',getconfigConstants);
router.post('/config',postconfigConstants)



router.post('/documentos', crearDocumento); // Crear un nuevo documento
router.get('/documentos', obtenerDocumentos); // Obtener todos los documentos
router.put('/documentos/:id', modificarDocumento); // Modificar documento
router.put('/documentos/:id/marcar-eliminado', marcarEliminado); // Marcar como eliminado
router.get('/documentos/:id/historial', obtenerHistorial); // Obtener historial de versiones


// Rutas para las configuraciones
router.get('/front', getAllConfigFront); // Obtener todas las configuraciones
router.get('/front/:type', getConfigFront); // Obtener una configuración específica
router.post('/front', (req, res, next) => {
  console.log('Petición POST recibida en /front');
  next();
}, updateConfigFront);
 // Crear o actualizar una configuración específica
router.delete('/front/:type', deleteConfigFront); // Eliminar una configuración específica





router.post('/blockUser/:id', toggleBlockUser);
router.get('/config', getConfig); // Usamos la función exportada getConfig
router.post('/config', updateConfig); // Usamos la función exportada updateConfig
router.get('/collections/Users', getUsers);
router.post ('/emailActivation', textEmailActivation);


router.post('/accept-cookies', cookies);
router.post('/clear-cookies', clearCookies);
router.get('/check-cookies', checkCookies);

router.post('/register', registerValidator, register); // Validar antes del registro
router.post('/login', loginValidator, login);
router.get('/verify/:token', verifyAccount); // Verificar cuenta
router.post('/verify-otp', verifyOtp); // Verificar OTP
router.post('/request-password-reset', requestPasswordReset); // Enviar token por correo
router.post('/logout', logout); // 
router.post('/reset-password/:token', resetPassword); // Restablecer contraseña

router.get('/test', (req, res) => {
  res.status(200).json({ message: 'El servidor está funcionando correctamente' });
});

router.get('/collections', getCollections);
router.get('/collections/:collection', getCollectionData);

router.get('/perfil', authMiddleware, (req, res) => {
  res.status(200).json({ message: `Bienvenido, usuario ${req.user.id}` });
});

router.get('/admin',authMiddleware, adminMiddleware, (req, res) => {
  console.log("ola");
  res.status(200).json({ message: `Bienvenido, Admin: ${req.user.id}` });
});








module.exports = router;
