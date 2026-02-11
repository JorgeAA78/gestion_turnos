-- Script SQL para crear la tabla de turnos en Supabase
-- 
-- INSTRUCCIONES:
-- 1. Ve a tu proyecto en Supabase (https://supabase.com)
-- 2. Abre el SQL Editor
-- 3. Copia y pega este script completo
-- 4. Ejecuta el script haciendo clic en "Run"
--
-- Este script creará la tabla 'turnos' con todos los campos necesarios
-- para gestionar los turnos de la aplicación.

-- Crear la tabla turnos
CREATE TABLE IF NOT EXISTS turnos (
  -- ID único del turno (UUID generado automáticamente)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Fecha del turno en formato YYYY-MM-DD
  fecha DATE NOT NULL,
  
  -- Hora del turno en formato HH:MM (24 horas)
  hora TIME NOT NULL,
  
  -- Nombre completo del cliente
  nombre_cliente TEXT NOT NULL,
  
  -- Email del cliente
  email TEXT NOT NULL,
  
  -- Estado del turno: 'confirmado' o 'cancelado'
  estado TEXT NOT NULL DEFAULT 'confirmado' CHECK (estado IN ('confirmado', 'cancelado')),
  
  -- Fecha y hora de creación del registro
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear un índice único parcial para prevenir turnos duplicados confirmados
-- en la misma fecha y hora
CREATE UNIQUE INDEX IF NOT EXISTS unique_turno_activo 
ON turnos(fecha, hora) 
WHERE estado = 'confirmado';

-- Crear índices para mejorar el rendimiento de las consultas
-- Índice para búsquedas por fecha
CREATE INDEX IF NOT EXISTS idx_turnos_fecha ON turnos(fecha);

-- Índice para búsquedas por estado
CREATE INDEX IF NOT EXISTS idx_turnos_estado ON turnos(estado);

-- Índice compuesto para búsquedas de disponibilidad (fecha + hora + estado)
CREATE INDEX IF NOT EXISTS idx_turnos_fecha_hora_estado ON turnos(fecha, hora, estado);

-- Comentarios en la tabla para documentación
COMMENT ON TABLE turnos IS 'Tabla para almacenar los turnos reservados por los clientes';
COMMENT ON COLUMN turnos.id IS 'ID único del turno';
COMMENT ON COLUMN turnos.fecha IS 'Fecha del turno en formato YYYY-MM-DD';
COMMENT ON COLUMN turnos.hora IS 'Hora del turno en formato HH:MM (24 horas)';
COMMENT ON COLUMN turnos.nombre_cliente IS 'Nombre completo del cliente';
COMMENT ON COLUMN turnos.email IS 'Email del cliente';
COMMENT ON COLUMN turnos.estado IS 'Estado del turno: confirmado o cancelado';
COMMENT ON COLUMN turnos.created_at IS 'Fecha y hora de creación del registro';

