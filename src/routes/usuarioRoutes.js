const express = require('express');
const router = express.Router();
const usuario = require('../controllers/usuarioController');
const upload = require('../middleware/upload');
// Definición de rutas
router.post('/auth/login', usuario.login);
router.post('/guardar', upload.single('foto') ,usuario.guardarUsuario);
router.get("/editar/:id", usuario.editarUsuario);
router.put("/actualizar/:id",upload.single('foto'),usuario.actualizarUsuario);
router.put("/estado/:id", usuario.actualizarEstado);
router.get('/lista', usuario.listarUsuarios);

module.exports = router;
