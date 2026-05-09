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

/**
 * Envía un email de cancelación de turno al cliente
 * @param datos Datos del turno para incluir en el email
 * @returns true si el email se envió correctamente, false si hubo un error
 */
export async function enviarEmailCancelacion(datos: {
  email: string;
  nombre: string;
  fecha: string;
  hora: string;
  turnoId: string;
}): Promise<boolean> {
  try {
    console.log("📧 [EMAIL] Enviando cancelación de turno...");
    console.log(`   📬 Para: ${datos.email}`);
    console.log(`   👤 Cliente: ${datos.nombre}`);

    await transporter.sendMail({
      from: `"Mi Turno" <${process.env.GMAIL_USER}>`,
      to: datos.email,
      subject: `❌ Turno cancelado - ${datos.fecha} a las ${datos.hora}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">❌ Turno Cancelado</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #eee;">
            <p style="font-size: 16px; color: #333;">Hola <strong>${datos.nombre}</strong>,</p>
            <p style="font-size: 16px; color: #333;">Te confirmamos que tu turno ha sido cancelado exitosamente a tu solicitud.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #f5576c; margin: 20px 0;">
              <p style="margin: 8px 0; font-size: 15px;">📅 <strong>Fecha:</strong> ${datos.fecha}</p>
              <p style="margin: 8px 0; font-size: 15px;">🕐 <strong>Hora:</strong> ${datos.hora}</p>
              <p style="margin: 8px 0; font-size: 15px;">🆔 <strong>ID de Turno:</strong> ${datos.turnoId}</p>
            </div>
            
            <p style="font-size: 14px; color: #666;">Si deseas agendar un nuevo turno en el futuro, no dudes en volver a contactarnos.</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">Este es un email automático generado por Mi Turno.</p>
          </div>
        </div>
      `,
    });

    console.log(`   ✅ Email de cancelación enviado correctamente`);
    return true;
  } catch (error) {
    console.error("   ❌ Error al enviar email de cancelación:", error);
    return false;
  }
}

/**
 * Envía un email de reagendamiento de turno al cliente
 * @param datos Datos del turno modificado para incluir en el email
 * @returns true si el email se envió correctamente, false si hubo un error
 */
export async function enviarEmailReagendamiento(datos: {
  email: string;
  nombre: string;
  fechaOriginal?: string;
  horaOriginal?: string;
  nuevaFecha: string;
  nuevaHora: string;
  nuevoTurnoId: string;
}): Promise<boolean> {
  try {
    console.log("📧 [EMAIL] Enviando aviso de reagendamiento...");
    console.log(`   📬 Para: ${datos.email}`);
    
    await transporter.sendMail({
      from: `"Mi Turno" <${process.env.GMAIL_USER}>`,
      to: datos.email,
      subject: `🔄 Turno reagendado - ${datos.nuevaFecha} a las ${datos.nuevaHora}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #00c6fb 0%, #005bea 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🔄 Turno Reagendado</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #eee;">
            <p style="font-size: 16px; color: #333;">Hola <strong>${datos.nombre}</strong>,</p>
            <p style="font-size: 16px; color: #333;">Tu turno ha sido reagendado exitosamente para una nueva fecha y horario.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #00c6fb; margin: 20px 0;">
              <p style="margin: 8px 0; font-size: 15px;">📅 <strong>Nueva Fecha:</strong> ${datos.nuevaFecha}</p>
              <p style="margin: 8px 0; font-size: 15px;">🕐 <strong>Nueva Hora:</strong> ${datos.nuevaHora}</p>
              <p style="margin: 8px 0; font-size: 15px;">🆔 <strong>NUEVO ID de Turno:</strong> ${datos.nuevoTurnoId}</p>
            </div>
            
            <p style="font-size: 14px; color: #666;">Por favor guarda tu nuevo ID, ya que el anterior ha quedado invalidado.</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">Este es un email automático generado por Mi Turno.</p>
          </div>
        </div>
      `,
    });

    console.log(`   ✅ Email de reagendamiento enviado correctamente`);
    return true;
  } catch (error) {
    console.error("   ❌ Error al enviar email de reagendamiento:", error);
    return false;
  }
}

