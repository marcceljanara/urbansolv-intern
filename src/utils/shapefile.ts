import { open }from 'shapefile';
import { GeoJSONFeature } from '../types/geojson';

export async function parseShapefile(shpPath: string): Promise<GeoJSONFeature[]> {
  try {
    const features: GeoJSONFeature[] = [];
    
    // Open shapefile
    const source = await open(shpPath)
    
    // Read all features
    let result = await source.read();
    
    while (!result.done) {
      if (result.value) {
        // Ensure the feature has the correct structure
        const feature: GeoJSONFeature = {
          type: 'Feature',
          properties: result.value.properties || {},
          geometry: result.value.geometry
        };
        
        features.push(feature);
      }
      
      result = await source.read();
    }
    
    console.log(`Parsed ${features.length} features from shapefile`);
    
    return features;
  } catch (error) {
    throw new Error(`Failed to parse shapefile: ${error}`);
  }
}

export function isValidGeometry(geometry: any): boolean {
  if (!geometry || !geometry.type) return false;
  
  const validTypes = [
    'Point', 'MultiPoint', 
    'LineString', 'MultiLineString', 
    'Polygon', 'MultiPolygon', 
    'GeometryCollection'
  ];
  
  return validTypes.includes(geometry.type);
}

export function getGeometryTypes(features: GeoJSONFeature[]): string[] {
  const types = new Set<string>();
  
  features.forEach(feature => {
    if (feature.geometry && feature.geometry.type) {
      types.add(feature.geometry.type);
    }
  });
  
  return Array.from(types);
}

export function countByGeometryType(features: GeoJSONFeature[]): Record<string, number> {
  const counts: Record<string, number> = {};
  
  features.forEach(feature => {
    const type = feature.geometry?.type || 'Unknown';
    counts[type] = (counts[type] || 0) + 1;
  });
  
  return counts;
}