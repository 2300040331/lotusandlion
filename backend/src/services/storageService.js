const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const UPLOAD_ROOT = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_ROOT)) {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
}

/**
 * Upload single buffer to local storage
 */
const uploadBuffer = async (buffer, folder = 'general', originalName = '') => {
  const ext = originalName ? path.extname(originalName) || '.jpg' : '.jpg';
  const targetDir = path.join(UPLOAD_ROOT, folder);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
  const filePath = path.join(targetDir, filename);

  await fs.promises.writeFile(filePath, buffer);

  const relativeUrl = `/uploads/${folder}/${filename}`.replace(/\\/g, '/');
  return {
    url: relativeUrl,
    publicId: `${folder}/${filename}`,
    filename,
  };
};

/**
 * Upload multiple buffers to local storage
 */
const uploadMultiple = async (fileList, folder = 'general') => {
  const results = [];
  for (const item of fileList) {
    const buffer = Buffer.isBuffer(item) ? item : item.buffer;
    const originalName = item.originalname || '';
    const res = await uploadBuffer(buffer, folder, originalName);
    results.push(res);
  }
  return results;
};

/**
 * Delete a file from local storage
 */
const deleteFile = async (fileUrl) => {
  try {
    if (!fileUrl || !fileUrl.startsWith('/uploads/')) return false;
    const relativePath = fileUrl.replace(/^\/uploads\//, '');
    const fullPath = path.join(UPLOAD_ROOT, relativePath);
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
      return true;
    }
  } catch (err) {
    console.error('[StorageService] Error deleting file:', err);
  }
  return false;
};

module.exports = {
  uploadBuffer,
  uploadMultiple,
  deleteFile,
};
