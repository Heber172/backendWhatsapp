const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');
const authMiddleware = require("../middleware/authMiddleware");

// Definición de rutas
//router.post('/iniciarUsuario',authMiddleware ,whatsappController.iniciarUsuario);
router.post('/enviar',authMiddleware , whatsappController.enviarMensaje);
router.get('/recibir/:h',authMiddleware , whatsappController.recibirMensajes);
router.get('/qr/:cod_usuario',authMiddleware , whatsappController.obtenerQR);
router.get('/estado/:cod_usuario',authMiddleware , whatsappController.estadoCliente);


module.exports = router;
