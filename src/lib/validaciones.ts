/**
 * Funciones de validación para turnos
 * 
 * Este módulo contiene funciones auxiliares para validar datos de turnos.
 * Estas validaciones ayudan a prevenir errores y mejoran la experiencia del usuario.
 */

/**
 * Valida que una fecha esté en formato YYYY-MM-DD
 * @param fecha Fecha a validar
 * @returns true si el formato es válido
 */
export function validarFormatoFecha(fecha: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(fecha)) {
    return false;
  }

  // Verificamos que sea una fecha válida
  const date = new Date(fecha);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Valida que una hora esté en formato HH:MM (24 horas)
 * @param hora Hora a validar
 * @returns true si el formato es válido
 */
export function validarFormatoHora(hora: string): boolean {
  const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return regex.test(hora);
}

/**
 * Valida que una fecha sea futura (no en el pasado)
 * @param fecha Fecha a validar (formato YYYY-MM-DD)
 * @returns true si la fecha es hoy o en el futuro
 */
export function validarFechaFutura(fecha: string): boolean {
  const fechaTurno = new Date(fecha);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0); // Reseteamos la hora para comparar solo fechas
  fechaTurno.setHours(0, 0, 0, 0);

  return fechaTurno >= hoy;
}

/**
 * Valida que una hora esté en horario laboral (ejemplo: 9:00 a 18:00)
 * @param hora Hora a validar (formato HH:MM)
 * @param horaInicio Hora de inicio del horario laboral (default: 09:00)
 * @param horaFin Hora de fin del horario laboral (default: 18:00)
 * @returns true si la hora está en el horario laboral
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

  return minutosTurno >= minutosInicio && minutosTurno <= minutosFin;
}

/**
 * Valida que una fecha y hora combinadas no estén en el pasado
 * @param fecha Fecha (formato YYYY-MM-DD)
 * @param hora Hora (formato HH:MM)
 * @returns true si la fecha/hora es futura
 */
export function validarFechaHoraFutura(fecha: string, hora: string): boolean {
  const fechaHoraTurno = new Date(`${fecha}T${hora}`);
  const ahora = new Date();

  return fechaHoraTurno > ahora;
}

