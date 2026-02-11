# Clase 4 - App de Turnos con Agente

Aplicación Next.js simple que permite chatear con un asistente que puede agendar turnos, chequear disponibilidad y gestionar reservas usando Vercel AI SDK y Supabase.

## 🎯 Objetivo

Esta aplicación es un ejemplo educativo que demuestra cómo construir un agente conversacional que puede usar herramientas (tools) para interactuar con una base de datos y realizar acciones específicas.

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+ instalado
- Una cuenta en [Supabase](https://supabase.com) (gratis)
- Una API Key de [OpenAI](https://platform.openai.com/api-keys)

### Paso 1: Clonar e Instalar Dependencias

```bash
# Instalar dependencias
pnpm install
# o
npm install
```

### Paso 2: Configurar Variables de Entorno

1. Copia el archivo `.env.local.example` a `.env.local`:

```bash
cp .env.local.example .env.local
```

2. Edita `.env.local` y completa las variables:

```env
SUPABASE_URL=tu_supabase_url_aqui
SUPABASE_KEY=tu_supabase_anon_key_aqui
OPENAI_API_KEY=tu_openai_api_key_aqui
```

#### Obtener credenciales de Supabase:

1. Ve a [supabase.com](https://supabase.com) y crea un proyecto (o usa uno existente)
2. En tu proyecto, ve a **Settings** > **API**
3. Copia la **URL** del proyecto → `SUPABASE_URL`
4. Copia la **anon public** key → `SUPABASE_KEY`

#### Obtener API Key de OpenAI:

1. Ve a [platform.openai.com](https://platform.openai.com/api-keys)
2. Crea una nueva API Key
3. Copia la key → `OPENAI_API_KEY`

### Paso 3: Configurar la Base de Datos

Tienes dos opciones para crear la tabla en Supabase:

#### Opción A: Usando el SQL Editor (Recomendado)

1. Ve a tu proyecto en Supabase
2. Abre el **SQL Editor** (en el menú lateral)
3. Haz clic en **New Query**
4. Abre el archivo `scripts/setup-db.sql` en tu editor
5. Copia todo el contenido del archivo SQL
6. Pega el contenido en el SQL Editor de Supabase
7. Haz clic en **Run** (o presiona Cmd/Ctrl + Enter)

#### Opción B: Usando el Script TypeScript (Opcional)

```bash
pnpm setup-db
```

**Nota:** Este método puede requerir permisos adicionales. Si no funciona, usa la Opción A.

### Paso 4: Ejecutar la Aplicación

```bash
pnpm dev
# o
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📁 Estructura del Proyecto

```
clase-4-mi-turno/
├── src/
│   ├── lib/
│   │   ├── db.ts              # Cliente de Supabase
│   │   ├── turnos.ts          # Funciones para gestionar turnos
│   │   ├── tools.ts           # Definición de tools para el agente
│   │   └── validaciones.ts    # Funciones de validación (fechas, horas, etc.)
│   └── app/
│       ├── api/
│       │   └── chat/
│       │       └── route.ts    # API route para el chat
│       ├── page.tsx             # Interfaz de chat
│       └── page.module.css      # Estilos
├── scripts/
│   ├── setup-db.sql       # Script SQL para crear la tabla
│   └── setup-db.ts        # Script TypeScript opcional
└── README.md
```

## 🛠️ Cómo Funciona

### 1. Interfaz de Chat (`src/app/page.tsx`)

La interfaz permite al usuario escribir mensajes y recibir respuestas del agente. Mantiene un historial de la conversación.

### 2. API Route (`src/app/api/chat/route.ts`)

El endpoint `/api/chat` recibe los mensajes y los procesa usando Vercel AI SDK con el modelo `gpt-4.1-mini`. El agente puede usar tools para interactuar con la base de datos.

### 3. Tools (`lib/tools.ts`)

El agente tiene acceso a 4 tools:

- **verificarDisponibilidad**: Chequea si hay turnos disponibles en una fecha/hora
- **reservarTurno**: Reserva un nuevo turno con los datos del cliente
- **listarTurnos**: Lista los turnos de un día o rango de fechas
- **cancelarTurno**: Cancela un turno existente

### 4. Base de Datos (`src/lib/turnos.ts`)

Funciones que interactúan con Supabase para:
- Crear turnos
- Listar turnos
- Verificar disponibilidad
- Cancelar turnos

### 5. Validaciones (`src/lib/validaciones.ts`)

Funciones auxiliares para validar datos:
- Validar formato de fechas (YYYY-MM-DD)
- Validar formato de horas (HH:MM)
- Validar que las fechas sean futuras
- Validar horarios laborales
- Validar que fecha+hora no estén en el pasado

## 🎓 Características Didácticas

### Logging Educativo

Cuando ejecutes la aplicación, verás en la consola del servidor información detallada sobre:
- Qué tools se están ejecutando
- Los parámetros que recibe cada tool
- Los resultados de las operaciones
- Errores y advertencias

Esto te ayuda a entender cómo funciona el agente internamente.

**Ejemplo de output en consola:**
```
💬 [CHAT] Nuevo mensaje recibido:
   Usuario: Quiero reservar un turno para mañana a las 14:00...

📝 [TOOL] reservarTurno ejecutándose...
   👤 Cliente: Juan Pérez
   📧 Email: juan@example.com
   📅 Fecha: 2024-12-18
   🕐 Hora: 14:00
   ✅ Turno creado exitosamente con ID: abc123...
```

### Validaciones Inteligentes

El sistema valida automáticamente:
- ✅ Formato correcto de fechas y horas
- ✅ Que no se reserven turnos en el pasado
- ✅ Horarios laborales (con advertencias)
- ✅ Disponibilidad antes de reservar

Esto muestra cómo se implementan validaciones en aplicaciones reales.

## 💬 Ejemplos de Uso

Una vez que la aplicación esté corriendo, puedes probar estas interacciones:

```
Usuario: "¿Hay turnos disponibles mañana a las 14:00?"
Asistente: [Verifica disponibilidad y responde]

Usuario: "Quiero reservar un turno para el 25 de diciembre a las 10:00. Mi nombre es Juan Pérez y mi email es juan@example.com"
Asistente: [Reserva el turno y confirma]

Usuario: "¿Qué turnos hay hoy?"
Asistente: [Lista los turnos del día]

Usuario: "Quiero cancelar mi turno"
Asistente: [Pide el ID del turno y lo cancela]
```

## 🔧 Tecnologías Utilizadas

- **Next.js 15**: Framework React con App Router
- **Vercel AI SDK**: SDK para construir agentes con LLMs
- **OpenAI GPT-4.1-mini**: Modelo de lenguaje
- **Supabase**: Base de datos PostgreSQL como servicio
- **Zod**: Validación de schemas para las tools
- **TypeScript**: Tipado estático

## 📝 Notas Importantes

- **stopWhen: stepCountIs(9)**: Limita el número de pasos del agente para asegurar que ejecute las tools y no se quede en un loop infinito.

- **Modelo**: Se usa `gpt-4.1-mini` que es rápido y económico para este tipo de aplicaciones.

- **Base de Datos**: La tabla `turnos` tiene una restricción única que previene reservar dos turnos en la misma fecha y hora cuando ambos están "confirmados".

## 🐛 Solución de Problemas

### Error: "SUPABASE_URL no está configurada"

Asegúrate de tener el archivo `.env.local` con todas las variables de entorno necesarias.

### Error: "relation 'turnos' does not exist"

Ejecuta el script SQL en Supabase para crear la tabla (ver Paso 3).

### El agente no ejecuta las tools

Verifica que:
1. El modelo esté correctamente configurado (`gpt-4.1-mini`)
2. El `stopWhen: stepCountIs(9)` esté configurado
3. Las tools estén correctamente definidas con sus schemas zod

## 📚 Recursos Adicionales

- [Documentación de Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Documentación de Supabase](https://supabase.com/docs)
- [Documentación de Next.js](https://nextjs.org/docs)

## 🎓 Para Estudiantes

Este proyecto está diseñado como ejemplo educativo. El código está comentado en español para facilitar el aprendizaje. Puedes:

1. **Probar la aplicación básica**: Sigue los pasos de setup y prueba las funcionalidades
2. **Modificar las tools**: Agrega nuevas funcionalidades o modifica las existentes
3. **Mejorar la UI**: Personaliza los estilos o agrega nuevas características
4. **Agregar validaciones**: Mejora las validaciones de datos en las tools
5. **Agregar autenticación**: Implementa un sistema de usuarios

¡Diviértete aprendiendo! 🚀
