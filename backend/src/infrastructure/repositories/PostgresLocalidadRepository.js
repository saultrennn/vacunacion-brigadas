import { LocalidadRepositoryPort } from '../../domain/ports/LocalidadRepositoryPort.js';
import PostgresConnection from '../database/PostgresConnection.js';

export class PostgresLocalidadRepository extends LocalidadRepositoryPort {
  constructor() {
    super();
    this.db = PostgresConnection.getInstance();
  }

  async listar() {
    const { rows } = await this.db.query(
      `SELECT id, nombre, poblacion,
              ST_Y(ubicacion::geometry) AS lat,
              ST_X(ubicacion::geometry) AS lng
       FROM localidades ORDER BY id`
    );
    return rows;
  }
}
