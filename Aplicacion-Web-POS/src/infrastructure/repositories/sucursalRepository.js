const { ejecutarQuery } = require('../db/postgresClient');

async function listarSucursalesVigentes() {
    const res = await ejecutarQuery(
        `SELECT id, nombre, direccion, telefono, activa, updated_at
         FROM "config_sucursal"
         WHERE deleted_at IS NULL
         ORDER BY nombre ASC`
    );
    return res.rows;
}

module.exports = {
    listarSucursalesVigentes
};

