export class ObtenerCobertura {
  constructor(visitaRepository) { this.visitaRepository = visitaRepository; }
  async ejecutar() { return this.visitaRepository.cobertura(); }
}
