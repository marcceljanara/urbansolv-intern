import fs from 'fs';
import path from 'path';
import unzipper from 'unzipper';
import { rimraf } from 'rimraf';

export async function extractZip(zipPath: string, extractTo: string): Promise<string> {
  try {
    // Create extraction directory
    if (!fs.existsSync(extractTo)) {
      fs.mkdirSync(extractTo, { recursive: true });
    }

    // Extract ZIP
    await fs.createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: extractTo }))
      .promise();

    return extractTo;
  } catch (error) {
    throw new Error(`Failed to extract ZIP: ${error}`);
  }
}

export function findShapefile(dir: string): string | null {
  const files = fs.readdirSync(dir);
  const shpFile = files.find(file => path.extname(file).toLowerCase() === '.shp');
  
  if (!shpFile) return null;
  
  return path.join(dir, shpFile);
}

export function validateShapefileComponents(shpPath: string): boolean {
  const dir = path.dirname(shpPath);
  const baseName = path.basename(shpPath, '.shp');
  
  const requiredExtensions = ['.shp', '.shx', '.dbf'];
  
  for (const ext of requiredExtensions) {
    const filePath = path.join(dir, baseName + ext);
    if (!fs.existsSync(filePath)) {
      console.error(`Missing required file: ${baseName}${ext}`);
      return false;
    }
  }
  
  return true;
}

export async function cleanup(paths: string[]): Promise<void> {
  for (const p of paths) {
    try {
      if (fs.existsSync(p)) {
        const stat = fs.statSync(p);
        if (stat.isDirectory()) {
          await rimraf(p);
        } else {
          fs.unlinkSync(p);
        }
      }
    } catch (error) {
      console.error(`Failed to cleanup ${p}:`, error);
    }
  }
}

export function getFileSizeMB(filePath: string): number {
  const stats = fs.statSync(filePath);
  return stats.size / (1024 * 1024);
}