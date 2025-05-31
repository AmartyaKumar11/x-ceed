import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { promises as fsPromises } from 'fs';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// Ensure upload directory exists
export async function ensureUploadDir() {
  try {
    await fsPromises.access(UPLOAD_DIR);
  } catch (error) {
    await fsPromises.mkdir(UPLOAD_DIR, { recursive: true });
  }
  
  // Create subdirectories for different file types
  const subdirs = ['resumes', 'profile-images', 'job-descriptions'];
  for (const dir of subdirs) {
    const fullPath = path.join(UPLOAD_DIR, dir);
    try {
      await fsPromises.access(fullPath);
    } catch (error) {
      await fsPromises.mkdir(fullPath, { recursive: true });
    }
  }
}

/**
 * Validates a file based on type and size
 * @param {File} file - The file to validate
 * @param {Array<string>} allowedTypes - Array of allowed MIME types
 * @param {number} maxSize - Maximum file size in bytes
 * @returns {Object} - Validation result with isValid and error properties
 */
export function validateFile(file, allowedTypes, maxSize = MAX_FILE_SIZE) {
  if (!file) {
    return { isValid: false, error: 'No file provided' };
  }

  if (file.size > maxSize) {
    return { isValid: false, error: `File size exceeds the limit (${maxSize / (1024 * 1024)}MB)` };
  }

  if (!allowedTypes.includes(file.mimetype)) {
    return { isValid: false, error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` };
  }

  return { isValid: true };
}

/**
 * Saves a file to the server
 * @param {File} file - The file to save
 * @param {string} subdir - The subdirectory to save the file to (e.g., 'resumes')
 * @returns {Promise<string>} - The path to the saved file relative to the public directory
 */
export async function saveFile(file, subdir) {
  await ensureUploadDir();
  
  const targetDir = path.join(UPLOAD_DIR, subdir);
  
  // Generate a unique filename
  const fileExt = path.extname(file.originalFilename || '');
  const fileName = `${uuidv4()}${fileExt}`;
  const filePath = path.join(targetDir, fileName);
  
  // Get the file buffer
  const data = await fs.promises.readFile(file.filepath);
  
  // Write the file
  await fs.promises.writeFile(filePath, data);
  
  // Return the path relative to the public directory
  return `/uploads/${subdir}/${fileName}`;
}

/**
 * Deletes a file from the server
 * @param {string} filePath - The path to the file to delete
 * @returns {Promise<boolean>} - Whether the file was successfully deleted
 */
export async function deleteFile(filePath) {
  try {
    // Extract the file path relative to the public directory
    const relativePath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    const fullPath = path.join(process.cwd(), 'public', relativePath);
    
    await fs.promises.unlink(fullPath);
    return true;
  } catch (error) {
    console.error('Failed to delete file:', error);
    return false;
  }
}