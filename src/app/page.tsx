"use client";

/**
 * Componente principal de la aplicación
 * 
 * Interfaz de chat simple que permite al usuario conversar con el agente
 * para gestionar turnos. Incluye:
 * - Historial de mensajes
 * - Input para enviar mensajes
 * - Estado de carga mientras se procesa la respuesta
 */

import { useState } from "react";
import styles from "./page.module.css";

// Tipo para los mensajes del chat
interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "¡Hola! Soy tu asistente de turnos. Puedo ayudarte a verificar disponibilidad, reservar turnos, listar turnos y cancelar reservas. ¿En qué puedo ayudarte?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Función para enviar un mensaje
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) {
      return;
    }

    // Agregamos el mensaje del usuario al historial
    const userMessage: Message = {
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Enviamos todos los mensajes al API para mantener el contexto
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Error al obtener respuesta del agente");
      }

      const data = await response.json();

      // Agregamos la respuesta del asistente al historial
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.content,
        },
      ]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Lo siento, hubo un error al procesar tu mensaje. Por favor intenta nuevamente.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Asistente de Turnos</h1>
        <p className={styles.subtitle}>
          Chatea con el asistente para gestionar tus turnos
        </p>
      </div>

      <div className={styles.chatContainer}>
        <div className={styles.messages}>
          {messages.map((message, index) => (
            <div
              key={index}
              className={`${styles.message} ${
                message.role === "user" ? styles.userMessage : styles.assistantMessage
              }`}
            >
              <div className={styles.messageContent}>{message.content}</div>
            </div>
          ))}
          {isLoading && (
            <div className={`${styles.message} ${styles.assistantMessage}`}>
              <div className={styles.messageContent}>
                <span className={styles.typing}>Escribiendo...</span>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu mensaje aquí..."
            className={styles.input}
            disabled={isLoading}
          />
          <button
            type="submit"
            className={styles.button}
            disabled={isLoading || !input.trim()}
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}
