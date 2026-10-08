const JobRequisition = require('../models/JobRequisition');
const CandidatePipeline = require('../models/CandidatePipeline');
const User = require('../models/User');

// Create Requisition
exports.createRequisition = async (req, res) => {
  try {
    const {
      title,
      code,
      department,
      hiringManager,
      hiringManagerName,
      leadRecruiter,
      recruiters,
      targetHires,
      salaryRange,
      experienceYears,
      location,
      employmentType,
      startDate,
      targetCloseDate,
      priority,
      status,
      description
    } = req.body;

    const existingCode = await JobRequisition.findOne({ code: code.toUpperCase() });
    if (existingCode) {
      return res.status(400).json({ message: 'Requisition code already exists' });
    }

    const isValidObjectId = (id) => typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/);

    const requisition = new JobRequisition({
      title,
      code: code.toUpperCase(),
      department: department || null,
      hiringManager: isValidObjectId(hiringManager) ? hiringManager : null,
      hiringManagerName: hiringManagerName || (!isValidObjectId(hiringManager) ? hiringManager : null),
      leadRecruiter: isValidObjectId(leadRecruiter) ? leadRecruiter : req.user.id,
      recruiters: recruiters || [req.user.id],
      targetHires: targetHires || 1,
      salaryRange,
      experienceYears,
      location,
      employmentType,
      startDate: startDate || Date.now(),
      targetCloseDate,
      priority,
      status,
      description
    });

    await requisition.save();
    res.status(201).json(requisition);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get All Requisitions
exports.getRequisitions = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    const requisitions = await JobRequisition.find(query)
      .populate('hiringManager', 'firstName lastName email profileImage')
      .populate('leadRecruiter', 'firstName lastName email profileImage')
      .populate('recruiters', 'firstName lastName email profileImage')
      .populate('department', 'name')
      .sort({ createdAt: -1 });

    res.json(requisitions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get Requisition by ID
exports.getRequisitionById = async (req, res) => {
  try {
    const requisition = await JobRequisition.findById(req.params.id)
      .populate('hiringManager', 'firstName lastName email profileImage')
      .populate('leadRecruiter', 'firstName lastName email profileImage')
      .populate('recruiters', 'firstName lastName email profileImage')
      .populate('department', 'name');

    if (!requisition) {
      return res.status(404).json({ message: 'Requisition not found' });
    }

    res.json(requisition);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update Requisition
exports.updateRequisition = async (req, res) => {
  try {
    const requisition = await JobRequisition.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    )
      .populate('hiringManager', 'firstName lastName email profileImage')
      .populate('leadRecruiter', 'firstName lastName email profileImage')
      .populate('recruiters', 'firstName lastName email profileImage')
      .populate('department', 'name');

    if (!requisition) {
      return res.status(404).json({ message: 'Requisition not found' });
    }

    res.json(requisition);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete Requisition
exports.deleteRequisition = async (req, res) => {
  try {
    const requisition = await JobRequisition.findById(req.params.id);
    if (!requisition) {
      return res.status(404).json({ message: 'Requisition not found' });
    }

    await CandidatePipeline.deleteMany({ requisition: req.params.id });
    await requisition.deleteOne();

    res.json({ message: 'Requisition and linked candidate records removed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get Dashboard Stats for Recruitment
exports.getDashboardStats = async (req, res) => {
  try {
    const totalRequisitions = await JobRequisition.countDocuments({});
    const activeRequisitions = await JobRequisition.countDocuments({ status: 'Active' });
    const filledRequisitions = await JobRequisition.countDocuments({ status: 'Filled' });
    
    const totalCandidates = await CandidatePipeline.countDocuments({});
    const hiredCandidates = await CandidatePipeline.countDocuments({ stage: 'Hired' });
    const inInterviewProcess = await CandidatePipeline.countDocuments({
      stage: { $in: ['Technical Interview', 'Managerial Round', 'HR Round', 'Offer Issued'] }
    });

    const stageBreakdown = await CandidatePipeline.aggregate([
      { $group: { _id: '$stage', count: { $sum: 1 } } }
    ]);

    res.json({
      totalRequisitions,
      activeRequisitions,
      filledRequisitions,
      totalCandidates,
      hiredCandidates,
      inInterviewProcess,
      stageBreakdown
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get Employee Dashboard for Recruiter (my assigned candidates)
exports.getEmployeeDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const assignedCandidates = await CandidatePipeline.find({ assignedRecruiter: userId })
      .populate('requisition', 'title code status')
      .populate('assignedInterviewer', 'firstName lastName email profileImage')
      .sort({ updatedAt: -1 });

    const pendingInterviews = assignedCandidates.filter(c => 
      ['Technical Interview', 'Managerial Round', 'HR Round'].includes(c.stage)
    );

    res.json({
      totalAssigned: assignedCandidates.length,
      pendingInterviews: pendingInterviews.length,
      candidates: assignedCandidates
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
