/** Variantes de requête pour élargir la recherche d'adresse. */
export function buildQueryVariants(query) {
  const q = query.trim().replace(/\s+/g, ' ');
  if (!q) return [];

  const variants = new Set([q]);

  const simplified = q
    .replace(/[^\p{L}\p{N}\s,.'-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (simplified) variants.add(simplified);

  const withoutNumber = q.replace(/^\d+[\s,.-]*/, '').trim();
  if (withoutNumber.length >= 3) variants.add(withoutNumber);

  const parts = q
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    variants.add(parts.slice(-2).join(', '));
    variants.add(parts[parts.length - 1]);
  }
  if (parts.length >= 3) {
    variants.add(parts.slice(-3).join(', '));
  }

  return [...variants].filter((v) => v.length >= 3);
}

export function mergeUniqueResults(existing, incoming) {
  const map = new Map();
  for (const item of [...existing, ...incoming]) {
    if (!item?.latitude || !item?.longitude) continue;
    const key = `${item.latitude.toFixed(5)},${item.longitude.toFixed(5)}`;
    if (!map.has(key)) map.set(key, item);
  }
  return [...map.values()];
}
