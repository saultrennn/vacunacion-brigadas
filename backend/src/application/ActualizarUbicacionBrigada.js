import { ErrorValidacion } from '../domain/errors.js';

export class ActualizarUbicacionBrigada {
  constructor(brigadaRepository) {
    this.brigadaRepository = brigadaRepository;
  }

  async ejecutar(id, lat, lng) {
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) throw new ErrorValidacion('Latitud inválida');
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) throw new ErrorValidacion('Longitud inválida');
    const brigada = await this.brigadaRepository.actualizarUbicacion(id, lat, lng);
    if (!brigada) return null;
    const cercana = await this.brigadaRepository.localidadMasCercana(id);
    return { brigada, localidad_mas_cercana: cercana };
  }
}
