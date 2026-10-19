import { MensajeriaPort } from '../../domain/ports/MensajeriaPort.js';
import '../database/PostgresConnection.js'; // asegura que el .env ya esté cargado

export class TelegramAdapter extends MensajeriaPort {
  constructor(token = process.env.TELEGRAM_BOT_TOKEN) {
    super();
    if (!token) throw new Error('Falta TELEGRAM_BOT_TOKEN en el .env');
    this.url = `https://api.telegram.org/bot${token}/sendMessage`;
  }

  async enviar(destinatario, texto) {
    const res = await fetch(this.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: destinatario, text: texto }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(`Telegram: ${data.description}`);
    return true;
  }
}
