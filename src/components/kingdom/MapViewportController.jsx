import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

/** Anime la carte vers un centre / zoom (niveaux Royaume → ville). */
export default function MapViewportController({ center, zoom, enabled = true }) {
  const map = useMap();

  useEffect(() => {
    if (!enabled || !center || zoom == null) return;
    map.flyTo(center, zoom, { duration: 1.1, easeLinearity: 0.25 });
  }, [center, zoom, enabled, map]);

  return null;
}
