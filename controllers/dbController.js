const mongoose = require('mongoose');

// Obtener todas las colecciones en la base de datos
getCollections = async (req, res) => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    res.json(collections.map(col => col.name));
  } catch (error) {
    console.error('Error al obtener colecciones:', error);
    res.status(500).json({ error: 'Error al obtener colecciones' });
  }
};

// Obtener los documentos de una colección específica
getCollectionData = async (req, res) => {
  const collectionName = req.params.collection;
  try {
    const data = await mongoose.connection.db.collection(collectionName).find({}).toArray();
    res.json(data);
  } catch (error) {
    console.error('Error al obtener datos de la colección:', error);
    res.status(500).json({ error: `Error al obtener datos de la colección ${collectionName}` });
  }
};

module.exports = { getCollectionData, getCollections};