const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  type: { type: String, required: true },  // Tipo de configuración ('facebook', 'instagram', etc.)
  value: { type: String, required: true }, // Valor asociado (URL o texto)
  updatedAt: { type: Date, default: Date.now } // Fecha de última actualización
});


module.exports = mongoose.model('Config', configSchema);
