import db from '../config/db';
import { GeoJSONFeature, GeoJSONFeatureCollection } from '../types/geojson';
import { toFeatureCollection } from '../utils/geojson';

export class GisService {
  static async saveFeatures(features: GeoJSONFeature[]): Promise<number> {
    const client = await db.connect();
    
    try {
      await client.query('BEGIN');
      
      let insertedCount = 0;

      for (const feature of features) {
        const properties = JSON.stringify(feature.properties);
        const geometryGeoJSON = JSON.stringify(feature.geometry);

        // Insert with PostGIS ST_GeomFromGeoJSON and ST_SetSRID
        const query = `
          INSERT INTO gis_features (properties, geometry)
          VALUES ($1, ST_SetSRID(ST_GeomFromGeoJSON($2), 4326))
        `;

        await client.query(query, [properties, geometryGeoJSON]);
        insertedCount++;
      }

      await client.query('COMMIT');
      
      console.log(`Inserted ${insertedCount} features into database`);
      
      return insertedCount;
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Failed to save features: ${error}`);
    } finally {
      client.release();
    }
  }

  static async getAllFeatures(): Promise<GeoJSONFeatureCollection> {
    try {
      // Use ST_AsGeoJSON to convert PostGIS geometry to GeoJSON
      const query = `
        SELECT 
          id,
          properties,
          ST_AsGeoJSON(geometry)::json as geometry,
          created_at,
          updated_at
        FROM gis_features
        ORDER BY id ASC
      `;

      const result = await db.query(query);
      
      return toFeatureCollection(result.rows);
    } catch (error) {
      throw new Error(`Failed to get features: ${error}`);
    }
  }

  static async getFeatureById(id: number): Promise<GeoJSONFeature | null> {
    try {
      const query = `
        SELECT 
          id,
          properties,
          ST_AsGeoJSON(geometry)::json as geometry
        FROM gis_features
        WHERE id = $1
      `;

      const result = await db.query(query, [id]);

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        type: 'Feature',
        id: row.id,
        properties: row.properties,
        geometry: row.geometry
      };
    } catch (error) {
      throw new Error(`Failed to get feature: ${error}`);
    }
  }

  static async updateFeature(
    id: number,
    properties?: Record<string, any>,
    geometry?: any
  ): Promise<GeoJSONFeature | null> {
    try {
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (properties) {
        updates.push(`properties = $${paramIndex}`);
        values.push(JSON.stringify(properties));
        paramIndex++;
      }

      if (geometry) {
        updates.push(`geometry = ST_SetSRID(ST_GeomFromGeoJSON($${paramIndex}), 4326)`);
        values.push(JSON.stringify(geometry));
        paramIndex++;
      }

      if (updates.length === 0) {
        throw new Error('No updates provided');
      }

      updates.push(`updated_at = NOW()`);
      values.push(id);

      const query = `
        UPDATE gis_features
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING 
          id,
          properties,
          ST_AsGeoJSON(geometry)::json as geometry
      `;

      const result = await db.query(query, values);

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        type: 'Feature',
        id: row.id,
        properties: row.properties,
        geometry: row.geometry
      };
    } catch (error) {
      throw new Error(`Failed to update feature: ${error}`);
    }
  }

  static async deleteFeature(id: number): Promise<boolean> {
    try {
      const query = 'DELETE FROM gis_features WHERE id = $1';
      const result = await db.query(query, [id]);

      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      throw new Error(`Failed to delete feature: ${error}`);
    }
  }

  static async deleteAllFeatures(): Promise<number> {
    try {
      const result = await db.query('DELETE FROM gis_features');
      return result.rowCount || 0;
    } catch (error) {
      throw new Error(`Failed to delete all features: ${error}`);
    }
  }

  static async getFeatureCount(): Promise<number> {
    try {
      const result = await db.query('SELECT COUNT(*) as count FROM gis_features');
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw new Error(`Failed to get feature count: ${error}`);
    }
  }
}