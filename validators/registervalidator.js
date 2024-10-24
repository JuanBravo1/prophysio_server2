const Joi = require('joi');

// Definir esquema de validación para el registro
const registerSchema = Joi.object({
  nombre: Joi.string().min(3).max(30).required(),
  apellidos: Joi.string().min(3).max(50).required(),
  correo: Joi.string().email().required(),
  contraseña: Joi.string().min(8).required(),
  captchaToken: Joi.string().required(),
  comentarios: Joi.string().allow(''), // Permitir comentarios vacíos
});

module.exports = (req, res, next) => {
  const { error } = registerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};
