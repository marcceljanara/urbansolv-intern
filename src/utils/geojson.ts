import { GeoJSONFeature, GeoJSONFeatureCollection, DatabaseFeature } from '../types/geojson';

export function toFeatureCollection(dbFeatures: DatabaseFeature[]): GeoJSONFeatureCollection {
  const features: GeoJSONFeature[] = dbFeatures.map(row => ({
    type: 'Feature',
    id: row.id,
    properties: row.properties,
    geometry: row.geometry // Already parsed as GeoJSON by ST_AsGeoJSON
  }));

  return {
    type: 'FeatureCollection',
    features
  };
}

export function isValidFeature(feature: any): feature is GeoJSONFeature {
  return (
    feature &&
    feature.type === 'Feature' &&
    feature.geometry &&
    feature.geometry.type &&
    typeof feature.properties === 'object'
  );
}

export function isValidFeatureCollection(data: any): data is GeoJSONFeatureCollection {
  return (
    data &&
    data.type === 'FeatureCollection' &&
    Array.isArray(data.features) &&
    data.features.every(isValidFeature)
  );
}

export function sanitizeProperties(properties: any): Record<string, any> {
  if (!properties || typeof properties !== 'object') {
    return {};
  }

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(properties)) {
    if (value !== null && value !== undefined) {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export function getBoundingBox(features: GeoJSONFeature[]): number[] | null {
  if (features.length === 0) return null;

  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  features.forEach(feature => {
    if (feature.geometry && feature.geometry.coordinates) {
      const coords = extractCoordinates(feature.geometry.coordinates);
      coords.forEach(([x, y]) => {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      });
    }
  });

  if (minX === Infinity) return null;

  return [minX, minY, maxX, maxY];
}

function extractCoordinates(coords: any): number[][] {
  if (!Array.isArray(coords)) return [];
  
  if (typeof coords[0] === 'number') {
    return [coords as number[]];
  }
  
  return coords.flatMap(extractCoordinates);
}