const express = require('express');
const router = express.Router();
const configuracionTiempo = require('../controllers/configuracionController');
// Definición de rutas
router.post('/guardar', configuracionTiempo.guardarConfiguracion);
router.get("/editar/:id", configuracionTiempo.editarConfiguracionTiempo);
router.put("/actualizar/:id",configuracionTiempo.actualizarConfiguracionTiempo);

module.exports = router;
