// Puerto de salida: contrato de mensajería. No depende de Telegram ni de ningún proveedor.
export class MensajeriaPort {
  async enviar(destinatario, texto) {
    throw new Error('No implementado');
  }
}
