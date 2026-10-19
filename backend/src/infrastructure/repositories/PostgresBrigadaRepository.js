import { BrigadaRepositoryPort } from '../../domain/ports/BrigadaRepositoryPort.js';
import PostgresConnection from '../database/PostgresConnection.js';

export class PostgresBrigadaRepository extends BrigadaRepositoryPort {
  constructor() {
    super();
    this.db = PostgresConnection.getInstance();
  }

  async listar() {
    const { rows } = await this.db.query(
      `SELECT id, nombre, responsable, estado,
              ST_Y(ubicacion_actual::geometry) AS lat,
              ST_X(ubicacion_actual::geometry) AS lng
       FROM brigadas ORDER BY id`
    );
    return rows;
  }

  async actualizarUbicacion(id, lat, lng) {
    const { rows } = await this.db.query(
      `UPDATE brigadas
       SET ubicacion_actual = ST_SetSRID(ST_MakePoint($3, $2), 4326)::geography
       WHERE id = $1
       RETURNING id, nombre`,
      [id, lat, lng]
    );
    return rows[0] || null;
  }

  // Usa PostGIS: distancia geográfica en metros desde la brigada a cada localidad.
  async localidadMasCercana(id) {
    const { rows } = await this.db.query(
      `SELECT l.id, l.nombre,
              ROUND(ST_Distance(l.ubicacion, b.ubicacion_actual)::numeric) AS distancia_m
       FROM brigadas b, localidades l
       WHERE b.id = $1 AND b.ubicacion_actual IS NOT NULL
       ORDER BY ST_Distance(l.ubicacion, b.ubicacion_actual)
       LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }
}
