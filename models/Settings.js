const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  type: { type: String, required: true },  // Ejemplo: 'max_intents', 'bloqueo_tiempo', 'message', 'expired_time'
  value: { type: String, required: true }, // El valor de la configuración
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Settings', configSchema, 'configs');
