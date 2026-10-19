export class ListarBrigadas {
  constructor(brigadaRepository) {
    this.brigadaRepository = brigadaRepository;
  }
  async ejecutar() {
    return this.brigadaRepository.listar();
  }
}
