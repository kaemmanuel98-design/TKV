import React from 'react';
import { useTranslation } from 'react-i18next';
import { HIGHLIGHT_COLORS } from '../../data/bible/highlightColors';
import { getHighlightColorLabel } from '../../lib/bible/highlightLabels';

export default function HighlightColorPicker({
  activeColor,
  customLabels,
  onPick,
  compact = false,
  showRemove = true,
}) {
  const { t } = useTranslation();

  return (
    <div className={`bible-highlight-picker ${compact ? 'bible-highlight-picker--compact' : ''}`} role="group" aria-label={t('bible_highlight_choose', { defaultValue: 'Choisir une couleur' })}>
      {HIGHLIGHT_COLORS.map((color) => {
        const label = getHighlightColorLabel(color.id, t, customLabels);
        const isActive = activeColor === color.id;
        return (
          <button
            key={color.id}
            type="button"
            className={`bible-highlight-swatch ${isActive ? 'is-active' : ''}`}
            style={{ '--swatch': color.swatch }}
            onClick={() => onPick(isActive ? null : color.id)}
            title={label}
            aria-label={label}
            aria-pressed={isActive}
          />
        );
      })}
      {showRemove && activeColor ? (
        <button
          type="button"
          className="btn btn-ghost btn-sm bible-highlight-remove"
          onClick={() => onPick(null)}
        >
          {t('bible_highlight_remove', { defaultValue: 'Retirer' })}
        </button>
      ) : null}
    </div>
  );
}
