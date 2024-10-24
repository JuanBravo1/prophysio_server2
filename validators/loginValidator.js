const Joi = require('joi');

// Definir esquema de validación para login
const loginSchema = Joi.object({
  correo: Joi.string().email().required(),
  contraseña: Joi.string().min(8).required(),
});

module.exports = (req, res, next) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};
