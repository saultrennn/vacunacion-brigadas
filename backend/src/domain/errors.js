export class ErrorDominio extends Error {
  constructor(mensaje, status = 400) {
    super(mensaje);
    this.status = status;
  }
}
export class ErrorValidacion extends ErrorDominio {
  constructor(mensaje) { super(mensaje, 400); }
}
export class NoEncontrado extends ErrorDominio {
  constructor(mensaje) { super(mensaje, 404); }
}
export class Conflicto extends ErrorDominio {
  constructor(mensaje) { super(mensaje, 409); }
}
