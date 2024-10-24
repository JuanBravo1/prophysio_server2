

const express = require('express');
const cookieSession= require('cookie-session')
const helmet = require('helmet');

const mongoSanitize = require('express-mongo-sanitize'); // Protección contra inyección NoSQL
const cors = require('cors'); // Para manejar CORS
const connectDB = require('./config/db'); // Conexión a MongoDB
const cookieParser = require('cookie-parser');//Cookies
const authRoutes = require('./routes/authRoutes');
const xss = require('xss-clean'); // Protección contra XSS
require('dotenv').config(); // Cargar variables de entorno

const app = express();
const PORT = process.env.PORT;

// **Conectar a la base de datos**
connectDB();
app.use(xss()); // Usar xss-clean para evitar XSS
app.use(cookieParser()); // Middleware para gestionar cookies


app.get('/ruta-protegida', (req, res) => {
  if (req.cookies.cookiesAccepted === 'true') {
    res.send('Acceso permitido');
  } else {
    res.status(403).send('Por favor acepta las cookies');
  }
});

app.use(
  cookieSession({
    name: 'session',
    keys: [
      process.env.MASTER_COOKIE_KEY_V1,
      process.env.MASTER_COOKIE_KEY_V2,
    ],
    cookie: {
      httpOnly: true, // Asegura que las cookies solo sean accesibles desde el servidor
      secure: process.env.NODE_ENV === 'production', // Usar secure en producción
      sameSite: 'strict', // Evitar CSRF
      maxAge: 3600000 // 1 hora
    }
  })
);


app.use(
  helmet({
    contentSecurityPolicy: false, // Desactivar CSP si usas recursos externos como imágenes
    crossOriginEmbedderPolicy: false, // Evitar bloqueos al cargar algunos assets
  })
);


// 2. **CORS (Cross-Origin Resource Sharing)** 
const corsOptions = {
  origin: process.env.CLIENT_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Permite estos métodos
  allowedHeaders: ['Content-Type', 'Authorization'], // Permite estos headers
  credentials: true, 
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));




// 4. **Sanitización de entradas para prevenir inyección NoSQL**
app.use(mongoSanitize());

// 5. **Middleware para manejar JSON y URL-encoded**
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 6. **Rutas de autenticación**
app.use('/api/auth', authRoutes);

// 7. **Manejador para rutas no encontradas (404)**
app.use((req, res, next) => {
  res.status(404).json({ message: 'Ruta no encontrada.' });
});

// 8. **Manejador global de errores (opcional)**
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error interno del servidor.' });
});

// 9. **Iniciar servidor**
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
