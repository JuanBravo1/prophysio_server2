const User = require('../models/User'); // Modelo de User
const Config = require('../models/Settings')
const fs = require('fs');
const path = require('path');

// Ruta del archivo de configuración
const configPath = path.join(__dirname, 'settings.json');

// Obtener la configuración actual
const getConfig = (req, res) => {
    fs.readFile(configPath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Error al leer la configuración' });
        }

        const config = JSON.parse(data);
        res.status(200).json(config);
    });
};

// Actualizar la configuración
const updateConfig = (req, res) => {
    const newConfig = req.body; // Valida esta información en producción

    fs.writeFile(configPath, JSON.stringify(newConfig, null, 2), 'utf8', (err) => {
        if (err) {
            return res.status(500).json({ message: 'Error al guardar la configuración' });
        }

        res.status(200).json({ message: 'Configuración actualizada correctamente' });
    });
};

const toggleBlockUser = async (req, res) => {
    const userId = req.params.id;
    try {
        // Buscar usuario por ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Cambiar el estado de `banned`
        user.banned = !user.banned;
        await user.save();

        res.status(200).json({
            message: user.banned ? 'Usuario bloqueado' : 'Usuario desbloqueado',
            banned: user.banned,
        });
    } catch (error) {
        console.error('Error al bloquear/desbloquear usuario:', error);
        res.status(500).json({ message: 'Error al actualizar el estado del usuario' });
    }
}

const getUsers = async (req, res) => {
    try {
        const { estado, correo } = req.query;

        // Crear un filtro dinámico basado en los parámetros que se pasen
        let query = {};

        // Filtrar por correo si se proporciona
        if (correo) {
            query.correo = { $regex: correo, $options: 'i' }; // Búsqueda insensible a mayúsculas/minúsculas
        }

        // Filtrar por estado (banned, active, inactive)
        if (estado) {
            if (estado === 'banned') {
                query.banned = true; // Solo usuarios baneados
            }
            else {
                query.banned = false; // Solo usuarios baneados
            }
        }

        // Buscar usuarios que coincidan con el filtro
        const users = await User.find(query);

        // Devolver los usuarios encontrados
        res.json(users);
    } catch (error) {
        console.error('Error al buscar usuarios:', error);
        res.status(500).json({ message: 'Error al buscar usuarios' });
    }
}

const textEmailActivation = async (req, res) => {
    const configPath = path.join(__dirname, './authsettings.json');
    const { emailActivationMessage, emailActivationExpiry } = req.body;

    // Lee la configuración actual
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    // Actualiza los valores de mensaje y tiempo de expiración
    config.emailActivation.message = emailActivationMessage;
    config.emailActivation.expiryHours = emailActivationExpiry;

    // Guarda la nueva configuración
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

    res.status(200).json({ message: 'Configuración actualizada exitosamente' });
}


const getconfigConstants = async (req, res) => {

    try {
        const config = await Config.find();
        console.log(config);
        res.json(config);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener configuración' });
    }
}

const postconfigConstants = async (req, res) => {
    const updates = req.body;  // Esperamos un array de configuraciones [{ type, value }, ...]

    try {
        // Usamos Promise.all para procesar todas las actualizaciones de manera concurrente
        const updatePromises = updates.map(({ type, value }) => {
            return Config.findOneAndUpdate(
                { type },
                { value, updatedAt: Date.now() },
                { new: true, upsert: true } // upsert: true crea el documento si no existe
            );
        });

        // Ejecutamos todas las promesas de actualización
        await Promise.all(updatePromises);

        res.status(200).json({ message: 'Configuraciones actualizadas correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar las configuraciones', error });
    }
}




module.exports = { getConfig, updateConfig, toggleBlockUser, getUsers, textEmailActivation, getconfigConstants, postconfigConstants };

