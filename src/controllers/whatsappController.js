const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');
const { io } = require('../../app');
const EstadoWhatsapp = require('../models/estadowhatsappModelo.js');
// Almacenar datos de clientes por usuario
const clients = {};

// 🔹 Emitir estado actual al frontend
function emitirEstado(cod_usuario) {
    if (!clients[cod_usuario]) {
        io.to(cod_usuario).emit("estado_whatsapp", { conectado: false });
    } else {

        io.to(cod_usuario).emit("estado_whatsapp", { conectado: clients[cod_usuario].clientReady });
    }
}

// Crear un nuevo cliente de WhatsApp para un usuario
function createClient(cod_usuario) {
    const client = new Client({
        puppeteer: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        },
    });

    clients[cod_usuario] = {
        client,
        lastQrImage: null,
        clientReady: false,
        messages: [],
        qrAttempts: 0
    };

    // Evento QR
    client.on('qr', async qr => {
        qrcodeTerminal.generate(qr, { small: true });
        const qrData = await qrcode.toDataURL(qr);

        clients[cod_usuario].lastQrImage = qrData;
        clients[cod_usuario].clientReady = false;
        clients[cod_usuario].qrAttempts++;

        io.to(cod_usuario).emit("qr", qrData);
        emitirEstado(cod_usuario);

        console.log(`Nuevo QR generado para usuario ${cod_usuario} (intento ${clients[cod_usuario].qrAttempts})`);
    });

    // Evento ready
    client.on('ready', async () => {
        console.log(`Cliente ${cod_usuario} está listo`);
        clients[cod_usuario].clientReady = true;
        clients[cod_usuario].qrAttempts = 0;

        // Obtener estado de sesion de whatsapp existente
        const estadoSession = await EstadoWhatsapp.getestadoWhatsappPorUsuario(cod_usuario);
        // Alternar estado
        let estado = estadoSession[0].estado === 1 ? 0 : 1; 

        const result = await EstadoWhatsapp.actualizarEstadoDeWhatsapp(cod_usuario, estado);

        io.to(cod_usuario).emit("ready");
        emitirEstado(cod_usuario);
    });

    // Evento de desconexión
    client.on('disconnected', async (reason) => {
                // Obtener estado de sesion de whatsapp existente
        const estadoSession = await EstadoWhatsapp.getestadoWhatsappPorUsuario(cod_usuario);
        if(estadoSession[0].estado === 1){
            await EstadoWhatsapp.actualizarEstadoDeWhatsapp(cod_usuario, 0);
        }
        console.log(`Cliente ${cod_usuario} desconectado: ${reason}`);
        clients[cod_usuario].clientReady = false;

        io.to(cod_usuario).emit("whatsapp_disconnected", reason);
        emitirEstado(cod_usuario);

        if (reason !== 'LOGOUT') {
            setTimeout(() => {

                console.log(`Reintentando conexión para usuario ${cod_usuario}`);
                client.initialize();
            }, 5000);
        }
    });

    // Evento de mensajes
    client.on('message_create', message => {
        console.log(`Mensaje (${cod_usuario}):, message.body`);

        clients[cod_usuario].messages.push({
            id: message.id._serialized,
            from: message.from,
            body: message.body,
            timestamp: message.timestamp,
        });

        io.to(cod_usuario).emit("new_message", {
            id: message.id._serialized,
            from: message.from,
            body: message.body,
            timestamp: message.timestamp,
        });

        if (message.body === '!ping') {
            message.reply('pong');
        }
    });

    client.initialize();
}

// Iniciar cliente por usuario
function iniciarUsuario(cod_usuario) {
    if (clients[cod_usuario] && clients[cod_usuario].clientReady) {
        return false;
    }
    if (clients[cod_usuario]) {
        clients[cod_usuario].client.destroy();
    }
    createClient(cod_usuario);
    return true;
}

// Cerrar sesión
async function cerrarSesion(req, res) {
    const { cod_usuario } = req.params;

    if (!clients[cod_usuario]) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    try {
        await clients[cod_usuario].client.logout();
        delete clients[cod_usuario];

        io.to(cod_usuario).emit("session_closed");
        emitirEstado(cod_usuario);

        res.json({ message: 'Sesión cerrada correctamente' });
    } catch (error) {
        console.error(`Error cerrando sesión (${cod_usuario}):, error`);
        res.status(500).json({ error: 'Error cerrando sesión' });
    }
}

// Enviar mensaje
async function enviarMensaje(req, res) {
    const { numeroDestino, mensaje, cod_usuario } = req.body;

    if (!clients[cod_usuario]) {
        return res.status(404).json({ error: 'Cliente no encontrado en Mensaje', cliente:req.body });

    }
    if (!clients[cod_usuario].clientReady) {
        return res.status(400).json({ error: 'Cliente no está listo. Escanea el QR primero.' });
    }
    if (!numeroDestino || !mensaje) {
        return res.status(400).json({ error: 'Número y mensaje requeridos' });
    }

    try {
        const chatId = `591${numeroDestino}@c.us`;
        const response = await clients[cod_usuario].client.sendMessage(chatId, mensaje);
        res.json({ message: 'Mensaje enviado', response });
    } catch (error) {
        console.error(`Error enviando mensaje (${cod_usuario}):, error`);
        res.status(500).json({ error: 'Error enviando mensaje' });
    }
}

// Recibir mensajes
function recibirMensajes(req, res) {
    const { cod_usuario } = req.params;
    if (!clients[cod_usuario]) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json({ messages: clients[cod_usuario].messages });
}

// Obtener QR
function obtenerQR(req, res) {
    const { cod_usuario } = req.params;
    if (!clients[cod_usuario] || !clients[cod_usuario].lastQrImage) {
        return res.status(404).send('QR no disponible.');
    }
    const base64Data = clients[cod_usuario].lastQrImage.split(',')[1];
    const imgBuffer = Buffer.from(base64Data, 'base64');

    res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': imgBuffer.length
    });
    res.end(imgBuffer);
}

// Estado del cliente
function estadoCliente(req, res) {
    const { cod_usuario } = req.params;
    if (!clients[cod_usuario]) {
        return res.status(404).json({ status: false, message: 'Cliente no encontrado' });
    }
    if (clients[cod_usuario].clientReady) {
        return res.status(200).json({ status: true, message: 'Client is ready!' });
    } else {
        return res.status(202).json({ status: false, message: 'Esperando lectura del QR...' });
    }
}

// 🔹 Nuevo endpoint: verificar conexión (true/false)
function verificarConexion(req, res) {
    const { cod_usuario } = req.params;

    if (!clients[cod_usuario]) {
        return res.json({ conectado: false });
    }
    return res.json({ conectado: clients[cod_usuario].clientReady });
}

module.exports = {
    iniciarUsuario,
    enviarMensaje,
    recibirMensajes,
    obtenerQR,
    estadoCliente,
    cerrarSesion,
    verificarConexion
};
