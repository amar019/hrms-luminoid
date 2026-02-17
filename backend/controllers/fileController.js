const File = require('../models/File');
const DocumentAcknowledgment = require('../models/DocumentAcknowledgment');
const s3 = require('../config/s3');

const getFiles = async (req, res) => {
  try {
    const { type } = req.query;
    const query = {};

    if (type) query.type = type;

    if (req.user.role === 'EMPLOYEE') {
      query.$or = [
        { type: 'ORGANIZATION', isPublic: true },
        { type: 'EMPLOYEE', targetUserId: req.user.id }
      ];
    }

    const files = await File.find(query)
      .populate('uploadedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    // Get acknowledgment status for current user
    const fileIds = files.map(f => f._id);
    const acknowledgments = await DocumentAcknowledgment.find({
      fileId: { $in: fileIds },
      userId: req.user.id
    });

    const acknowledgedFileIds = new Set(acknowledgments.map(a => a.fileId.toString()));

    const filesWithAckStatus = files.map(file => ({
      ...file.toObject(),
      isAcknowledged: acknowledgedFileIds.has(file._id.toString())
    }));

    res.json(filesWithAckStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!req.body.type) {
      return res.status(400).json({ message: 'File type is required' });
    }

    const s3Key = `files/${Date.now()}-${req.file.originalname}`;
    
    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: s3Key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype
    };

    const s3Result = await s3.upload(uploadParams).promise();

    const file = new File({
      name: req.body.name || req.file.originalname,
      originalName: req.file.originalname,
      s3Key: s3Key,
      s3Url: s3Result.Location,
      size: req.file.size,
      mimeType: req.file.mimetype,
      type: req.body.type,
      category: req.body.category,
      uploadedBy: req.user.id,
      targetUserId: req.body.targetUserId,
      isPublic: req.body.isPublic === 'true',
      description: req.body.description,
      requiresAcknowledgment: req.body.requiresAcknowledgment === 'true'
    });

    await file.save();
    res.status(201).json(file);
  } catch (error) {
    console.error('File upload error:', error);
    res.status(400).json({ message: error.message });
  }
};

const downloadFile = async (req, res) => {
  try {
    // console.log('Download request for file ID:', req.params.id);
    
    const file = await File.findById(req.params.id);
    if (!file) {
      // console.log('File not found:', req.params.id);
      return res.status(404).json({ message: 'File not found' });
    }

    // console.log('File found:', file.name, 'S3 Key:', file.s3Key);

    if (req.user.role === 'EMPLOYEE' && file.type === 'EMPLOYEE' && 
        file.targetUserId.toString() !== req.user.id) {
      // console.log('Access denied for user:', req.user.id, 'file target:', file.targetUserId);
      return res.status(403).json({ message: 'Access denied' });
    }

    const downloadParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: file.s3Key,
      Expires: 3600
    };

    // console.log('Generating signed URL with params:', downloadParams);

    try {
      const signedUrl = s3.getSignedUrl('getObject', downloadParams);
      // console.log('Signed URL generated successfully');
      
      res.json({ downloadUrl: signedUrl, fileName: file.originalName });
    } catch (s3Error) {
      console.error('S3 signed URL error:', s3Error);
      return res.status(500).json({ message: 'Error generating download URL', error: s3Error.message });
    }
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });

    const deleteParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: file.s3Key
    };

    await s3.deleteObject(deleteParams).promise();
    await File.findByIdAndDelete(req.params.id);
    res.json({ message: 'File deleted' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const acknowledgeDocument = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { comments } = req.body;

    // Check if file exists and user has access
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check access permissions
    if (req.user.role === 'EMPLOYEE') {
      if (file.type === 'ORGANIZATION' && !file.isPublic) {
        return res.status(403).json({ message: 'Access denied' });
      }
      if (file.type === 'EMPLOYEE' && file.targetUserId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Create or update acknowledgment
    const acknowledgment = await DocumentAcknowledgment.findOneAndUpdate(
      { fileId, userId: req.user.id },
      { comments, acknowledgedAt: new Date() },
      { upsert: true, new: true }
    );

    res.json({ message: 'Document acknowledged successfully', acknowledgment });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Document already acknowledged' });
    }
    res.status(500).json({ message: error.message });
  }
};

const getAcknowledgments = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const acknowledgments = await DocumentAcknowledgment.find({ fileId })
      .populate('userId', 'firstName lastName email')
      .sort({ acknowledgedAt: -1 });

    res.json(acknowledgments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getFiles,
  uploadFile,
  downloadFile,
  deleteFile,
  acknowledgeDocument,
  getAcknowledgments
};