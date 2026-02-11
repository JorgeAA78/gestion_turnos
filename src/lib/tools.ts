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
} from "./turnos";
import {
  validarFormatoFecha,
  validarFormatoHora,
  validarFechaFutura,
  validarHorarioLaboral,
  validarFechaHoraFutura,
} from "./validaciones";
import { enviarEmailConfirmacion } from "./email";

/**
 * Tool para verificar disponibilidad en una fecha y hora específica
 * El agente usa esta tool cuando el usuario pregunta sobre disponibilidad
 */
export const toolVerificarDisponibilidad = {
  description:
    "Verifica si hay disponibilidad para reservar un turno en una fecha y hora específica. Usa esta tool cuando el usuario pregunte si hay turnos disponibles o si puede reservar en un momento específico.",
  parameters: z.object({
    fecha: z
      .string()
      .describe("Fecha en formato YYYY-MM-DD (ejemplo: 2024-12-25)"),
    hora: z
      .string()
      .describe("Hora en formato HH:MM en formato 24 horas (ejemplo: 14:30)"),
  }),
  execute: async (args: { fecha: string; hora: string }) => {
    // Logging educativo: mostramos qué tool se está ejecutando
    console.log("🔍 [TOOL] verificarDisponibilidad ejecutándose...");
    console.log(`   📅 Fecha: ${args.fecha}`);
    console.log(`   🕐 Hora: ${args.hora}`);

    // Validaciones básicas
    if (!validarFormatoFecha(args.fecha)) {
      return {
        disponible: false,
        mensaje: `La fecha "${args.fecha}" no tiene un formato válido. Por favor usa el formato YYYY-MM-DD (ejemplo: 2024-12-25).`,
      };
    }

    if (!validarFormatoHora(args.hora)) {
      return {
        disponible: false,
        mensaje: `La hora "${args.hora}" no tiene un formato válido. Por favor usa el formato HH:MM en 24 horas (ejemplo: 14:30).`,
      };
    }

    if (!validarFechaFutura(args.fecha)) {
      return {
        disponible: false,
        mensaje: `La fecha ${args.fecha} está en el pasado. Por favor elige una fecha de hoy en adelante.`,
      };
    }

    // Verificamos disponibilidad en la base de datos
    const disponible = await verificarDisponibilidad(args.fecha, args.hora);

    console.log(`   ✅ Resultado: ${disponible ? "Disponible" : "No disponible"}`);

    return {
      disponible,
      mensaje: disponible
        ? `Sí, hay disponibilidad el ${args.fecha} a las ${args.hora}`
        : `No, no hay disponibilidad el ${args.fecha} a las ${args.hora}. Ya hay un turno reservado.`,
    };
  },
};

/**
 * Tool para reservar un nuevo turno
 * El agente usa esta tool cuando el usuario quiere agendar un turno
 */
export const toolReservarTurno = {
  description:
    "Reserva un nuevo turno con los datos del cliente. Usa esta tool cuando el usuario quiera agendar o reservar un turno. Siempre verifica disponibilidad primero antes de reservar.",
  parameters: z.object({
    fecha: z
      .string()
      .describe("Fecha en formato YYYY-MM-DD (ejemplo: 2024-12-25)"),
    hora: z
      .string()
      .describe("Hora en formato HH:MM en formato 24 horas (ejemplo: 14:30)"),
    nombre_cliente: z.string().describe("Nombre completo del cliente"),
    email: z.string().email().describe("Email del cliente"),
  }),
  execute: async (args: {
    fecha: string;
    hora: string;
    nombre_cliente: string;
    email: string;
  }) => {
    // Logging educativo: mostramos qué tool se está ejecutando
    console.log("📝 [TOOL] reservarTurno ejecutándose...");
    console.log(`   👤 Cliente: ${args.nombre_cliente}`);
    console.log(`   📧 Email: ${args.email}`);
    console.log(`   📅 Fecha: ${args.fecha}`);
    console.log(`   🕐 Hora: ${args.hora}`);

    // Validaciones básicas antes de proceder
    if (!validarFormatoFecha(args.fecha)) {
      return {
        exito: false,
        mensaje: `La fecha "${args.fecha}" no tiene un formato válido. Por favor usa el formato YYYY-MM-DD (ejemplo: 2024-12-25).`,
      };
    }

    if (!validarFormatoHora(args.hora)) {
      return {
        exito: false,
        mensaje: `La hora "${args.hora}" no tiene un formato válido. Por favor usa el formato HH:MM en 24 horas (ejemplo: 14:30).`,
      };
    }

    if (!validarFechaFutura(args.fecha)) {
      return {
        exito: false,
        mensaje: `No se puede reservar un turno en el pasado. La fecha ${args.fecha} ya pasó. Por favor elige una fecha de hoy en adelante.`,
      };
    }

    if (!validarFechaHoraFutura(args.fecha, args.hora)) {
      return {
        exito: false,
        mensaje: `No se puede reservar un turno en el pasado. La fecha y hora ${args.fecha} ${args.hora} ya pasó.`,
      };
    }

    // Validamos horario laboral (opcional, pero educativo)
    if (!validarHorarioLaboral(args.hora)) {
      console.log(`   ⚠️  Advertencia: La hora ${args.hora} está fuera del horario laboral (09:00-18:00)`);
      // No bloqueamos, solo informamos
    }

    // Primero verificamos disponibilidad
    const disponible = await verificarDisponibilidad(args.fecha, args.hora);

    if (!disponible) {
      console.log(`   ❌ No disponible - turno ya reservado`);
      return {
        exito: false,
        mensaje: `Lo siento, no hay disponibilidad el ${args.fecha} a las ${args.hora}. Por favor elige otra fecha u hora.`,
      };
    }

    // Si hay disponibilidad, creamos el turno
    try {
      const turno = await crearTurno({
        fecha: args.fecha,
        hora: args.hora,
        nombre_cliente: args.nombre_cliente,
        email: args.email,
        estado: "confirmado",
      });

      console.log(`   ✅ Turno creado exitosamente con ID: ${turno.id}`);

      // Enviamos email de confirmación (no bloqueante)
      const emailEnviado = await enviarEmailConfirmacion({
        email: args.email,
        nombre: args.nombre_cliente,
        fecha: args.fecha,
        hora: args.hora,
        turnoId: turno.id,
      });

      const mensajeEmail = emailEnviado
        ? " Se envió un email de confirmación a tu correo."
        : "";

      return {
        exito: true,
        mensaje: `¡Turno reservado con éxito! Tu turno está confirmado para el ${args.fecha} a las ${args.hora}. Tu ID de turno es: ${turno.id}.${mensajeEmail}`,
        turno: {
          id: turno.id,
          fecha: turno.fecha,
          hora: turno.hora,
        },
      };
    } catch (error) {
      console.error(`   ❌ Error al crear turno:`, error);
      return {
        exito: false,
        mensaje: `Hubo un error al reservar el turno: ${error instanceof Error ? error.message : "Error desconocido"}`,
      };
    }
  },
};

/**
 * Tool para listar turnos existentes
 * El agente usa esta tool cuando el usuario pregunta por turnos del día o de un rango de fechas
 */
export const toolListarTurnos = {
  description:
    "Lista los turnos reservados para una fecha específica o un rango de fechas. Usa esta tool cuando el usuario pregunte qué turnos hay, qué turnos hay hoy, o qué turnos hay en una fecha específica.",
  parameters: z.object({
    fechaDesde: z
      .string()
      .optional()
      .describe(
        "Fecha de inicio en formato YYYY-MM-DD. Si no se proporciona, se usa la fecha de hoy."
      ),
    fechaHasta: z
      .string()
      .optional()
      .describe(
        "Fecha de fin en formato YYYY-MM-DD. Si no se proporciona, se usa la misma fecha de inicio."
      ),
  }),
  execute: async (args: { fechaDesde?: string; fechaHasta?: string }) => {
    // Logging educativo: mostramos qué tool se está ejecutando
    console.log("📋 [TOOL] listarTurnos ejecutándose...");

    // Si no se proporciona fechaDesde, usamos hoy
    const fechaDesde =
      args.fechaDesde || new Date().toISOString().split("T")[0];
    const fechaHasta = args.fechaHasta || fechaDesde;

    console.log(`   📅 Buscando turnos desde ${fechaDesde} hasta ${fechaHasta}`);

    // Validaciones opcionales
    if (args.fechaDesde && !validarFormatoFecha(args.fechaDesde)) {
      return {
        cantidad: 0,
        mensaje: `La fecha "${args.fechaDesde}" no tiene un formato válido. Por favor usa el formato YYYY-MM-DD.`,
        turnos: [],
      };
    }

    if (args.fechaHasta && !validarFormatoFecha(args.fechaHasta)) {
      return {
        cantidad: 0,
        mensaje: `La fecha "${args.fechaHasta}" no tiene un formato válido. Por favor usa el formato YYYY-MM-DD.`,
        turnos: [],
      };
    }

    const turnos = await listarTurnos(fechaDesde, fechaHasta, true);

    console.log(`   ✅ Encontrados ${turnos.length} turno(s)`);

    if (turnos.length === 0) {
      return {
        cantidad: 0,
        mensaje: `No hay turnos reservados entre el ${fechaDesde} y el ${fechaHasta}.`,
        turnos: [],
      };
    }

    return {
      cantidad: turnos.length,
      mensaje: `Hay ${turnos.length} turno(s) reservado(s) entre el ${fechaDesde} y el ${fechaHasta}:`,
      turnos: turnos.map((t) => ({
        id: t.id,
        fecha: t.fecha,
        hora: t.hora,
        nombre_cliente: t.nombre_cliente,
        email: t.email,
      })),
    };
  },
};

/**
 * Tool para cancelar un turno existente
 * El agente usa esta tool cuando el usuario quiere cancelar su turno
 */
export const toolCancelarTurno = {
  description:
    "Cancela un turno existente usando su ID. Usa esta tool cuando el usuario quiera cancelar su turno. Necesitas el ID del turno para cancelarlo.",
  parameters: z.object({
    turnoId: z.string().describe("ID del turno a cancelar"),
  }),
  execute: async (args: { turnoId: string }) => {
    // Logging educativo: mostramos qué tool se está ejecutando
    console.log("❌ [TOOL] cancelarTurno ejecutándose...");
    console.log(`   🆔 ID del turno: ${args.turnoId}`);

    try {
      const turno = await cancelarTurno(args.turnoId);
      console.log(`   ✅ Turno cancelado exitosamente`);
      return {
        exito: true,
        mensaje: `Turno cancelado exitosamente. El turno del ${turno.fecha} a las ${turno.hora} ha sido cancelado.`,
      };
    } catch (error) {
      console.error(`   ❌ Error al cancelar turno:`, error);
      return {
        exito: false,
        mensaje: `No se pudo cancelar el turno: ${error instanceof Error ? error.message : "Error desconocido"
          }. Verifica que el ID del turno sea correcto.`,
      };
    }
  },
};

// Exportamos todas las tools en un array para usar con Vercel AI SDK
export const tools = {
  verificarDisponibilidad: toolVerificarDisponibilidad,
  reservarTurno: toolReservarTurno,
  listarTurnos: toolListarTurnos,
  cancelarTurno: toolCancelarTurno,
};
