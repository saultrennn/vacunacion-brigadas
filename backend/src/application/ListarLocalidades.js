export class ListarLocalidades {
  constructor(localidadRepository) {
    this.localidadRepository = localidadRepository;
  }

  async ejecutar() {
    return this.localidadRepository.listar();
  }
}
