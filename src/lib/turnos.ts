/**
 * Funciones para gestionar turnos en la base de datos
 * 
 * Este módulo contiene todas las funciones necesarias para:
 * - Crear nuevos turnos
 * - Listar turnos existentes
 * - Verificar disponibilidad en una fecha/hora específica
 * - Cancelar turnos
 */

import { supabase } from "./db";

// Tipo para representar un turno
export interface Turno {
  id: string;
  fecha: string; // Formato: YYYY-MM-DD
  hora: string; // Formato: HH:MM
  nombre_cliente: string;
  email: string;
  estado: "confirmado" | "cancelado";
  created_at: string;
}

// Tipo para crear un nuevo turno (sin id ni created_at)
export interface NuevoTurno {
  fecha: string;
  hora: string;
  nombre_cliente: string;
  email: string;
  estado?: "confirmado" | "cancelado";
}

/**
 * Crea un nuevo turno en la base de datos
 * @param turno Datos del turno a crear
 * @returns El turno creado con su id y created_at
 */
export async function crearTurno(turno: NuevoTurno): Promise<Turno> {
  const { data, error } = await supabase
    .from("turnos")
    .insert({
      ...turno,
      estado: turno.estado || "confirmado", // Por defecto es confirmado
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Error al crear turno: ${error.message}`);
  }

  return data;
}

/**
 * Lista los turnos según criterios de búsqueda
 * @param fechaDesde Fecha de inicio (opcional, formato YYYY-MM-DD)
 * @param fechaHasta Fecha de fin (opcional, formato YYYY-MM-DD)
 * @param soloConfirmados Si es true, solo devuelve turnos confirmados
 * @returns Array de turnos que cumplen los criterios
 */
export async function listarTurnos(
  fechaDesde?: string,
  fechaHasta?: string,
  soloConfirmados: boolean = true
): Promise<Turno[]> {
  let query = supabase.from("turnos").select("*");

  // Filtramos por rango de fechas si se proporcionan
  if (fechaDesde) {
    query = query.gte("fecha", fechaDesde);
  }

  if (fechaHasta) {
    query = query.lte("fecha", fechaHasta);
  }

  // Filtramos por estado si solo queremos confirmados
  if (soloConfirmados) {
    query = query.eq("estado", "confirmado");
  }

  // Ordenamos por fecha y hora
  query = query.order("fecha", { ascending: true }).order("hora", { ascending: true });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Error al listar turnos: ${error.message}`);
  }

  return data || [];
}

/**
 * Verifica si hay disponibilidad en una fecha y hora específica
 * @param fecha Fecha a verificar (formato YYYY-MM-DD)
 * @param hora Hora a verificar (formato HH:MM)
 * @returns true si está disponible, false si ya hay un turno reservado
 */
export async function verificarDisponibilidad(
  fecha: string,
  hora: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("turnos")
    .select("id")
    .eq("fecha", fecha)
    .eq("hora", hora)
    .eq("estado", "confirmado")
    .limit(1);

  if (error) {
    throw new Error(`Error al verificar disponibilidad: ${error.message}`);
  }

  // Si hay datos, significa que ya hay un turno reservado
  return !data || data.length === 0;
}

/**
 * Cancela un turno cambiando su estado a "cancelado"
 * @param turnoId ID del turno a cancelar
 * @returns El turno actualizado
 */
export async function cancelarTurno(turnoId: string): Promise<Turno> {
  const { data, error } = await supabase
    .from("turnos")
    .update({ estado: "cancelado" })
    .eq("id", turnoId)
    .select()
    .single();

  if (error) {
    throw new Error(`Error al cancelar turno: ${error.message}`);
  }

  if (!data) {
    throw new Error(`No se encontró el turno con id: ${turnoId}`);
  }

  return data;
}

/**
 * Obtiene un turno por su ID
 * @param turnoId ID del turno
 * @returns El turno encontrado
 */
export async function obtenerTurnoPorId(turnoId: string): Promise<Turno | null> {
  const { data, error } = await supabase
    .from("turnos")
    .select("*")
    .eq("id", turnoId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No se encontró el turno
      return null;
    }
    throw new Error(`Error al obtener turno: ${error.message}`);
  }

  return data;
}

