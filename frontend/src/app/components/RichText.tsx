"use client";

import React from "react";

interface RichTextProps {
  text?: string;
  boldText?: string;
  className?: string;
}

/**
 * RichText component для отображения текста с жирным выделением
 *
 * @param text - обычный текст
 * @param boldText - текст, который будет выделен жирным
 * @param className - дополнительные CSS классы
 *
 * Примеры использования:
 * 1. Только обычный текст: <RichText text="Simple text" />
 * 2. Текст с жирным: <RichText text="Pre-verified tenant pool — " boldText="credit-checked, referenced and rent-ready" />
 * 3. Только жирный текст: <RichText boldText="Important text" />
 */
const RichText: React.FC<RichTextProps> = ({
  text,
  boldText,
  className = "",
}) => {
  // Если нет ни text, ни boldText, возвращаем null
  if (!text && !boldText) {
    return null;
  }

  // Если есть только text, возвращаем обычный текст
  if (text && !boldText) {
    return <span className={className}>{text}</span>;
  }

  // Если есть только boldText, возвращаем жирный текст
  if (!text && boldText) {
    return <span className={`font-semibold ${className}`}>{boldText}</span>;
  }

  // Если есть и text, и boldText, комбинируем их
  return (
    <span className={className}>
      <span className="font-semibold">{boldText + " "}</span>
      {text}
    </span>
  );
};

export default RichText;
