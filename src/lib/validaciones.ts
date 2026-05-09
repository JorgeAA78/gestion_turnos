/**
 * Funciones de validación para turnos
 * 
 * Este módulo contiene funciones auxiliares para validar datos de turnos.
 * Estas validaciones ayudan a prevenir errores y mejoran la experiencia del usuario.
 */

// Feriados Nacionales de Argentina para 2026 (Inamovibles y trasladables estimados)
// Fuente: https://www.argentina.gob.ar/jefatura/feriados-nacionales-2026
const FERIADOS_ARGENTINA_2026 = [
  "2026-01-01", // Año Nuevo
  "2026-02-16", // Carnaval (estimado)
  "2026-02-17", // Carnaval (estimado)
  "2026-03-24", // Día Nacional de la Memoria por la Verdad y la Justicia
  "2026-04-02", // Día del Veterano y de los Caídos en la Guerra de Malvinas / Jueves Santo
  "2026-04-03", // Viernes Santo
  "2026-05-01", // Día del Trabajador
  "2026-05-25", // Día de la Revolución de Mayo
  "2026-06-15", // Paso a la Inmortalidad del Gral. Don Martín Miguel de Güemes (trasladable)
  "2026-06-20", // Paso a la Inmortalidad del Gral. Manuel Belgrano
  "2026-07-09", // Día de la Independencia
  "2026-08-17", // Paso a la Inmortalidad del Gral. José de San Martín
  "2026-10-12", // Día del Respeto a la Diversidad Cultural
  "2026-11-23", // Día de la Soberanía Nacional (trasladable, cae lunes)
  "2026-12-08", // Inmaculada Concepción de María
  "2026-12-25", // Navidad
];

/**
 * Valida que una fecha esté en formato YYYY-MM-DD
 */
export function validarFormatoFecha(fecha: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(fecha)) return false;

  const date = new Date(fecha);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Valida que una hora esté en formato HH:MM (24 horas)
 */
export function validarFormatoHora(hora: string): boolean {
  const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return regex.test(hora);
}

/**
 * Valida que una fecha sea futura (no en el pasado)
 */
export function validarFechaFutura(fecha: string): boolean {
  const fechaTurno = new Date(fecha);
  // Ajustamos para la zona horaria local asumiendo que la fecha de entrada es local (UTC-3)
  fechaTurno.setHours(fechaTurno.getHours() + 3); 
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  fechaTurno.setHours(0, 0, 0, 0);

  return fechaTurno >= hoy;
}

/**
 * Valida que un día sea laborable (Lunes a Viernes, no feriado)
 */
export function validarDiaLaboral(fecha: string): { valido: boolean; motivo?: string } {
  const date = new Date(fecha);
  date.setHours(date.getHours() + 3); // Ajuste timezone para no caer en día anterior
  
  const diaSemana = date.getDay(); // 0 es Domingo, 6 es Sábado

  if (diaSemana === 0 || diaSemana === 6) {
    return { valido: false, motivo: "El profesional no atiende los fines de semana." };
  }

  if (FERIADOS_ARGENTINA_2026.includes(fecha)) {
    return { valido: false, motivo: "La fecha seleccionada es un feriado nacional." };
  }

  return { valido: true };
}

/**
 * Valida que una hora esté en horario laboral estricto (09:00 a 18:00)
 */
export function validarHorarioLaboral(
  hora: string,
  horaInicio: string = "09:00",
  horaFin: string = "18:00"
): boolean {
  const [horaTurno, minutoTurno] = hora.split(":").map(Number);
  const [horaInicioNum, minutoInicioNum] = horaInicio.split(":").map(Number);
  const [horaFinNum, minutoFinNum] = horaFin.split(":").map(Number);

  const minutosTurno = horaTurno * 60 + minutoTurno;
  const minutosInicio = horaInicioNum * 60 + minutoInicioNum;
  const minutosFin = horaFinNum * 60 + minutoFinNum;

  // El último turno posible no debe exceder las 18:00 (asumiendo turnos de x duración, pero bloqueamos si es estrictamente > 18:00 o < 09:00)
  return minutosTurno >= minutosInicio && minutosTurno <= minutosFin;
}

/**
 * Valida que una fecha y hora combinadas no estén en el pasado
 */
export function validarFechaHoraFutura(fecha: string, hora: string): boolean {
  const fechaHoraTurno = new Date(`${fecha}T${hora}:00-03:00`); // Asumiendo zona horaria de Argentina
  const ahora = new Date();

  return fechaHoraTurno > ahora;
}

