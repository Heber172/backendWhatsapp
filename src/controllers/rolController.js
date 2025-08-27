const Rol = require('../models/rolModelo');
const helpers = require('../helpers/helpers.js')
exports.guardarRol = async (req, res) => {
  try {
    //  Datos del formulario
    const { nombre, cod_permiso } = req.body;
	
    // Validar que haya permisos
    if (!Array.isArray(cod_permiso) || cod_permiso.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Debe enviar un array de permisos"
      });
    }
	// Verificar que no exista otro rol con el mismo nombre
    const nombreRolMayus = helpers.convertirAMayuscula(nombre);
    const nombreDeRolEncontrado = await Rol.getRolPorNombreRol(nombreRolMayus);
    if (nombreDeRolEncontrado && nombreDeRolEncontrado.length > 0 && nombreDeRolEncontrado[0].cod_rol != cod_rol) {
      return res.status(409).json({ status: false, message: "El Rol ya existe" });
    }
    // Guardar el rol
    const nombreRol = helpers.convertirAMayuscula(nombre);
    const cod_rol = await Rol.guardarRoles(nombreRol);

    // Insertar permisos asociados
    const permisosUnicos = [...new Set(cod_permiso)];
    const resultados = [];
    for (const permiso of permisosUnicos) {
      const result = await Rol.guardarRolesPermisos(cod_rol, permiso);
      resultados.push(result);
    }

    res.status(201).json({
      message: "Rol y permisos creados con éxito",
      status: true,
      cod_rol,
      totalPermisos: resultados.length
    });

  } catch (error) {
    console.error("Error al guardar el Rol y sus permisos:", error);
    res.status(500).json({
      message: "Error al crear el Rol y sus permisos",
      status: false
    });
  }
};


exports.actualizarRol = async (req, res) => {
  try {
    const { id } = req.params; // ID del rol a actualizar
    const { nombre, cod_permiso } = req.body; // cod_permiso es un array
    // Verificar si el rol existe
    const rolEncontrado = await Rol.getRolPorCodRol(id);
    if (!rolEncontrado || rolEncontrado.length === 0) {
      return res.status(404).json({ status: false, message: "Rol no encontrado" });
    }
    // Verificar que no exista otro rol con el mismo nombre
    const nombreRolMayus = helpers.convertirAMayuscula(nombre);
    const nombreDeRolEncontrado = await Rol.getRolPorNombreRol(nombreRolMayus);
    let actualizarNombre = true;
    // Si el nombre es el mismo que ya tiene, no actualizamos nombre, pero seguimos con permisos
    if (rolEncontrado[0].nombre === nombreRolMayus) {
      actualizarNombre = false;
    } else if (nombreDeRolEncontrado && nombreDeRolEncontrado.length > 0 && nombreDeRolEncontrado[0].id != id) {
      return res.status(409).json({ status: false, message: "El Rol ya existe" });
    }
    // Actualizar nombre del rol solo si es diferente
    if (actualizarNombre) {
      await Rol.actualizarRoles(id, nombreRolMayus);
    }
    // Actualizar permisos
    await Rol.eliminarRolesPermisos(id); // Eliminar permisos existentes
    const permisosUnicos = [...new Set(cod_permiso)];
    const resultados = [];
    for (const permiso of permisosUnicos) {
      const result = await Rol.guardarRolesPermisos(id, permiso);
      resultados.push(result);
    }
    res.status(200).json({
      message: "Rol y permisos actualizados con éxito",
      status: true,
      totalPermisos: resultados.length,
      nombreActualizado: actualizarNombre
    });
  } catch (error) {
    console.error("Error al actualizar rol y permisos:", error);
    res.status(500).json({ message: "Error al actualizar rol y permisos", status: false });
  }
};

exports.obtenerRol = async(req, res) =>{
    try {
        // Validar que exista el usuario
        const resultado = await Rol.getRoles();
        
        res.json({ 
                status: true,
                roles: resultado});

    } catch (error) {
        res.status(500).json({ message: "Error interno del servidor" });
    }
}
exports.actualizarEstado = async (req, res) => {
  try {
    const { id } = req.params;

    const rolEncontrado = await Rol.getRolPorCodRol(id);
    if (!rolEncontrado || rolEncontrado.length === 0) {
      return res.status(404).json({
        status: false,
        message: 'Rol no encontrado'
      });
    }
    const nuevoEstado = rolEncontrado[0].estado === 2 ? 1 : 2;
    const resultEstado = await Rol.actualizarEstado(id, nuevoEstado);
    if (resultEstado.affectedRows === 0) {
      return res.status(500).json({ message: "No se pudo actualizar el estado" });
    }

    res.status(200).json({
      message: "Estado del rol actualizado y permisos eliminados con éxito",
      status: true,
      nuevoEstado
    });

  } catch (error) {
    console.error("Error al actualizar estado y eliminar permisos del rol:", error);
    res.status(500).json({
      message: "Error interno del servidor",
      status: false
    });
  }
};


exports.listarRoles = async (req, res) => {
    try {
        // Obtener parámetros de query
        const page = parseInt(req.query.page) || 1;
        const itemsPerPage = parseInt(req.query.itemsPerPage) || 10;
        const q = req.query.q || '';
        const sortBy = req.query.sortBy || 'created_at';
        const orderBy = req.query.orderBy || 'desc';

        // Llamar al modelo
        const resultado = await Rol.listarRoles({ page, itemsPerPage, q, sortBy, orderBy });
        res.status(200).json({
            status: true,
            roles: resultado.roles,
            total: resultado.total,
            page: resultado.page,
            itemsPerPage: resultado.itemsPerPage,
            totalPages: resultado.totalPages,
            last_page: resultado.last_page,
            
        });

    } catch (error) {
        console.error("Error al listar roles:", error);
        res.status(500).json({
            status: false,
            message: "Error interno del servidor"
        });
    }
};
exports.obtenerPermisos = async(req, res) =>{
    try {
        // Validar que exista el usuario
        const resultado = await Rol.getPermisos();
        res.json({ 
                status: true,
                permisos: resultado});

    } catch (error) {
        res.status(500).json({ message: "Error interno del servidor" });
    }
}
exports.obtenerPermisosPorRol = async(req, res) =>{
    try {
        const { id } = req.params;
		const resuladoRol = await Rol.getRolPorCodRol(id);
		if (!resuladoRol || resuladoRol.length === 0) {
            return res.status(404).json({ message: "Rol no encontrado" });
        }
        // Validar que exista el usuario
        const resultadoPermisosRol = await Rol.getRolesPermsosPorRol(id);
		const resultadoPermisos = await Rol.getPermisos();
        
        res.json({ 
                status: true,
                permisosRol: resultadoPermisosRol,
				permisos: resultadoPermisos,
				rol: resuladoRol[0]
				});

    } catch (error) {
        res.status(500).json({ message: "Error interno del servidor" });
    }
}

