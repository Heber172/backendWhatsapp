const express = require('express');
const router = express.Router();
const rol = require('../controllers/rolController');
// Definición de rutas
router.post('/guardar',rol.guardarRol);
router.put("/actualizar/:id",rol.actualizarRol);
router.put("/estado/:id", rol.actualizarEstado);
router.get('/lista', rol.listarRoles);
router.get('/obtenerRol', rol.obtenerRol);
router.get('/crear', rol.obtenerPermisos);
router.get('/editar/:id', rol.obtenerPermisosPorRol);
module.exports = router;
