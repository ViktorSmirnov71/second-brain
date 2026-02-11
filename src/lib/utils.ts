import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Strip markdown formatting for clean TTS speech output.
 * Removes bold, italic, headings, code blocks, links, bullets, etc.
 * while preserving the readable text content.
 */
export function stripMarkdownForSpeech(text: string): string {
  return (
    text
      // Remove code blocks (```...```)
      .replace(/```[\s\S]*?```/g, "")
      // Remove inline code (`...`)
      .replace(/`([^`]*)`/g, "$1")
      // Remove headings (## ...)
      .replace(/^#{1,6}\s+/gm, "")
      // Remove bold/italic (***text***, **text**, *text*, ___text___, __text__, _text_)
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
      .replace(/_{1,3}([^_]+)_{1,3}/g, "$1")
      // Remove links [text](url) → text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Remove images ![alt](url)
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
      // Remove bullet points and numbered lists
      .replace(/^[\s]*[-*+]\s+/gm, "")
      .replace(/^[\s]*\d+\.\s+/gm, "")
      // Remove horizontal rules
      .replace(/^[-*_]{3,}$/gm, "")
      // Remove blockquotes
      .replace(/^>\s+/gm, "")
      // Collapse multiple newlines into one
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}
