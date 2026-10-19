export class ListarVisitas {
  constructor(visitaRepository) { this.visitaRepository = visitaRepository; }
  async ejecutar() { return this.visitaRepository.listar(); }
}
