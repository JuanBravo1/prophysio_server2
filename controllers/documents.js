const Documento = require('../models/Documents');
const Version = require('../models/History');

const crearDocumento = async (req, res) => {
    const { titulo, contenido, fechaVigencia } = req.body;

    try {
        const nuevoDocumento = new Documento({
            titulo,
            contenido,
            fechaVigencia
        });

        await nuevoDocumento.save();

        // Guardar la primera versión del documento
        const nuevaVersion = new Version({
            documentoId: nuevoDocumento._id,
            version: 1,
            contenido
        });
        await nuevaVersion.save();

        res.status(201).json({ message: 'Documento creado exitosamente', documento: nuevoDocumento });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear el documento', error });
    }
};
const obtenerDocumentos = async (req, res) => {
    try {
        const documentos = await Documento.find({ eliminado: false }); // Solo documentos no eliminados
        res.status(200).json(documentos);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener documentos', error });
    }
};
const modificarDocumento = async (req, res) => {
    const { id } = req.params;
    const { titulo, contenido, fechaVigencia } = req.body;

    try {
        const documento = await Documento.findById(id);
        if (!documento) return res.status(404).json({ message: 'Documento no encontrado' });

        // Crear una nueva versión antes de actualizar
        const nuevaVersion = new Version({
            documentoId: id,
            version: documento.versionActual + 1,
            contenido
        });
        await nuevaVersion.save();

        // Actualizar el documento principal
        documento.titulo = titulo;
        documento.contenido = contenido;
        documento.fechaVigencia = fechaVigencia;
        documento.versionActual += 1;

        await documento.save();

        res.status(200).json({ message: 'Documento modificado exitosamente', documento });
    } catch (error) {
        res.status(500).json({ message: 'Error al modificar el documento', error });
    }
};
const marcarEliminado = async (req, res) => {
    const { id } = req.params;

    try {
        const documento = await Documento.findById(id);
        if (!documento) return res.status(404).json({ message: 'Documento no encontrado' });

        documento.eliminado = true;
        await documento.save();

        res.status(200).json({ message: 'Documento marcado como eliminado', documento });
    } catch (error) {
        res.status(500).json({ message: 'Error al marcar el documento como eliminado', error });
    }
};
const obtenerHistorial = async (req, res) => {
    const { id } = req.params;

    try {
        const historial = await Version.find({ documentoId: id }).sort({ version: -1 }); // Ordenar por versión
        if (historial.length === 0) return res.status(404).json({ message: 'No se encontraron versiones' });

        res.status(200).json(historial);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el historial', error });
    }
};

module.exports={crearDocumento, obtenerDocumentos, modificarDocumento, marcarEliminado, obtenerHistorial}