import { ErrorValidacion } from '../domain/errors.js';

export class CrearVisita {
  constructor(visitaRepository, mensajeria, adminChatId) {
    this.visitaRepository = visitaRepository;
    this.mensajeria = mensajeria;
    this.adminChatId = adminChatId;
  }

  async ejecutar({ campana_id, brigada_id, localidad_id, fecha }) {
    for (const [k, v] of Object.entries({ campana_id, brigada_id, localidad_id })) {
      if (!Number.isInteger(v) || v <= 0) throw new ErrorValidacion(`${k} inválido`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha || '') || Number.isNaN(Date.parse(fecha))) {
      throw new ErrorValidacion('fecha inválida, usa AAAA-MM-DD');
    }
    const visita = await this.visitaRepository.crear({ campana_id, brigada_id, localidad_id, fecha });
    this.mensajeria
      .enviar(this.adminChatId, `🗓️ Visita #${visita.id} programada para el ${fecha}.`)
      .catch((e) => console.error('No se pudo notificar:', e.message));
    return visita;
  }
}
