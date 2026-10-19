import express from 'express';
import cors from 'cors';
import PostgresConnection from '../database/PostgresConnection.js';
import { ErrorDominio, NoEncontrado } from '../../domain/errors.js';
import { PostgresLocalidadRepository } from '../repositories/PostgresLocalidadRepository.js';
import { PostgresBrigadaRepository } from '../repositories/PostgresBrigadaRepository.js';
import { PostgresVisitaRepository } from '../repositories/PostgresVisitaRepository.js';
import { TelegramAdapter } from '../messaging/TelegramAdapter.js';
import { ListarLocalidades } from '../../application/ListarLocalidades.js';
import { ListarBrigadas } from '../../application/ListarBrigadas.js';
import { ActualizarUbicacionBrigada } from '../../application/ActualizarUbicacionBrigada.js';
import { NotificarUbicacionBrigada } from '../../application/NotificarUbicacionBrigada.js';
import { CrearVisita } from '../../application/CrearVisita.js';
import { ListarVisitas } from '../../application/ListarVisitas.js';
import { RegistrarDosis } from '../../application/RegistrarDosis.js';
import { ObtenerCobertura } from '../../application/ObtenerCobertura.js';

// ---- Composición: aquí se conectan casos de uso y adaptadores ----
const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
const mensajeria = new TelegramAdapter();
const localidadRepo = new PostgresLocalidadRepository();
const brigadaRepo = new PostgresBrigadaRepository();
const visitaRepo = new PostgresVisitaRepository();

const listarLocalidades = new ListarLocalidades(localidadRepo);
const listarBrigadas = new ListarBrigadas(brigadaRepo);
const actualizarUbicacion = new ActualizarUbicacionBrigada(brigadaRepo);
const notificarUbicacion = new NotificarUbicacionBrigada(mensajeria, adminChatId);
const crearVisita = new CrearVisita(visitaRepo, mensajeria, adminChatId);
const listarVisitas = new ListarVisitas(visitaRepo);
const registrarDosis = new RegistrarDosis(visitaRepo, mensajeria, adminChatId);
const obtenerCobertura = new ObtenerCobertura(visitaRepo);

// ---- HTTP ----
const app = express();
app.use(cors());
app.use(express.json());

const ah = (fn) => (req, res, next) => fn(req, res).catch(next);

app.get('/api/health', ah(async (req, res) => {
  await PostgresConnection.getInstance().query('SELECT 1');
  res.json({ ok: true, db: 'conectada' });
}));

app.get('/api/localidades', ah(async (req, res) => res.json(await listarLocalidades.ejecutar())));
app.get('/api/brigadas', ah(async (req, res) => res.json(await listarBrigadas.ejecutar())));

app.put('/api/brigadas/:id/ubicacion', ah(async (req, res) => {
  const { lat, lng } = req.body;
  const r = await actualizarUbicacion.ejecutar(Number(req.params.id), Number(lat), Number(lng));
  if (!r) throw new NoEncontrado('Brigada no encontrada');
  notificarUbicacion.ejecutar(r).catch((e) => console.error('No se pudo notificar:', e.message));
  res.json(r);
}));

app.get('/api/visitas', ah(async (req, res) => res.json(await listarVisitas.ejecutar())));

app.post('/api/visitas', ah(async (req, res) => {
  const { campana_id, brigada_id, localidad_id, fecha } = req.body;
  const v = await crearVisita.ejecutar({
    campana_id: Number(campana_id),
    brigada_id: Number(brigada_id),
    localidad_id: Number(localidad_id),
    fecha,
  });
  res.status(201).json(v);
}));

app.post('/api/visitas/:id/dosis', ah(async (req, res) => {
  res.json(await registrarDosis.ejecutar(Number(req.params.id), Number(req.body.dosis)));
}));

app.get('/api/cobertura', ah(async (req, res) => res.json(await obtenerCobertura.ejecutar())));

// ---- Manejo de errores centralizado ----
app.use((err, req, res, next) => {
  if (err instanceof ErrorDominio) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = Number(process.env.PORT) || 3000;
const server = app.listen(PORT, () => console.log(`API escuchando en http://localhost:${PORT}`));

// Cierre ordenado: libera el pool del Singleton
process.on('SIGINT', async () => {
  server.close();
  await PostgresConnection.getInstance().close();
  process.exit(0);
});
