require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http'); // importar http
const { Server } = require('socket.io'); // importar socket.io

const app = express();
const port = process.env.PORT || 3000;

// Crear servidor HTTP
const server = http.createServer(app);

// Configurar Socket.IO
const io = new Server(server, {
    cors: {
        origin: "*", // o el dominio de tu frontend
        methods: ["GET", "POST"]
    }
});

// Exportar io para usarlo en otros controladores
module.exports.io = io;

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Importar rutas
const whatsappRoutes = require('./src/routes/whatsappRoutes');
const usuarioRoutes = require('./src/routes/usuarioRoutes');
const cnfiguracionTiempoRoutes = require('./src/routes/configuracionTIempoRoutes');
const rol = require('./src/routes/rolRoutes');

// Usar rutas
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/usuario', usuarioRoutes);
app.use('/api/configuracion', cnfiguracionTiempoRoutes);
app.use('/api/rol', rol);
app.use(express.static('public'));
// Manejo de errores
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// Escuchar conexiones WebSocket13
io.on("connection", (socket) => {
    console.log("Nuevo cliente conectado:", socket.id);

    socket.on("join", (cod_usuario) => {
        socket.join(cod_usuario);
        console.log(`Cliente ${socket.id} se unió al room ${cod_usuario}`);
    });

    socket.on("disconnect", () => {
        console.log("Cliente desconectado:", socket.id);
    });
});

// Iniciar servidor
server.listen(port, '0.0.0.0', () => {
    console.log(`Servidor escuchando en http://192.168.1.43:${port}`);
});
