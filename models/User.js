const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nombre: String,
  apellidos: String,
  correo: { type: String, unique: true },
  contraseña: String,
  comentarios: { type: String},
  status: { type: String, default: 'inactive' },
  role: { type: String, default: 'user' },
  otp: String,
  otpExpires: Date, 
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  failtrys: { type: Number, default: 0 },
  bloquedTo: { type: Date, default: null }, // Tiempo de bloqueo
  banned: { type: Boolean, default: false }, // Campo para saber si el usuario está baneado

}, { collection: 'Users' });

module.exports = mongoose.model('User', userSchema);