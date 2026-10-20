const multer = require('multer');
const { uploadBuffer, uploadMultiple } = require('../../services/storageService');

// Memory storage for incoming multipart requests
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB per file
});

const uploadSingle = upload.single('image');
const uploadFields = upload.array('images', 10);

// @route POST /api/admin/upload/single
const handleSingleUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('No file uploaded');
    }

    const folder = req.query.folder || 'products';
    const result = await uploadBuffer(req.file.buffer, folder, req.file.originalname);

    res.json({
      url: result.url,
      publicId: result.publicId,
      message: 'Image uploaded successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/admin/upload/multiple
const handleMultipleUpload = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      res.status(400);
      throw new Error('No files uploaded');
    }

    const folder = req.query.folder || 'products';
    const results = await uploadMultiple(req.files, folder);

    res.json({
      images: results,
      message: `${results.length} image(s) uploaded successfully`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  upload,
  uploadSingle,
  uploadFields,
  handleSingleUpload,
  handleMultipleUpload,
};
