const Config = require('../models/configModel');

// Obtener todas las configuraciones
const getAllConfigFront = async (req, res) => {
  try {
    const configs = await Config.find({});
    res.json(configs); // Devuelve todos los documentos de configuración
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las configuraciones', error });
  }
};

// Obtener una configuración específica
const getConfigFront = async (req, res) => {
  const { type } = req.params;  // Se obtiene el tipo de configuración de los parámetros
  try {
    const config = await Config.findOne({ type });
    if (!config) {
      return res.status(404).json({ message: `Configuración de tipo ${type} no encontrada` });
    }
    res.json(config); // Devuelve el documento de configuración específico
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener la configuración', error });
  }
};

// Actualizar o crear una configuración
const updateConfigFront = async (req, res) => {
  const { type, value } = req.body;  // Los datos vienen en el body
  try {
    let config = await Config.findOne({ type }); // Buscar configuración por tipo
    if (!config) {
      return res.status(404).json({ message: `Configuración de tipo ${type} no encontrada` }); // Si no se encuentra, devuelve un error
    } else {
      config.value = value; // Actualiza el valor existente
      config.updatedAt = Date.now(); // Actualiza la fecha
    }
    await config.save(); // Guarda los cambios
    res.json({ message: `Configuración de tipo ${type} actualizada correctamente` });
  } catch (error) {
    console.error('Error al actualizar la configuración:', error);
    res.status(500).json({ message: 'Error al actualizar la configuración', error });
  }
};

// Eliminar una configuración
const deleteConfigFront = async (req, res) => {
  const { type } = req.params;
  try {
    await Config.deleteOne({ type });
    res.json({ message: `Configuración de tipo ${type} eliminada correctamente` });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar la configuración', error });
  }
};

module.exports = { getAllConfigFront, getConfigFront, updateConfigFront, deleteConfigFront };
