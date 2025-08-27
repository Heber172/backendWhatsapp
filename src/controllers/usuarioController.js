const Usuario = require('../models/usuarioModel');
const whatsappController = require('../controllers/whatsappController');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const multer = require('multer');
const upload = multer({ dest: 'public/' });
const fs = require('fs');
const path = require('path');
const { Status } = require('whatsapp-web.js');
const Rol = require('../models/rolModelo');
const helpers = require('../helpers/helpers');
const Configuracion = require('../models/configuracionModelo.js');
exports.login = async (req, res) => {
    const { nombreUsuario, contrasena } = req.body;
    let intento = 0;
    try {
        // Verificar si el usuario existe
        const usuarioEncontrado = await Usuario.getNombreUsuario(nombreUsuario);
        if (usuarioEncontrado.length === 0) {
            return res.status(404).json({
                status: false,
                message: 'Usuario no encontrado'
            });
        }
        const verifica = await bcrypt.compare(contrasena, usuarioEncontrado[0].contrasena);
        // Verificar credenciales
        // const usuarioValido = await Usuario.getUsuarioPorCredenciales(nombreUsuario, hashedPassword);
        if (!verifica) {
            intento = usuarioEncontrado[0].intentos;
            if (intento < 5) {
                intento = intento + 1;
                await Usuario.actualizarIntentos(usuarioEncontrado[0].cod_usuario, intento);
                return res.status(401).json({
                    status: false,
                    message: `Credenciales incorrectas Le quedan ${5-intento} intentos `
                });
            }else{
             if (!usuarioEncontrado[0].fecha_intentos) {
                  const fechaActual = new Date();
                  // Sumar 5 minutos
                  fechaActual.setMinutes(fechaActual.getMinutes() + 1);
                  await Usuario.actualizarFechaIntentos(usuarioEncontrado[0].cod_usuario, fechaActual);
                  return res.status(401).json({
                      status: false,
                      message: "Demasiados intentos fallidos. Su cuenta ha sido bloqueada por 5 minutos."
                  });
              }else{
                const fechaActual = new Date();
                const fechaIntentos = new Date(usuarioEncontrado[0].fecha_intentos);

                if (fechaActual < fechaIntentos) {
                    // Diferencia en milisegundos
                    const diffMs = fechaIntentos - fechaActual;
                    // Convertir a minutos (redondeando hacia arriba)
                    const minutosRestantes = Math.ceil(diffMs / (1000 * 60));

                    return res.status(401).json({
                        status: false,
                        message: `Tuvo demasiados intentos, le quedan ${minutosRestantes} minuto(s) para desbloquearse`
                    });
                } else {
                  await Usuario.actualizarIntentos(usuarioEncontrado[0].cod_usuario, 1);
                  await Usuario.actualizarFechaIntentos(usuarioEncontrado[0].cod_usuario, null); 
                  return res.status(401).json({
                        status: false,
                        message: `contraseña incorrecta.`
                  });
                }
              }
            }
            
            
        }

        const token = jwt.sign(
            { id: usuarioEncontrado.id, email: usuarioEncontrado.email },
            process.env.JWT_SECRET,
            { expiresIn: "4h" }
        );
        await whatsappController.iniciarUsuario(usuarioEncontrado[0].cod_usuario);
        const permisos = await Rol.getRolesPermsosPorRol(usuarioEncontrado[0].cod_rol);
        if(usuarioEncontrado[0].estado === 2){
            return res.status(401).json({
                status: false,
                message: 'Usuario desactivado',
            });  
        }else {
            // Éxito: enviar datos del usuario
            return res.status(200).json({
                status: true,
                usuario: {
                    cod_usuario: usuarioEncontrado[0].cod_usuario,
                    nombre: usuarioEncontrado[0].nombre,
                    paterno: usuarioEncontrado[0].paterno,
                    materno: usuarioEncontrado[0].materno,
                    nombreUsuario: usuarioEncontrado[0].nombreUsuario,
                    foto: usuarioEncontrado[0].foto,
                    estado: usuarioEncontrado[0].estado,
                    permisos: permisos
                },
                token: token// solo primer resultado
            });    
        }
        

    } catch (error) {
        console.error('Error en login:', error);
        return res.status(500).json({
            status: false,
            message: 'Error interno del servidor'
        });
    }
};

exports.guardarUsuario = async (req, res) => {
  try {
    // Datos del formulario (texto)
    const { cod_rol, nombre, paterno, materno, ci, estado } = req.body;

    // Foto subida por Form Data
    const foto = req.file ? req.file.filename : null;

    // Verificar si el CI ya existe
    const usuarioEncontrado = await Usuario.getUsuariosCi(ci);
    if (usuarioEncontrado.length > 0) {
      return res.status(409).json({
        status: false,
        message: 'El CI que ingresó ya se encuentra registrado'
      });
    }

    // Encriptar la contraseña (por ejemplo usando CI)
    const hashedPassword = await bcrypt.hash(ci, 10);
    const usuario = {
      cod_rol: cod_rol,
      nombre: helpers.convertirAMayuscula(nombre),
      paterno: helpers.convertirAMayuscula(paterno),
      materno: helpers.convertirAMayuscula(materno),
      ci,
      foto, // nombre del archivo guardado
      nombreUsuario: helpers.convertirAMinuscula(helpers.generarNombreUsuario(nombre, ci)),
      contrasena: hashedPassword,
      estado
    };

    const id = await Usuario.guardarUsuario(usuario);
    const result = await Configuracion.guardarConfiguracion(id);
    res.status(201).json({
      message: "Usuario creado con éxito",
      status: true
    });

  } catch (error) {
    console.error("Error al guardar usuario:", error);
    res.status(500).json({ message: "Error al crear usuario",
                        status: false
    });
  }
};

exports.editarUsuario = async(req, res) =>{
    try {
        const { id } = req.params;

        // Validar que exista el usuario
        const usuarioExistente = await Usuario.getUsuarioPorCodUsuario(id);
        if (!usuarioExistente) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        
        res.json({ 
                status: true,
                usuario: usuarioExistente[0] });

    } catch (error) {
        res.status(500).json({ message: "Error interno del servidor" });
    }
}


exports.actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params; // ID del usuario a actualizar
    const { cod_rol, nombre, paterno, materno, ci, estado, foto: fotoTexto } = req.body;
    // Verificar si el CI ya existe
    const usuarioEncontrado = await Usuario.getUsuariosCi(ci);
    if (usuarioEncontrado.length > 0) {
      return res.status(409).json({
        status: false,
        message: 'El CI que ingresó ya se encuentra registrado'
      });
    }
    
    // Buscar usuario actual en la BD
    const usuarioExistente = await Usuario.getUsuarioPorCodUsuario(id);
    if (!usuarioExistente) {
      return res.status(404).json({
        status: false,
        message: "Usuario no encontrado"
      });
    }
    let nuevaFoto = usuarioExistente[0].foto; // valor por defecto

    // Si llega un archivo nuevo
    if (req.file) {
      // Eliminar la foto anterior si existía
      if (usuarioExistente[0].foto) {
        const rutaFotoAnterior = path.join(__dirname, '..', '..', 'public', usuarioExistente[0].foto);
        if (fs.existsSync(rutaFotoAnterior)) {
          fs.unlinkSync(rutaFotoAnterior);
        }
      }
      nuevaFoto = req.file.filename;

    } else if (fotoTexto==="null") {
      // Si mandaron un texto con el nombre de la foto → no se hace nada
      if(usuarioExistente[0].foto){
        const rutaFotoAnterior = path.join(__dirname, '..', '..', 'public', usuarioExistente[0].foto);
        if (fs.existsSync(rutaFotoAnterior)) {
          fs.unlinkSync(rutaFotoAnterior);
        }
      }
      nuevaFoto = "";
    }

    const usuario = {
      cod_rol: cod_rol,
      nombre: helpers.convertirAMayuscula(nombre),
      paterno: helpers.convertirAMayuscula(paterno),
      materno: helpers.convertirAMayuscula(materno),
      ci,
      foto: nuevaFoto,
      estado
    };

    await Usuario.actualizarUsuario(id, usuario);

    res.status(200).json({
      message: "Usuario actualizado con éxito",
      status: true
    });

  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({
      message: "Error al actualizar usuario",
      status: false
    });
  }
};

exports.actualizarEstado = async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener usuario existente
        const usuarioExistente = await Usuario.getUsuarioPorCodUsuario(id);
        if (!usuarioExistente || usuarioExistente.length === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        // Alternar estado
        let estado = usuarioExistente[0].estado === 2 ? 1 : 2; 

        const result = await Usuario.actualizarEstado(id, estado);
        if (result.affectedRows === 0) {
            return res.status(500).json({ message: "No se pudo actualizar el estado" });
        }

        res.json({ message: "Estado del usuario actualizado con éxito", status: true });

    } catch (error) {
        console.error("Error al actualizar estado del usuario:", error);
        res.status(500).json({ message: "Error interno del servidor",status: false });
    }
};
exports.listarUsuarios = async (req, res) => {
    try {
        // Obtener parámetros de query
        const page = parseInt(req.query.page) || 1;
        const itemsPerPage = parseInt(req.query.itemsPerPage) || 10;
        const q = req.query.q || '';
        const sortBy = req.query.sortBy || 'created_at';
        const orderBy = req.query.orderBy || 'desc';

        // Llamar al modelo
        const resultado = await Usuario.listarUsuarios({ page, itemsPerPage, q, sortBy, orderBy });
        res.status(200).json({
            status: true,
            usuarios: resultado.usuarios,
            total: resultado.total,
            page: resultado.page,
            itemsPerPage: resultado.itemsPerPage,
            totalPages: resultado.totalPages,
            last_page: resultado.last_page
        });

    } catch (error) {
        console.error("Error al listar usuarios:", error);
        res.status(500).json({
            status: false,
            message: "Error interno del servidor"
        });
    }
};