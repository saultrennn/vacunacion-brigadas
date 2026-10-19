import PostgresConnection from './infrastructure/database/PostgresConnection.js';
import { PostgresLocalidadRepository } from './infrastructure/repositories/PostgresLocalidadRepository.js';

const a = PostgresConnection.getInstance();
const b = PostgresConnection.getInstance();
console.log('¿Misma instancia?', a === b);

try {
  new PostgresConnection();
} catch (e) {
  console.log('new directo bloqueado:', e.message);
}

const { rows } = await a.query('SELECT PostGIS_Version() AS postgis');
console.log('PostGIS:', rows[0].postgis);

const repo = new PostgresLocalidadRepository();
console.table(await repo.listar());

await a.close();
