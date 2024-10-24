// config/db.js
const mongoose = require('mongoose');
require('dotenv').config(); // Para cargar las variables de entorno

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Conectado a MongoDB Atlas');
  } catch (error) {
    console.error('Error conectando a MongoDB Atlas:', error);
    process.exit(1); // Detener el servidor si la conexión falla
  }
};

module.exports = connectDB;
