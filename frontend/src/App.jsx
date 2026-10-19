import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const iconoBrigada = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const API = 'http://localhost:3000/api';

export default function App() {
  const [localidades, setLocalidades] = useState([]);
  const [brigadas, setBrigadas] = useState([]);

  useEffect(() => {
    fetch(`${API}/localidades`).then((r) => r.json()).then(setLocalidades);
    fetch(`${API}/brigadas`).then((r) => r.json()).then(setBrigadas);
  }, []);

  return (
    <MapContainer center={[16.73, -93.05]} zoom={11} style={{ height: '100vh', width: '100vw' }}>
      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {localidades.map((l) => (
        <CircleMarker key={`l${l.id}`} center={[l.lat, l.lng]} radius={10} pathOptions={{ color: 'green' }}>
          <Popup>
            <b>{l.nombre}</b><br />Población: {l.poblacion}
          </Popup>
        </CircleMarker>
      ))}
      {brigadas.filter((b) => b.lat != null).map((b) => (
        <Marker key={`b${b.id}`} position={[b.lat, b.lng]} icon={iconoBrigada}>
          <Popup>
            <b>{b.nombre}</b><br />Estado: {b.estado}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
