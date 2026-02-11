/**
 * Módulo de envío de emails usando Nodemailer con Gmail
 * 
 * Envía emails de confirmación cuando se reserva un turno.
 * Usa Gmail SMTP como servicio de envío.
 * 
 * Requisitos:
 * - Tener habilitada la verificación en 2 pasos en Gmail
 * - Crear una contraseña de aplicación en: https://myaccount.google.com/apppasswords
 */

import nodemailer from "nodemailer";

// Configuramos el transporter de Gmail
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

/**
 * Envía un email de confirmación de turno al cliente
 * @param datos Datos del turno para incluir en el email
 * @returns true si el email se envió correctamente, false si hubo un error
 */
export async function enviarEmailConfirmacion(datos: {
  email: string;
  nombre: string;
  fecha: string;
  hora: string;
  turnoId: string;
}): Promise<boolean> {
  try {
    console.log("📧 [EMAIL] Enviando confirmación de turno...");
    console.log(`   📬 Para: ${datos.email}`);
    console.log(`   👤 Cliente: ${datos.nombre}`);

    await transporter.sendMail({
      from: `"Mi Turno" <${process.env.GMAIL_USER}>`,
      to: datos.email,
      subject: `✅ Turno confirmado - ${datos.fecha} a las ${datos.hora}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">✅ Turno Confirmado</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #eee;">
            <p style="font-size: 16px; color: #333;">Hola <strong>${datos.nombre}</strong>,</p>
            <p style="font-size: 16px; color: #333;">Tu turno ha sido reservado exitosamente. Aquí están los detalles:</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
              <p style="margin: 8px 0; font-size: 15px;">📅 <strong>Fecha:</strong> ${datos.fecha}</p>
              <p style="margin: 8px 0; font-size: 15px;">🕐 <strong>Hora:</strong> ${datos.hora}</p>
              <p style="margin: 8px 0; font-size: 15px;">🆔 <strong>ID de Turno:</strong> ${datos.turnoId}</p>
            </div>
            
            <p style="font-size: 14px; color: #666;">Si necesitas cancelar o modificar tu turno, contactanos mencionando tu ID de turno.</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">Este es un email automático generado por Mi Turno.</p>
          </div>
        </div>
      `,
    });

    console.log(`   ✅ Email enviado correctamente`);
    return true;
  } catch (error) {
    console.error("   ❌ Error al enviar email:", error);
    return false;
  }
}
