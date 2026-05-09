import { NextResponse } from "next/server";
import { listarTurnos } from "@/lib/turnos";
import nodemailer from "nodemailer";

export async function GET(request: Request) {
  // Verificación de seguridad simple para evitar llamadas públicas indeseadas
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.log("Acceso no autorizado al cron de recordatorios");
    // Puedes habilitar la protección descomentando la siguiente línea en producción:
    // return new Response("Unauthorized", { status: 401 });
  }

  try {
    console.log("⏰ [CRON] Iniciando envío de recordatorios...");

    // 1. Obtener la fecha y hora actual en Argentina
    const now = new Date();
    // Sumamos 2 horas para buscar los turnos que ocurren dentro de exactamente 2 horas
    const targetTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    
    // Ajustamos al timezone de Argentina para comparar con la base de datos
    targetTime.setHours(targetTime.getHours() - 3);

    const targetDateStr = targetTime.toISOString().split("T")[0]; // YYYY-MM-DD
    
    // Rango de horas (buscamos turnos que estén en la misma hora)
    // Ejemplo: Si son las 10:15, buscamos turnos de las 12:00 a 12:59
    const targetHourStr = targetTime.toISOString().split("T")[1].substring(0, 2); 

    // 2. Obtener turnos del día objetivo (Lee de Supabase)
    const turnosDelDia = await listarTurnos(targetDateStr, targetDateStr, true);

    // 3. Filtrar turnos que coincidan con la hora objetivo
    const turnosARecordar = turnosDelDia.filter((turno) => {
      const horaTurno = turno.hora.split(":")[0];
      return horaTurno === targetHourStr;
    });

    console.log(`Encontrados ${turnosARecordar.length} turnos para recordar en 2 horas.`);

    // 4. Configurar el transporter de Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // 5. Enviar los recordatorios
    const promesas = turnosARecordar.map(async (turno) => {
      console.log(`   Enviando recordatorio a ${turno.email}...`);
      await transporter.sendMail({
        from: `"Mi Turno" <${process.env.GMAIL_USER}>`,
        to: turno.email,
        subject: `⏰ Recordatorio de Turno en 2 horas`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">⏰ Recordatorio de Turno</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #eee;">
              <p style="font-size: 16px; color: #333;">Hola <strong>${turno.nombre_cliente}</strong>,</p>
              <p style="font-size: 16px; color: #333;">Te recordamos que tienes un turno programado en aproximadamente 2 horas.</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #fda085; margin: 20px 0;">
                <p style="margin: 8px 0; font-size: 15px;">📅 <strong>Fecha:</strong> ${turno.fecha}</p>
                <p style="margin: 8px 0; font-size: 15px;">🕐 <strong>Hora:</strong> ${turno.hora}</p>
                <p style="margin: 8px 0; font-size: 15px;">🆔 <strong>ID de Turno:</strong> ${turno.id}</p>
              </div>
              
              <p style="font-size: 14px; color: #666;">Te esperamos. Recuerda llegar 5 minutos antes.</p>
            </div>
          </div>
        `,
      });
    });

    await Promise.all(promesas);

    return NextResponse.json({ 
      success: true, 
      message: `Se enviaron ${turnosARecordar.length} recordatorios.`,
      turnos: turnosARecordar.map(t => t.id)
    });
  } catch (error) {
    console.error("Error en cron de recordatorios:", error);
    return NextResponse.json(
      { error: "Error al procesar recordatorios" },
      { status: 500 }
    );
  }
}
