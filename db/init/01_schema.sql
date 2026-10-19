CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE localidades (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  municipio VARCHAR(120) NOT NULL DEFAULT 'Tuxtla Gutiérrez',
  poblacion INTEGER,
  ubicacion GEOGRAPHY(POINT, 4326) NOT NULL
);

CREATE TABLE biologicos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  lote VARCHAR(60),
  caducidad DATE,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0)
);

CREATE TABLE brigadas (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  responsable VARCHAR(120),
  telegram_chat_id BIGINT,
  estado VARCHAR(20) NOT NULL DEFAULT 'activa',
  ubicacion_actual GEOGRAPHY(POINT, 4326)
);

CREATE TABLE campanas (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  biologico_id INTEGER REFERENCES biologicos(id),
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  meta_dosis INTEGER
);

CREATE TABLE visitas (
  id SERIAL PRIMARY KEY,
  campana_id INTEGER REFERENCES campanas(id),
  brigada_id INTEGER NOT NULL REFERENCES brigadas(id),
  localidad_id INTEGER NOT NULL REFERENCES localidades(id),
  fecha DATE NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'programada',
  dosis_aplicadas INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_localidades_ubicacion ON localidades USING GIST (ubicacion);
CREATE INDEX idx_brigadas_ubicacion ON brigadas USING GIST (ubicacion_actual);

INSERT INTO localidades (nombre, poblacion, ubicacion) VALUES
  ('Terán', 3000, ST_SetSRID(ST_MakePoint(-93.1000, 16.7700), 4326)),
  ('Copoya', 2500, ST_SetSRID(ST_MakePoint(-93.1100, 16.6900), 4326)),
  ('Chiapa de Corzo', 45000, ST_SetSRID(ST_MakePoint(-92.9900, 16.7050), 4326));

INSERT INTO biologicos (nombre, lote, caducidad, stock) VALUES
  ('Influenza estacional', 'INF-2026-01', '2027-03-31', 500),
  ('Sarampión SRP', 'SRP-2026-04', '2027-06-30', 300);

INSERT INTO brigadas (nombre, responsable) VALUES
  ('Brigada 1', 'Responsable pendiente'),
  ('Brigada 2', 'Responsable pendiente');
