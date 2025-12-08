export interface GeoJSONGeometry {
  type: 'Point' | 'MultiPoint' | 'LineString' | 'MultiLineString' | 'Polygon' | 'MultiPolygon' | 'GeometryCollection';
  coordinates?: any;
  geometries?: GeoJSONGeometry[];
}

export interface GeoJSONFeature {
  type: 'Feature';
  id?: number | string;
  properties: Record<string, any>;
  geometry: GeoJSONGeometry;
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export interface DatabaseFeature {
  id: number;
  properties: Record<string, any>;
  geometry: any;
  created_at?: Date;
  updated_at?: Date;
}