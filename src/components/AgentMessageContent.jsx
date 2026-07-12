import React from 'react';

/** Rendu léger du texte Mim (paragraphes, gras, listes). */
export function renderAgentText(text) {
  if (!text) return null;

  const blocks = text.split(/\n{2,}/);

  return blocks.map((block, bi) => {
    const trimmed = block.trim();
    if (!trimmed) return null;

    const lines = trimmed.split('\n');
    const isList = lines.every((l) => /^\s*(\d+\.|[-•*])\s/.test(l) || !l.trim());

    if (isList && lines.length > 1) {
      return (
        <ul key={bi} className="agent-msg-list">
          {lines.map((line, li) => {
            const m = line.match(/^\s*(?:\d+\.|[-•*])\s+(.*)/);
            const content = m ? m[1] : line;
            return (
              <li key={li}>
                <InlineFormatted text={content} />
              </li>
            );
          })}
        </ul>
      );
    }

    return (
      <p key={bi}>
        <InlineFormatted text={trimmed.replace(/\n/g, ' ')} />
      </p>
    );
  });
}

function InlineFormatted({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export default function AgentMessageContent({ text }) {
  return <div className="agent-msg-formatted">{renderAgentText(text)}</div>;
}
