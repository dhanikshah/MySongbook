import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = path.join(__dirname, '../../uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

class StorageService {
  /**
   * Save uploaded file and return URL
   */
  async saveFile(file: Express.Multer.File): Promise<string | null> {
    try {
      const fileExtension = path.extname(file.originalname);
      const fileName = `${randomUUID()}${fileExtension}`;
      const filePath = path.join(UPLOAD_DIR, fileName);

      // Move file from temp location to uploads directory
      fs.renameSync(file.path, filePath);

      // Return relative URL
      return `/uploads/${fileName}`;
    } catch (error) {
      console.error('Error saving file:', error);
      return null;
    }
  }

  /**
   * Delete file
   */
  async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      const fileName = path.basename(fileUrl);
      const filePath = path.join(UPLOAD_DIR, fileName);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }
}

export const storageService = new StorageService();

