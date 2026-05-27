import React from 'react';

/**
 * Transforme le texte brut d'un chapitre en blocs typographiques.
 */
export function formatBookContent(content) {
  if (!content) return null;

  const blocks = content.split('\n');
  const elements = [];
  let listItems = [];
  let key = 0;

  const flushList = () => {
    if (!listItems.length) return;
    elements.push(
      <ul key={`list-${key++}`} className="book-list">
        {listItems.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  for (const line of blocks) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      continue;
    }

    if (/^[-•]\s+/.test(trimmed) || /^\s+•\s+/.test(trimmed)) {
      listItems.push(trimmed.replace(/^[-•]\s+/, '').replace(/^\s+•\s+/, ''));
      continue;
    }

    flushList();

    if (/^«.+»\s*—/.test(trimmed) || /^".+"\s*—/.test(trimmed)) {
      elements.push(
        <blockquote key={key++} className="book-quote">
          {trimmed}
        </blockquote>,
      );
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed) && trimmed.length < 120) {
      elements.push(
        <h4 key={key++} className="book-section-title">
          {trimmed}
        </h4>,
      );
      continue;
    }

    elements.push(<p key={key++}>{trimmed}</p>);
  }

  flushList();
  return elements;
}
