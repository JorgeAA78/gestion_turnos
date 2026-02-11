/**
 * Cliente de Supabase para la conexión con la base de datos
 * 
 * Este archivo exporta el cliente de Supabase configurado con las variables
 * de entorno necesarias. Se usa en toda la aplicación para interactuar
 * con la base de datos.
 */

import { createClient } from "@supabase/supabase-js";

// Verificamos que las variables de entorno estén configuradas
if (!process.env.SUPABASE_URL) {
  throw new Error("SUPABASE_URL no está configurada en las variables de entorno");
}

if (!process.env.SUPABASE_KEY) {
  throw new Error("SUPABASE_KEY no está configurada en las variables de entorno");
}

// Creamos y exportamos el cliente de Supabase
// Este cliente se usa para hacer queries a la base de datos
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

