import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

const API = 'http://localhost:3000/api';
const CENTRO = [16.73, -93.05];
const REFRESCO_MS = 10000;

function colorEstado(estado = '') {
  const e = String(estado).toLowerCase();
  if (/(inactiv|fuera|termin|cerrad)/.test(e)) return '#6b7280';
  if (/(activ|ruta|camino|campo|servicio)/.test(e)) return '#16a34a';
  if (/(pausa|espera|descanso|dispon)/.test(e)) return '#f59e0b';
  return '#2563eb';
}

const cacheIconos = {};
function iconoBrigada(color) {
  if (!cacheIconos[color]) {
    cacheIconos[color] = L.divIcon({
      className: 'pin-brigada',
      html: `<span style="background:${color}"></span>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14],
    });
  }
  return cacheIconos[color];
}

function radioLocalidad(poblacion) {
  const p = Number(poblacion) || 0;
  return Math.min(22, Math.max(8, 6 + Math.sqrt(p) / 8));
}

function formatoNumero(n) {
  const v = Number(n);
  return Number.isFinite(v) ? v.toLocaleString('es-MX') : String(n ?? '—');
}

function EnfocarSeleccion({ seleccion, refs }) {
  const map = useMap();
  useEffect(() => {
    if (!seleccion) return undefined;
    map.flyTo(seleccion.posicion, Math.max(map.getZoom(), 14), { duration: 0.8 });
    const t = setTimeout(() => refs.current[seleccion.clave]?.openPopup(), 900);
    return () => clearTimeout(t);
  }, [seleccion, map, refs]);
  return null;
}

export default function App() {
  const [localidades, setLocalidades] = useState([]);
  const [brigadas, setBrigadas] = useState([]);
  const [error, setError] = useState('');
  const [actualizado, setActualizado] = useState(null);
  const [pestana, setPestana] = useState('brigadas');
  const [busqueda, setBusqueda] = useState('');
  const [mostrarBrigadas, setMostrarBrigadas] = useState(true);
  const [mostrarLocalidades, setMostrarLocalidades] = useState(true);
  const [seleccion, setSeleccion] = useState(null);
  const refs = useRef({});

  const cargarBrigadas = useCallback(async () => {
    const r = await fetch(`${API}/brigadas`);
    if (!r.ok) throw new Error(`Brigadas: HTTP ${r.status}`);
    setBrigadas(await r.json());
    setActualizado(new Date());
  }, []);

  const cargarTodo = useCallback(async () => {
    try {
      const r = await fetch(`${API}/localidades`);
      if (!r.ok) throw new Error(`Localidades: HTTP ${r.status}`);
      setLocalidades(await r.json());
      await cargarBrigadas();
      setError('');
    } catch (e) {
      setError(e.message || 'No se pudo conectar con la API');
    }
  }, [cargarBrigadas]);

  useEffect(() => {
    cargarTodo();
    const id = setInterval(() => {
      cargarBrigadas()
        .then(() => setError(''))
        .catch((e) => setError(e.message || 'No se pudo conectar con la API'));
    }, REFRESCO_MS);
    return () => clearInterval(id);
  }, [cargarTodo, cargarBrigadas]);

  const q = busqueda.trim().toLowerCase();

  const brigadasFiltradas = useMemo(
    () => brigadas.filter((b) => String(b.nombre ?? '').toLowerCase().includes(q)),
    [brigadas, q],
  );
  const localidadesFiltradas = useMemo(
    () => localidades.filter((l) => String(l.nombre ?? '').toLowerCase().includes(q)),
    [localidades, q],
  );

  const brigadasEnMapa = brigadas.filter((b) => b.lat != null && b.lng != null).length;

  function seleccionar(clave, lat, lng) {
    setSeleccion({ clave, posicion: [Number(lat), Number(lng)] });
  }

  return (
    <div className="app">
      <aside className="panel">
        <div className="panel-cab">
          <h1>Brigadas de vacunación</h1>
          <p className="sub">
            {brigadasEnMapa} de {brigadas.length} brigadas con ubicación · {localidades.length} localidades
          </p>
          <p className="sub">
            {actualizado ? `Actualizado a las ${actualizado.toLocaleTimeString('es-MX')}` : 'Cargando datos…'}
          </p>
          <button type="button" className="btn" onClick={cargarTodo}>
            Actualizar ahora
          </button>
        </div>

        {error && (
          <div className="error">
            ⚠ {error}. ¿Está corriendo la API en el puerto 3000?
          </div>
        )}

        <div className="capas">
          <label>
            <input type="checkbox" checked={mostrarBrigadas} onChange={(e) => setMostrarBrigadas(e.target.checked)} />
            Brigadas
          </label>
          <label>
            <input
              type="checkbox"
              checked={mostrarLocalidades}
              onChange={(e) => setMostrarLocalidades(e.target.checked)}
            />
            Localidades
          </label>
        </div>

        <div className="tabs">
          <button
            type="button"
            className={`tab ${pestana === 'brigadas' ? 'activa' : ''}`}
            onClick={() => setPestana('brigadas')}
          >
            Brigadas ({brigadas.length})
          </button>
          <button
            type="button"
            className={`tab ${pestana === 'localidades' ? 'activa' : ''}`}
            onClick={() => setPestana('localidades')}
          >
            Localidades ({localidades.length})
          </button>
        </div>

        <input
          className="buscador"
          type="search"
          placeholder={`Buscar ${pestana}…`}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <ul className="lista">
          {pestana === 'brigadas' &&
            brigadasFiltradas.map((b) => {
              const clave = `b${b.id}`;
              const tieneUbicacion = b.lat != null && b.lng != null;
              return (
                <li key={clave}>
                  <button
                    type="button"
                    className={`item ${seleccion?.clave === clave ? 'seleccionado' : ''}`}
                    disabled={!tieneUbicacion}
                    onClick={() => seleccionar(clave, b.lat, b.lng)}
                  >
                    <div className="item-titulo">
                      <span>{b.nombre}</span>
                      <span className="badge" style={{ background: colorEstado(b.estado) }}>
                        {b.estado ?? 'sin estado'}
                      </span>
                    </div>
                    <div className="item-detalle">{tieneUbicacion ? 'Clic para ver en el mapa' : 'Sin ubicación registrada'}</div>
                  </button>
                </li>
              );
            })}

          {pestana === 'localidades' &&
            localidadesFiltradas.map((l) => {
              const clave = `l${l.id}`;
              return (
                <li key={clave}>
                  <button
                    type="button"
                    className={`item ${seleccion?.clave === clave ? 'seleccionado' : ''}`}
                    onClick={() => seleccionar(clave, l.lat, l.lng)}
                  >
                    <div className="item-titulo">
                      <span>{l.nombre}</span>
                    </div>
                    <div className="item-detalle">Población: {formatoNumero(l.poblacion)}</div>
                  </button>
                </li>
              );
            })}

          {pestana === 'brigadas' && brigadasFiltradas.length === 0 && (
            <li className="vacio">No hay brigadas que mostrar.</li>
          )}
          {pestana === 'localidades' && localidadesFiltradas.length === 0 && (
            <li className="vacio">No hay localidades que mostrar.</li>
          )}
        </ul>
      </aside>

      <MapContainer center={CENTRO} zoom={11} zoomControl={false} className="mapa">
        <ZoomControl position="topright" />
        <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <EnfocarSeleccion seleccion={seleccion} refs={refs} />

        {mostrarLocalidades &&
          localidades.map((l) => (
            <CircleMarker
              key={`l${l.id}`}
              ref={(m) => {
                refs.current[`l${l.id}`] = m;
              }}
              center={[l.lat, l.lng]}
              radius={radioLocalidad(l.poblacion)}
              pathOptions={{ color: '#15803d', fillColor: '#22c55e', fillOpacity: 0.45 }}
              eventHandlers={{ click: () => setSeleccion({ clave: `l${l.id}`, posicion: [l.lat, l.lng] }) }}
            >
              <Popup>
                <b className="popup-titulo">{l.nombre}</b>
                Población: {formatoNumero(l.poblacion)}
              </Popup>
            </CircleMarker>
          ))}

        {mostrarBrigadas &&
          brigadas
            .filter((b) => b.lat != null && b.lng != null)
            .map((b) => (
              <Marker
                key={`b${b.id}`}
                ref={(m) => {
                  refs.current[`b${b.id}`] = m;
                }}
                position={[b.lat, b.lng]}
                icon={iconoBrigada(colorEstado(b.estado))}
              >
                <Popup>
                  <b className="popup-titulo">{b.nombre}</b>
                  Estado: {b.estado ?? 'sin estado'}
                </Popup>
              </Marker>
            ))}
      </MapContainer>
    </div>
  );
}
