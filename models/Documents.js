const mongoose = require('mongoose');

const documentoSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  contenido: { type: String, required: true },
  fechaVigencia: { type: Date, required: true },
  eliminado: { type: Boolean, default: false }, // Para la eliminación lógica
  versionActual: { type: Number, default: 1 },  // Control de versión
  fechaCreacion: { type: Date, default: Date.now }
}, { collection: 'Documentos' });

module.exports = mongoose.model('Documento', documentoSchema);