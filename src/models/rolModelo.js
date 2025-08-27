const db = require('../../config/conexion');

const Rol = {
    
    getRoles: () => {
        return new Promise((resolve, reject) => {
            db.query(
                'SELECT cod_rol, nombre FROM rol where estado = 1',
                (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                }
            );
        });
    },
    getRolPorCodRol: (cod_rol) => {
        return new Promise((resolve, reject) => {
            db.query(
                'SELECT * FROM rol where cod_rol = ?',
                [
                    cod_rol
                ],
                (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                }
            );
        });
    },
    getRolPorNombreRol: (nombre) => {
        return new Promise((resolve, reject) => {
            db.query(
                'SELECT * FROM rol where nombre = ?',
                [
                    nombre
                ],
                (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                }
            );
        });
    },
    
    guardarRoles: (nombreRol) => {
        return new Promise((resolve, reject) => {
            db.query(
                `INSERT INTO rol 
                (nombre) 
                VALUES (?)`,
                [
                    nombreRol
                ],
                (err, results) => {
                    if (err) reject(err);
                    else resolve(results.insertId); // devolvemos el id generado
                }
            );
        });
    },
    
    actualizarRoles: (cod_rol, nombre) => {
        return new Promise((resolve, reject) => {
            db.query(
                `UPDATE rol 
                 SET nombre = ?
                 WHERE cod_rol = ?`,
                [
                    nombre,
                    cod_rol
                ],
                (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                }
            );
        });
    },
    actualizarEstado: (cod_rol, estado) => {
        return new Promise((resolve, reject) => {
            db.query(
                `UPDATE rol 
                 SET estado = ?
                 WHERE cod_rol = ?`,
                [
                    estado,
                    cod_rol
                ],
                (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                }
            );
        });
    },
    listarRoles: ({ page = 1, itemsPerPage = 10, q = '', sortBy = 'cod_rol', orderBy = 'desc' }) => {
        return new Promise((resolve, reject) => {
            // Campos válidos para ordenar
            const camposPermitidos = ['cod_rol', 'nombre', 'estado', 'created_at', 'updated_at'];
            if (!camposPermitidos.includes(sortBy)) sortBy = 'cod_rol';
            if (!['asc', 'desc'].includes(orderBy.toLowerCase())) orderBy = 'desc';

            const offset = (page - 1) * itemsPerPage;

            let sql = `
                SELECT 
                    cod_rol,
                    nombre,
                    estado,
                    created_at,
                    updated_at
                FROM rol
            `;
            const params = [];

            // Filtro de búsqueda
            if (q.trim() !== '') {
                sql += ` WHERE nombre LIKE ?`;
                const busqueda = `%${q}%`;
                params.push(busqueda);
            }

            sql += ` ORDER BY ${sortBy} ${orderBy} LIMIT ? OFFSET ?`;
            params.push(parseInt(itemsPerPage), parseInt(offset));

            db.query(sql, params, (err, results) => {
                if (err) return reject(err);

                // Consulta para contar total de registros
                let countSql = `SELECT COUNT(*) as total FROM rol`;
                const countParams = [];
                if (q.trim() !== '') {
                    countSql += ` WHERE nombre LIKE ?`;
                    const busqueda = `%${q}%`;
                    countParams.push(busqueda);
                }

                db.query(countSql, countParams, (err2, countResult) => {
                    if (err2) return reject(err2);
                    const total = countResult[0].total;
                    resolve({
                        roles: results,
                        total,
                        page,
                        itemsPerPage,
                        totalPages: Math.ceil(total / itemsPerPage),
                        last_page: Math.ceil(total / itemsPerPage) // para el frontend
                    });
                });
            });
        });
    },
    getPermisos: () => {
        return new Promise((resolve, reject) => {
            db.query(
                'SELECT * FROM permisos',
                (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                }
            );
        });
    },
    getRolesPermsosPorRol: (cod_rol) => {
        return new Promise((resolve, reject) => {
            db.query(
                'SELECT * FROM roles_permisos where cod_rol = ?',
                [
                    cod_rol
                ],
                (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                }
            );
        });
    },
    guardarRolesPermisos: (cod_rol, cod_permiso) => {
        return new Promise((resolve, reject) => {
            db.query(
                'INSERT INTO roles_permisos (cod_rol, cod_permiso) VALUES (?, ?)',
                [
                    cod_rol,
                    cod_permiso
                ],
                (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                }
            );
        });
    },
    eliminarRolesPermisos: (cod_rol) => {
        return new Promise((resolve, reject) => {
            db.query(
                'DELETE FROM roles_permisos WHERE cod_rol = ?',
                [
                    cod_rol
                ],
                (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                }
            );
        });
    },
};

module.exports = Rol; 
