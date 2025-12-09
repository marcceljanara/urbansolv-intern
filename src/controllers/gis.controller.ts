import { Request, Response } from 'express';
import path from 'path';
import { GisService } from '../services/gis.service';
import { extractZip, findShapefile, validateShapefileComponents, cleanup } from '../utils/file';
import { parseShapefile, countByGeometryType } from '../utils/shapefile';

export class GisController {
  static async uploadShapefile(req: Request, res: Response): Promise<void> {
    let extractDir: string | null = null;
    let zipPath: string | null = null;

    try {
      // Check if file exists
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
        return;
      }

      zipPath = req.file.path;
      console.log('Received file:', zipPath);

      // Extract ZIP
      extractDir = path.join(path.dirname(zipPath), `extracted-${Date.now()}`);
      await extractZip(zipPath, extractDir);
      console.log('Extracted to:', extractDir);

      // Find shapefile
      const shpPath = findShapefile(extractDir);
      if (!shpPath) {
        res.status(400).json({
          success: false,
          message: 'No .shp file found in ZIP'
        });
        return;
      }

      // Validate components
      if (!validateShapefileComponents(shpPath)) {
        res.status(400).json({
          success: false,
          message: 'Invalid shapefile: missing required components (.shp, .shx, .dbf)'
        });
        return;
      }

      const features = await parseShapefile(shpPath);

      if (features.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No features found in shapefile'
        });
        return;
      }
      const insertedCount = await GisService.saveFeatures(features);
      const geometryStats = countByGeometryType(features);

      res.status(201).json({
        success: true,
        message: 'Shapefile uploaded and processed successfully',
        data: {
          featuresCount: insertedCount,
          geometryTypes: geometryStats
        }
      });

    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process shapefile',
        error: error.message
      });
    } finally {
      // Cleanup temporary files
      const pathsToClean: string[] = [];
      if (zipPath) pathsToClean.push(zipPath);
      if (extractDir) pathsToClean.push(extractDir);
      
      await cleanup(pathsToClean);
    }
  }

  static async getAllFeatures(req: Request, res: Response): Promise<void> {
    try {
      const featureCollection = await GisService.getAllFeatures();

      res.status(200).json({
        success: true,
        data: featureCollection
      });
    } catch (error: any) {
      console.error('Get features error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve features',
        error: error.message
      });
    }
  }

  static async getFeatureById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid feature ID'
        });
        return;
      }

      const feature = await GisService.getFeatureById(id);

      if (!feature) {
        res.status(404).json({
          success: false,
          message: 'Feature not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: feature
      });
    } catch (error: any) {
      console.error('Get feature error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve feature',
        error: error.message
      });
    }
  }

  static async updateFeature(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid feature ID'
        });
        return;
      }

      const { properties, geometry } = req.body;

      if (!properties && !geometry) {
        res.status(400).json({
          success: false,
          message: 'No update data provided (properties or geometry required)'
        });
        return;
      }

      // Partial update - merge with existing data
      const updatedFeature = await GisService.updateFeature(id, properties, geometry);

      if (!updatedFeature) {
        res.status(404).json({
          success: false,
          message: 'Feature not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Feature updated successfully (partial update)',
        data: updatedFeature
      });
    } catch (error: any) {
      console.error('Update feature error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update feature',
        error: error.message
      });
    }
  }

  static async deleteFeature(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid feature ID'
        });
        return;
      }

      const deleted = await GisService.deleteFeature(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Feature not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Feature deleted successfully'
      });
    } catch (error: any) {
      console.error('Delete feature error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete feature',
        error: error.message
      });
    }
  }

  static async deleteAllFeatures(req: Request, res: Response): Promise<void> {
    try {
      const deletedCount = await GisService.deleteAllFeatures();

      res.status(200).json({
        success: true,
        message: 'All features deleted successfully',
        data: {
          deletedCount
        }
      });
    } catch (error: any) {
      console.error('Delete all features error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete all features',
        error: error.message
      });
    }
  }

  static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const count = await GisService.getFeatureCount();

      res.status(200).json({
        success: true,
        data: {
          totalFeatures: count
        }
      });
    } catch (error: any) {
      console.error('Get stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve statistics',
        error: error.message
      });
    }
  }
}