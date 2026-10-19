export class NotificarUbicacionBrigada {
  constructor(mensajeria, adminChatId) {
    this.mensajeria = mensajeria;
    this.adminChatId = adminChatId;
  }

  async ejecutar(resultado) {
    const { brigada, localidad_mas_cercana: loc } = resultado;
    const texto = loc
      ? `📍 ${brigada.nombre} actualizó su ubicación.\nLocalidad más cercana: ${loc.nombre} (${loc.distancia_m} m).`
      : `📍 ${brigada.nombre} actualizó su ubicación.`;
    await this.mensajeria.enviar(this.adminChatId, texto);
  }
}
