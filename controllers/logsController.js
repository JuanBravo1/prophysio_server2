
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;
const MongoDB = require('winston-mongodb');
const DailyRotateFile = require('winston-daily-rotate-file');
require('dotenv').config(); // Cargar variables de entorno

// Importar modelo o conexión de mongoose
const mongoose = require('mongoose');

// Conectar a MongoDB usando mongoose
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Número máximo de logs permitidos
const MAX_LOGS = 10;

// Formato personalizado para los logs
const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

// Función para resetear la colección de logs si excede el límite
const resetLogCollection = async () => {
  const Log = mongoose.connection.collection('Logs'); // Usamos la colección 'Logs'

  try {
    const logCount = await Log.countDocuments(); // Contar cuántos logs hay en la colección
    console.log(`Número de logs en la colección: ${logCount}`);
    if (logCount > MAX_LOGS) {
      // Eliminar todos los documentos de la colección cuando se excede el límite
      await Log.deleteMany({});
      console.log(`Colección de logs reseteada, se eliminaron ${logCount} logs.`);
    }
  } catch (error) {
    console.error('Error al resetear la colección de logs:', error);
  }
};

// Configurar winston para registrar en archivos, con rotación diaria, y MongoDB
const logger = createLogger({
    level: 'silly', // Nivel mínimo de logs (acepta todos los niveles: silly, debug, info, warn, error)
    format: combine(
      timestamp(), // Agregar timestamp a los logs
      logFormat    // Aplicar el formato personalizado
    ),
    transports: [
      // Rotación diaria de archivos locales
      new DailyRotateFile({
        filename: 'logs/application-%DATE%.log', // Logs se archivan con la fecha
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m', // Tamaño máximo por archivo (20 MB)
        maxFiles: '14d', // Mantener los logs por 14 días
      }),
      
      // Transportador para MongoDB
      new MongoDB.MongoDB({
        level: 'silly', // Acepta todos los niveles de logs
        db: process.env.MONGO_URI,
        options: { useUnifiedTopology: true },
        collection: 'Logs', // Nombre de la colección de logs
        tryReconnect: true
      })
    ],
  });
  

// Mostrar los logs en consola durante desarrollo

// Función para registrar un log y ejecutar la limpieza de logs
const logAndReset = async (level, message) => {
    // Registrar el log
    logger.log({ level, message });
    
    // Después de registrar el log, gestionar el límite de la colección
    await resetLogCollection();
  };
  

// Exportar la función para registrar un log y gestionar el límite
module.exports = { logAndReset };
