/**
 * Funciones para gestionar turnos usando la API oficial de Cal.com (v2)
 * Y guardando un respaldo en la base de datos Supabase
 * 
 * NOTA: La API v1 de Cal.com ha sido dada de baja.
 * - Usamos API v2 para crear y cancelar reservas en el calendario oficial.
 * - Usamos Supabase como fuente principal de verdad para disponibilidad y listados.
 */

import { supabase } from "./db";

// Tipo para representar un turno
export interface Turno {
  id: string; // ID interno numérico de 4 dígitos (Alias)
  fecha: string; // Formato: YYYY-MM-DD
  hora: string; // Formato: HH:MM
  nombre_cliente: string;
  email: string;
  estado: "confirmado" | "cancelado";
  calcom_uid?: string; // UID largo alfanumérico devuelto por Cal.com
}

// Tipo para crear un nuevo turno
export interface NuevoTurno {
  fecha: string;
  hora: string;
  nombre_cliente: string;
  email: string;
}

// Helpers para la API v2 de Cal.com
const CALCOM_API_KEY = process.env.CALCOM_API_KEY;
const CALCOM_EVENT_TYPE_SLUG = process.env.CALCOM_EVENT_TYPE_SLUG || "test-calendar";
const CALCOM_USERNAME = process.env.CALCOM_USERNAME || "ariel-altamirano-j3amfh";
const BASE_URL = "https://api.cal.com/v2";

if (!CALCOM_API_KEY) {
  console.warn("⚠️ ADVERTENCIA: CALCOM_API_KEY no está configurado en .env");
}

/**
 * Genera un ID numérico de 4 dígitos aleatorio
 */
function generarId4Digitos(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Crea un nuevo turno en Cal.com (API v2) y guarda un respaldo en Supabase
 */
export async function crearTurno(turno: NuevoTurno): Promise<Turno> {
  if (!CALCOM_API_KEY) throw new Error("Falta configurar CALCOM_API_KEY en el servidor.");

  // Convertimos la fecha y hora a ISO (UTC) asumiendo GMT-3 (Buenos Aires)
  const startTime = new Date(`${turno.fecha}T${turno.hora}:00-03:00`).toISOString();

  // 1. Crear en Cal.com (v2)
  const response = await fetch(`${BASE_URL}/bookings`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${CALCOM_API_KEY}`,
      "cal-api-version": "2024-08-13"
    },
    body: JSON.stringify({
      start: startTime,
      eventTypeSlug: CALCOM_EVENT_TYPE_SLUG,
      username: CALCOM_USERNAME,
      attendee: {
        name: turno.nombre_cliente,
        email: turno.email,
        timeZone: "America/Argentina/Buenos_Aires",
        language: "es"
      }
    }),
  });

  let turnoUid = "";

  if (!response.ok) {
    const err = await response.json();
    console.error("Error API Cal.com v2:", err);
    
    const errorMsg = err.error?.message || "";
    if (errorMsg.includes("User either already has booking at this time or is not available")) {
      throw new Error("El horario seleccionado ya no está disponible en el calendario del profesional.");
    }
    
    throw new Error(`Error al agendar en Cal.com: ${errorMsg || JSON.stringify(err)}`);
  } else {
    const data = await response.json();
    // En v2, el ID alfanumérico que se usa para cancelar es 'uid'
    turnoUid = data.data.uid;
  }

  // Generamos nuestro ID interno de 4 dígitos
  const idCorto = generarId4Digitos();

  // 2. Guardar en Supabase
  const { error: supabaseError } = await supabase.from("turnos").insert({
    id: idCorto, 
    calcom_uid: turnoUid, // Guardamos el largo como un alias
    fecha: turno.fecha,
    hora: turno.hora,
    nombre_cliente: turno.nombre_cliente,
    email: turno.email,
    estado: "confirmado",
  });

  if (supabaseError) {
    console.error("⚠️ Error guardando en Supabase, pero agendado en Cal.com:", supabaseError);
    // IMPORTANTE: Asegúrate de que la columna 'calcom_uid' exista en Supabase, sino esto fallará
  }

  return {
    id: idCorto, // El ID que le devolvemos al cliente
    calcom_uid: turnoUid,
    fecha: turno.fecha,
    hora: turno.hora,
    nombre_cliente: turno.nombre_cliente,
    email: turno.email,
    estado: "confirmado",
  };
}

/**
 * Lista los turnos existentes en Supabase
 * Al usar Supabase es mucho más rápido y evita límites de la API de Cal.com
 */
export async function listarTurnos(
  fechaDesde?: string,
  fechaHasta?: string,
  soloConfirmados: boolean = true
): Promise<Turno[]> {
  let query = supabase.from("turnos").select("*");

  if (fechaDesde) {
    query = query.gte("fecha", fechaDesde);
  }

  if (fechaHasta) {
    query = query.lte("fecha", fechaHasta);
  }

  if (soloConfirmados) {
    query = query.eq("estado", "confirmado");
  }

  query = query.order("fecha", { ascending: true }).order("hora", { ascending: true });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Error al listar turnos de Supabase: ${error.message}`);
  }

  return data || [];
}

/**
 * Verifica si hay disponibilidad en una fecha y hora específica
 * Usamos Supabase para la disponibilidad ya que los endpoints de slots v2 son complejos 
 * y la v1 fue desactivada.
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

  // Si no hay turnos confirmados en esa fecha/hora, está disponible
  return !data || data.length === 0;
}

/**
 * Obtiene un turno de Supabase dado su ID corto de 4 dígitos
 */
export async function obtenerTurnoPorIdCorto(idCorto: string): Promise<Turno | null> {
  const { data, error } = await supabase
    .from("turnos")
    .select("*")
    .eq("id", idCorto)
    .single();

  if (error) {
    return null;
  }

  return data;
}

/**
 * Cancela un turno usando el ID corto local
 */
export async function cancelarTurno(turnoIdCorto: string): Promise<Turno> {
  if (!CALCOM_API_KEY) throw new Error("Falta configurar CALCOM_API_KEY.");

  // 1. Buscamos el turno en nuestra BD para obtener el calcom_uid
  const turno = await obtenerTurnoPorIdCorto(turnoIdCorto);
  
  if (!turno) {
    throw new Error(`No se encontró un turno con el ID ${turnoIdCorto} en el sistema.`);
  }

  // 2. Cancelar en Cal.com (v2) usando el uid largo
  if (turno.calcom_uid) {
    const response = await fetch(`${BASE_URL}/bookings/${turno.calcom_uid}/cancel`, {
      method: "POST", // API v2 usa POST para cancelar
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CALCOM_API_KEY}`,
        "cal-api-version": "2024-08-13"
      },
      body: JSON.stringify({ cancellationReason: "Cancelado por el usuario vía asistente virtual" })
    });

    if (!response.ok) {
      const err = await response.json();
      console.warn("No se pudo cancelar en Cal.com, ignorando error para proceder en Supabase:", err);
      // No lanzamos error si Cal.com falla, para asegurar que se borre de nuestra base local
    }
  } else {
    console.warn(`El turno ${turnoIdCorto} no tiene calcom_uid, omitiendo cancelación en Cal.com.`);
  }

  // 3. Cancelar en Supabase
  const { error: supabaseError } = await supabase
    .from("turnos")
    .update({ estado: "cancelado" })
    .eq("id", turnoIdCorto);

  if (supabaseError) {
    console.error("⚠️ Error cancelando en Supabase:", supabaseError);
    throw new Error(`Error cancelando en la base de datos.`);
  }

  return {
    ...turno,
    estado: "cancelado"
  };
}

/**
 * Reagenda un turno usando el ID corto local
 */
export async function reagendarTurno(turnoIdCorto: string, nuevaFecha: string, nuevaHora: string): Promise<Turno> {
  // Primero verificamos disponibilidad real en Supabase
  const disponible = await verificarDisponibilidad(nuevaFecha, nuevaHora);
  if (!disponible) {
    throw new Error(`La fecha y hora solicitada (${nuevaFecha} ${nuevaHora}) no está disponible en la agenda.`);
  }

  // Obtenemos los detalles del turno original
  const turnoOriginal = await obtenerTurnoPorIdCorto(turnoIdCorto);

  if (!turnoOriginal) {
    throw new Error(`No se encontró el turno original con ID ${turnoIdCorto} en la base de datos.`);
  }

  // Crear nuevo en Cal.com y Supabase primero (por si falla Cal.com, no perdemos el viejo)
  const nuevoTurno = await crearTurno({
    fecha: nuevaFecha,
    hora: nuevaHora,
    nombre_cliente: turnoOriginal.nombre_cliente,
    email: turnoOriginal.email
  });

  // Si se creó exitosamente, cancelamos el viejo
  try {
    await cancelarTurno(turnoIdCorto);
  } catch (error) {
    console.error("Error cancelando el turno viejo tras reagendar:", error);
    // No lanzamos error para no fallar el reagendamiento si la cancelación falla.
  }

  return nuevoTurno;
}
