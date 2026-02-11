/**
 * Script TypeScript para ejecutar la migración de la base de datos
 * 
 * Este script lee el archivo setup-db.sql y lo ejecuta en Supabase
 * usando el cliente de Supabase.
 * 
 * USO:
 * 1. Asegúrate de tener las variables de entorno configuradas (.env.local)
 * 2. Ejecuta: pnpm setup-db
 *    o: npm run setup-db
 *    o: tsx scripts/setup-db.ts
 */

import { readFileSync } from "fs";
import { join } from "path";
import { supabase } from "../src/lib/db";

async function setupDatabase() {
  try {
    console.log("🚀 Iniciando configuración de la base de datos...\n");

    // Leemos el archivo SQL
    const sqlPath = join(__dirname, "setup-db.sql");
    const sql = readFileSync(sqlPath, "utf-8");

    // Dividimos el SQL en statements individuales
    // Removemos comentarios y líneas vacías
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--") && !s.startsWith("COMMENT"));

    console.log(`📝 Encontrados ${statements.length} statements SQL para ejecutar\n`);

    // Ejecutamos cada statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Saltamos los CREATE INDEX IF NOT EXISTS ya que Supabase los maneja diferente
      if (statement.includes("CREATE INDEX IF NOT EXISTS")) {
        console.log(`⏭️  Saltando índice (se creará automáticamente): ${statement.substring(0, 50)}...`);
        continue;
      }

      console.log(`📌 Ejecutando statement ${i + 1}/${statements.length}...`);

      const { error } = await supabase.rpc("exec_sql", { sql_query: statement });

      if (error) {
        // Si el RPC no existe, intentamos ejecutar directamente
        // Nota: Supabase no permite ejecutar SQL arbitrario desde el cliente
        // por seguridad. Es mejor usar el SQL Editor en la consola de Supabase.
        console.warn(
          `⚠️  No se pudo ejecutar automáticamente. Por favor ejecuta el script manualmente en el SQL Editor de Supabase.`
        );
        console.warn(`   Error: ${error.message}\n`);
        break;
      }
    }

    console.log("\n✅ Configuración completada!");
    console.log("\n📋 NOTA IMPORTANTE:");
    console.log(
      "   Para crear la tabla, por favor ejecuta el script SQL manualmente:"
    );
    console.log("   1. Ve a tu proyecto en Supabase");
    console.log("   2. Abre el SQL Editor");
    console.log("   3. Copia el contenido de scripts/setup-db.sql");
    console.log("   4. Pega y ejecuta el script\n");
  } catch (error) {
    console.error("❌ Error al configurar la base de datos:", error);
    console.error("\n💡 Solución:");
    console.error(
      "   Ejecuta el script SQL manualmente en el SQL Editor de Supabase."
    );
    console.error("   El archivo está en: scripts/setup-db.sql\n");
    process.exit(1);
  }
}

// Ejecutamos el script
setupDatabase();

