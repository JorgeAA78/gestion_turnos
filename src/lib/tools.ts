/**
 * Definición de tools para el agente de turnos
 *
 * Este archivo define todas las herramientas (tools) que el agente puede usar
 * para interactuar con el sistema de turnos. Cada tool tiene:
 * - Un schema de validación usando zod
 * - Una función de ejecución que realiza la acción
 * - Una descripción para que el modelo entienda cuándo usarla
 */

import z from "zod";
import {
  verificarDisponibilidad,
  crearTurno,
  listarTurnos,
  cancelarTurno,
  reagendarTurno,
} from "./turnos";
import {
  validarFormatoFecha,
  validarFormatoHora,
  validarFechaFutura,
  validarHorarioLaboral,
  validarFechaHoraFutura,
  validarDiaLaboral,
} from "./validaciones";
import { enviarEmailConfirmacion, enviarEmailCancelacion, enviarEmailReagendamiento } from "./email";

/**
 * Tool para verificar disponibilidad en una fecha y hora específica
 */
export const toolVerificarDisponibilidad = {
  description:
    "Verifica si hay disponibilidad para reservar un turno en una fecha y hora específica en Cal.com. Usa esta tool cuando el usuario pregunte si hay turnos disponibles.",
  parameters: z.object({
    fecha: z
      .string()
      .describe("Fecha en formato YYYY-MM-DD (ejemplo: 2024-12-25)"),
    hora: z
      .string()
      .describe("Hora en formato HH:MM en formato 24 horas (ejemplo: 14:30)"),
  }),
  execute: async (args: { fecha: string; hora: string }) => {
    console.log("🔍 [TOOL] verificarDisponibilidad ejecutándose...");

    if (!validarFormatoFecha(args.fecha)) {
      return { disponible: false, mensaje: `La fecha "${args.fecha}" no tiene un formato válido (YYYY-MM-DD).` };
    }

    if (!validarFormatoHora(args.hora)) {
      return { disponible: false, mensaje: `La hora "${args.hora}" no tiene un formato válido (HH:MM).` };
    }

    if (!validarFechaFutura(args.fecha)) {
      return { disponible: false, mensaje: `La fecha ${args.fecha} está en el pasado.` };
    }

    const validacionDia = validarDiaLaboral(args.fecha);
    if (!validacionDia.valido) {
      return { disponible: false, mensaje: validacionDia.motivo };
    }

    if (!validarHorarioLaboral(args.hora)) {
      return { disponible: false, mensaje: `La hora ${args.hora} está fuera del horario de atención (09:00 a 18:00).` };
    }

    try {
      const disponible = await verificarDisponibilidad(args.fecha, args.hora);
      return {
        disponible,
        mensaje: disponible
          ? `Sí, hay disponibilidad el ${args.fecha} a las ${args.hora} en Cal.com`
          : `No, no hay disponibilidad el ${args.fecha} a las ${args.hora} en Cal.com. Ya hay un turno reservado o bloqueado.`,
      };
    } catch (error) {
      return { disponible: false, mensaje: `Error de Cal.com: ${error instanceof Error ? error.message : "Desconocido"}` };
    }
  },
};

/**
 * Tool para reservar un nuevo turno
 */
export const toolReservarTurno = {
  description:
    "Reserva un nuevo turno con los datos del cliente en Cal.com. Devuelve un ID numérico de 4 dígitos. Siempre verifica disponibilidad primero antes de reservar.",
  parameters: z.object({
    fecha: z.string().describe("Fecha en formato YYYY-MM-DD"),
    hora: z.string().describe("Hora en formato HH:MM"),
    nombre_cliente: z.string().describe("Nombre completo del cliente"),
    email: z.string().email().describe("Email del cliente"),
  }),
  execute: async (args: {
    fecha: string;
    hora: string;
    nombre_cliente: string;
    email: string;
  }) => {
    console.log("📝 [TOOL] reservarTurno ejecutándose...");

    if (!validarFormatoFecha(args.fecha)) return { exito: false, mensaje: "Formato de fecha inválido." };
    if (!validarFormatoHora(args.hora)) return { exito: false, mensaje: "Formato de hora inválido." };
    if (!validarFechaHoraFutura(args.fecha, args.hora)) return { exito: false, mensaje: "La fecha y hora ya pasaron." };

    const validacionDia = validarDiaLaboral(args.fecha);
    if (!validacionDia.valido) return { exito: false, mensaje: validacionDia.motivo };

    if (!validarHorarioLaboral(args.hora)) {
      return { exito: false, mensaje: "Fuera de horario laboral (09:00-18:00)." };
    }

    try {
      const disponible = await verificarDisponibilidad(args.fecha, args.hora);
      if (!disponible) {
        return { exito: false, mensaje: `No hay disponibilidad el ${args.fecha} a las ${args.hora}.` };
      }

      const turno = await crearTurno({
        fecha: args.fecha,
        hora: args.hora,
        nombre_cliente: args.nombre_cliente,
        email: args.email,
      });

      // Enviamos email (no bloqueante) local si se desea doble email
      enviarEmailConfirmacion({
        email: args.email,
        nombre: args.nombre_cliente,
        fecha: args.fecha,
        hora: args.hora,
        turnoId: turno.id,
      }).catch(console.error);

      return {
        exito: true,
        mensaje: `¡Turno reservado con éxito para el ${args.fecha} a las ${args.hora}! Tu ID de turno es: ${turno.id}. Este ID numérico de 4 dígitos es necesario para cancelar o reagendar.`,
        turno: { id: turno.id, fecha: turno.fecha, hora: turno.hora },
      };
    } catch (error) {
      return { exito: false, mensaje: `Error al reservar: ${error instanceof Error ? error.message : "Desconocido"}` };
    }
  },
};

/**
 * Tool para listar turnos existentes
 */
export const toolListarTurnos = {
  description: "Lista los turnos reservados en el sistema para una fecha específica o un rango.",
  parameters: z.object({
    fechaDesde: z.string().optional().describe("Fecha de inicio YYYY-MM-DD"),
    fechaHasta: z.string().optional().describe("Fecha de fin YYYY-MM-DD"),
  }),
  execute: async (args: { fechaDesde?: string; fechaHasta?: string }) => {
    console.log("📋 [TOOL] listarTurnos ejecutándose...");
    const fechaDesde = args.fechaDesde || new Date().toISOString().split("T")[0];
    const fechaHasta = args.fechaHasta || fechaDesde;

    try {
      const turnos = await listarTurnos(fechaDesde, fechaHasta, true);

      if (turnos.length === 0) {
        return { cantidad: 0, mensaje: `No hay turnos entre el ${fechaDesde} y el ${fechaHasta}.`, turnos: [] };
      }

      return {
        cantidad: turnos.length,
        mensaje: `Hay ${turnos.length} turno(s) reservado(s):`,
        turnos: turnos.map((t) => ({ id: t.id, fecha: t.fecha, hora: t.hora, cliente: t.nombre_cliente })),
      };
    } catch (error) {
      return { cantidad: 0, mensaje: `Error al listar: ${error instanceof Error ? error.message : "Desconocido"}` };
    }
  },
};

/**
 * Tool para cancelar un turno existente
 */
export const toolCancelarTurno = {
  description: "Cancela un turno existente usando su ID numérico de 4 dígitos.",
  parameters: z.object({
    turnoId: z.string().describe("ID numérico de 4 dígitos del turno a cancelar"),
  }),
  execute: async (args: { turnoId: string }) => {
    console.log("❌ [TOOL] cancelarTurno ejecutándose...");
    try {
      const turno = await cancelarTurno(args.turnoId);

      // Enviamos email (no bloqueante) local
      enviarEmailCancelacion({
        email: turno.email,
        nombre: turno.nombre_cliente,
        fecha: turno.fecha,
        hora: turno.hora,
        turnoId: turno.id,
      }).catch(console.error);

      return { exito: true, mensaje: `Turno ${args.turnoId} cancelado exitosamente.` };
    } catch (error) {
      return { exito: false, mensaje: `No se pudo cancelar el turno. Verifica que el ID de 4 dígitos sea correcto. Detalle: ${error instanceof Error ? error.message : "Error"}` };
    }
  },
};

/**
 * Tool para reagendar un turno
 */
export const toolReagendarTurno = {
  description: "Cancela un turno actual usando su ID numérico de 4 dígitos y lo reserva en una nueva fecha y hora. Verifica disponibilidad antes de reagendar.",
  parameters: z.object({
    turnoId: z.string().describe("ID numérico de 4 dígitos del turno a reagendar"),
    nuevaFecha: z.string().describe("Nueva fecha en formato YYYY-MM-DD"),
    nuevaHora: z.string().describe("Nueva hora en formato HH:MM"),
  }),
  execute: async (args: { turnoId: string; nuevaFecha: string; nuevaHora: string }) => {
    console.log("🔄 [TOOL] reagendarTurno ejecutándose...");

    if (!validarFormatoFecha(args.nuevaFecha) || !validarFormatoHora(args.nuevaHora)) {
      return { exito: false, mensaje: "Formato de fecha u hora inválido." };
    }

    if (!validarFechaHoraFutura(args.nuevaFecha, args.nuevaHora)) {
      return { exito: false, mensaje: "La nueva fecha y hora ya pasaron." };
    }

    const validacionDia = validarDiaLaboral(args.nuevaFecha);
    if (!validacionDia.valido) return { exito: false, mensaje: validacionDia.motivo };

    if (!validarHorarioLaboral(args.nuevaHora)) {
      return { exito: false, mensaje: "Fuera de horario laboral (09:00-18:00)." };
    }

    try {
      const nuevoTurno = await reagendarTurno(args.turnoId, args.nuevaFecha, args.nuevaHora);

      // Enviamos email (no bloqueante) local
      enviarEmailReagendamiento({
        email: nuevoTurno.email,
        nombre: nuevoTurno.nombre_cliente,
        nuevaFecha: nuevoTurno.fecha,
        nuevaHora: nuevoTurno.hora,
        nuevoTurnoId: nuevoTurno.id,
      }).catch(console.error);

      return {
        exito: true,
        mensaje: `Turno reagendado con éxito. Tu nuevo turno es el ${nuevoTurno.fecha} a las ${nuevoTurno.hora}. Tu NUEVO ID de confirmación es: ${nuevoTurno.id}.`,
      };
    } catch (error) {
      return { exito: false, mensaje: `Error al reagendar: ${error instanceof Error ? error.message : "Desconocido"}` };
    }
  }
};

// Exportamos todas las tools
export const tools = {
  verificarDisponibilidad: toolVerificarDisponibilidad,
  reservarTurno: toolReservarTurno,
  listarTurnos: toolListarTurnos,
  cancelarTurno: toolCancelarTurno,
  reagendarTurno: toolReagendarTurno,
};
