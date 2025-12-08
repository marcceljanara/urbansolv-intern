import express from 'express';
import { GisController } from '../controllers/gis.controller';
import upload from '../middleware/upload';

const router = express.Router();

router.post('/upload', upload.single('file'), GisController.uploadShapefile);
router.get('/features', GisController.getAllFeatures);
router.get('/features/:id', GisController.getFeatureById);
router.put('/features/:id', GisController.updateFeature);
router.delete('/features/:id', GisController.deleteFeature);
router.delete('/features', GisController.deleteAllFeatures);
router.get('/stats', GisController.getStats);

export default router;