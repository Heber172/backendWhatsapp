const Configuracion = require('../models/configuracionModelo.js');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const fs = require('fs');
const path = require('path');


exports.guardarConfiguracion = async (req, res) => {
  try {
    // Datos del formulario (texto)
    const { cod_usuario, tiempo} = req.body;

    const configuracion = {
      cod_usuario: cod_usuario,
      tiempo: tiempo
    };

    const result = await Configuracion.guardarConfiguracion(configuracion);
    res.status(201).json({
      message: "Configuracion de Tiempo creado con éxito",
      status: true
    });

  } catch (error) {
    console.error("Error al guardar la configuracion de Tiempo:", error);
    res.status(500).json({ message: "Error al crear la configuracion de tiempo",
                        status: false
    });
  }
};

exports.editarConfiguracionTiempo = async(req, res) =>{
    try {
        const { id } = req.params;

        // Validar que exista el usuario
        const usuarioExistente = await Configuracion.getTiempoConfiguracion(id);
        if (!usuarioExistente) {
            return res.status(404).json({ message: "COnfiguracion no encontrada" });
        }
        
        res.json({ 
                status: true,
                usuario: usuarioExistente[0] });

    } catch (error) {
        res.status(500).json({ message: "Error interno del servidor" });
    }
}


exports.actualizarConfiguracionTiempo = async (req, res) => {
  try {
    const { id } = req.params; // ID del usuario a actualizar
    const { tiempo } = req.body;

    const configuracionEncontrada = await Configuracion.getTiempoConfiguracion(id);

    if (!configuracionEncontrada || configuracionEncontrada.length === 0) {
      return res.status(404).json({
        status: false,
        message: 'Configuración no encontrada'
      });
    }

    await Configuracion.actualizarConfiguracionTiempo(id, tiempo);

    res.status(200).json({
      message: "Configuración de tiempo actualizada con éxito",
      status: true
    });

  } catch (error) {
    console.error("Error al actualizar configuración de tiempo:", error);
    res.status(500).json({
      message: "Error al actualizar configuración de tiempo",
      status: false
    });
  }
};


