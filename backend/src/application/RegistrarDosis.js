import { ErrorValidacion } from '../domain/errors.js';

export class RegistrarDosis {
  constructor(visitaRepository, mensajeria, adminChatId, umbralStock = 50) {
    this.visitaRepository = visitaRepository;
    this.mensajeria = mensajeria;
    this.adminChatId = adminChatId;
    this.umbralStock = umbralStock;
  }

  async ejecutar(visitaId, dosis) {
    if (!Number.isInteger(dosis) || dosis <= 0) {
      throw new ErrorValidacion('dosis debe ser un entero mayor que 0');
    }
    const r = await this.visitaRepository.registrarDosis(visitaId, dosis);
    if (r.biologico && r.biologico.stock <= this.umbralStock) {
      this.mensajeria
        .enviar(this.adminChatId, `⚠️ Stock bajo de ${r.biologico.nombre}: quedan ${r.biologico.stock} dosis.`)
        .catch((e) => console.error('No se pudo notificar:', e.message));
    }
    return r;
  }
}
