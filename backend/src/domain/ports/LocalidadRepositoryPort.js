// Puerto de salida: el dominio solo conoce este contrato, no PostgreSQL.
export class LocalidadRepositoryPort {
  async listar() {
    throw new Error('No implementado');
  }
}
