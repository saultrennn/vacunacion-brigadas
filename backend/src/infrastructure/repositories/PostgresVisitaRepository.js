import { VisitaRepositoryPort } from '../../domain/ports/VisitaRepositoryPort.js';
import { NoEncontrado, Conflicto } from '../../domain/errors.js';
import PostgresConnection from '../database/PostgresConnection.js';

export class PostgresVisitaRepository extends VisitaRepositoryPort {
  constructor() {
    super();
    this.db = PostgresConnection.getInstance();
  }

  async crear({ campana_id, brigada_id, localidad_id, fecha }) {
    try {
      const { rows } = await this.db.query(
        `INSERT INTO visitas (campana_id, brigada_id, localidad_id, fecha)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [campana_id, brigada_id, localidad_id, fecha]
      );
      return rows[0];
    } catch (err) {
      if (err.code === '23503') throw new NoEncontrado('Campaña, brigada o localidad inexistente');
      throw err;
    }
  }

  async listar() {
    const { rows } = await this.db.query(
      `SELECT v.id, v.fecha, v.estado, v.dosis_aplicadas,
              b.nombre AS brigada, l.nombre AS localidad, c.nombre AS campana
       FROM visitas v
       JOIN brigadas b ON b.id = v.brigada_id
       JOIN localidades l ON l.id = v.localidad_id
       LEFT JOIN campanas c ON c.id = v.campana_id
       ORDER BY v.fecha DESC, v.id DESC`
    );
    return rows;
  }

  // Transacción: o se guarda todo (stock + visita) o no se guarda nada.
  async registrarDosis(visitaId, dosis) {
    return this.db.transaction(async (client) => {
      const v = await client.query(
        `SELECT v.id, c.biologico_id
         FROM visitas v LEFT JOIN campanas c ON c.id = v.campana_id
         WHERE v.id = $1 FOR UPDATE OF v`,
        [visitaId]
      );
      if (v.rowCount === 0) throw new NoEncontrado('Visita no encontrada');

      let biologico = null;
      const biologicoId = v.rows[0].biologico_id;
      if (biologicoId) {
        const b = await client.query(
          `UPDATE biologicos SET stock = stock - $1
           WHERE id = $2 AND stock >= $1
           RETURNING nombre, stock`,
          [dosis, biologicoId]
        );
        if (b.rowCount === 0) throw new Conflicto('Stock insuficiente del biológico');
        biologico = b.rows[0];
      }

      const upd = await client.query(
        `UPDATE visitas
         SET dosis_aplicadas = dosis_aplicadas + $1, estado = 'en_curso'
         WHERE id = $2 RETURNING *`,
        [dosis, visitaId]
      );
      return { visita: upd.rows[0], biologico };
    });
  }

  async cobertura() {
    const { rows } = await this.db.query(
      `SELECT l.id, l.nombre, l.poblacion,
              COALESCE(SUM(v.dosis_aplicadas), 0)::int AS dosis_aplicadas,
              ROUND(100.0 * COALESCE(SUM(v.dosis_aplicadas), 0) / NULLIF(l.poblacion, 0), 1)::float AS porcentaje
       FROM localidades l
       LEFT JOIN visitas v ON v.localidad_id = l.id
       GROUP BY l.id ORDER BY l.id`
    );
    return rows;
  }
}
