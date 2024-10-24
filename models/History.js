const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema({
  documentoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Documento', required: true },
  version: { type: Number, required: true },
  contenido: { type: String, required: true },
  fechaCreacion: { type: Date, default: Date.now },
  estado: { type: String, default: 'activo' }  // Activo, modificado, archivado, etc.
}, { collection: 'HistorialVersiones' });

module.exports = mongoose.model('Version', versionSchema);
