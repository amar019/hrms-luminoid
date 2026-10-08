const CandidatePipeline = require('../models/CandidatePipeline');
const JobRequisition = require('../models/JobRequisition');

// Create Candidate Application
exports.createCandidate = async (req, res) => {
  try {
    const {
      requisition,
      fullName,
      email,
      phone,
      resumeUrl,
      portfolioUrl,
      currentCompany,
      currentNoticePeriod,
      expectedSalary,
      assignedRecruiter,
      assignedInterviewer,
      stage,
      priority,
      notes
    } = req.body;

    const candidate = new CandidatePipeline({
      requisition: requisition || null,
      fullName,
      email,
      phone,
      resumeUrl,
      portfolioUrl,
      currentCompany,
      currentNoticePeriod,
      expectedSalary,
      assignedRecruiter: assignedRecruiter || req.user.id,
      assignedInterviewer: assignedInterviewer || null,
      stage: stage || 'Sourced',
      priority: priority || 'Medium',
      notes
    });

    await candidate.save();

    const populatedCandidate = await CandidatePipeline.findById(candidate._id)
      .populate('requisition', 'title code status')
      .populate('assignedRecruiter', 'firstName lastName email profileImage')
      .populate('assignedInterviewer', 'firstName lastName email profileImage');

    res.status(201).json(populatedCandidate);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get Candidates (by Requisition or all)
exports.getCandidates = async (req, res) => {
  try {
    const { requisitionId, stage, search, assignedRecruiter } = req.query;
    let query = {};

    if (requisitionId && requisitionId !== 'all') {
      if (requisitionId === 'general') {
        query.$or = [{ requisition: null }, { requisition: { $exists: false } }];
      } else {
        query.requisition = requisitionId;
      }
    }

    if (stage && stage !== 'All') {
      query.stage = stage;
    }

    if (assignedRecruiter) {
      query.assignedRecruiter = assignedRecruiter;
    }

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { candidateId: { $regex: search, $options: 'i' } },
        { currentCompany: { $regex: search, $options: 'i' } }
      ];
    }

    const candidates = await CandidatePipeline.find(query)
      .populate('requisition', 'title code status')
      .populate('assignedRecruiter', 'firstName lastName email profileImage')
      .populate('assignedInterviewer', 'firstName lastName email profileImage')
      .populate('feedback.interviewer', 'firstName lastName email profileImage')
      .populate('comments.author', 'firstName lastName email profileImage')
      .sort({ updatedAt: -1 });

    res.json(candidates);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get Candidate by ID
exports.getCandidateById = async (req, res) => {
  try {
    const candidate = await CandidatePipeline.findById(req.params.id)
      .populate('requisition', 'title code status')
      .populate('assignedRecruiter', 'firstName lastName email profileImage')
      .populate('assignedInterviewer', 'firstName lastName email profileImage')
      .populate('feedback.interviewer', 'firstName lastName email profileImage')
      .populate('comments.author', 'firstName lastName email profileImage');

    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    res.json(candidate);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update Candidate
exports.updateCandidate = async (req, res) => {
  try {
    const candidate = await CandidatePipeline.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    )
      .populate('requisition', 'title code status')
      .populate('assignedRecruiter', 'firstName lastName email profileImage')
      .populate('assignedInterviewer', 'firstName lastName email profileImage')
      .populate('feedback.interviewer', 'firstName lastName email profileImage')
      .populate('comments.author', 'firstName lastName email profileImage');

    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    // If candidate status updated to 'Hired', auto increment fulfilledHires in JobRequisition
    if (req.body.stage === 'Hired' && candidate.requisition) {
      const reqId = typeof candidate.requisition === 'object' ? candidate.requisition._id : candidate.requisition;
      const hiredCount = await CandidatePipeline.countDocuments({ requisition: reqId, stage: 'Hired' });
      await JobRequisition.findByIdAndUpdate(reqId, { fulfilledHires: hiredCount });
    }

    res.json(candidate);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update Stage Quick Endpoint
exports.updateCandidateStage = async (req, res) => {
  try {
    const { stage } = req.body;
    const candidate = await CandidatePipeline.findByIdAndUpdate(
      req.params.id,
      { stage },
      { new: true }
    )
      .populate('requisition', 'title code status')
      .populate('assignedRecruiter', 'firstName lastName email profileImage')
      .populate('assignedInterviewer', 'firstName lastName email profileImage');

    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    if (stage === 'Hired' && candidate.requisition) {
      const reqId = typeof candidate.requisition === 'object' ? candidate.requisition._id : candidate.requisition;
      const hiredCount = await CandidatePipeline.countDocuments({ requisition: reqId, stage: 'Hired' });
      await JobRequisition.findByIdAndUpdate(reqId, { fulfilledHires: hiredCount });
    }

    res.json(candidate);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add Feedback
exports.addFeedback = async (req, res) => {
  try {
    const { roundName, rating, strengths, concerns, decision } = req.body;
    const candidate = await CandidatePipeline.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    candidate.feedback.push({
      interviewer: req.user.id,
      roundName,
      rating,
      strengths,
      concerns,
      decision
    });

    await candidate.save();

    const updatedCandidate = await CandidatePipeline.findById(candidate._id)
      .populate('feedback.interviewer', 'firstName lastName email profileImage');

    res.json(updatedCandidate);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add Comment
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const candidate = await CandidatePipeline.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    candidate.comments.push({
      author: req.user.id,
      text
    });

    await candidate.save();

    const updatedCandidate = await CandidatePipeline.findById(candidate._id)
      .populate('comments.author', 'firstName lastName email profileImage');

    res.json(updatedCandidate);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete Candidate
exports.deleteCandidate = async (req, res) => {
  try {
    const candidate = await CandidatePipeline.findByIdAndDelete(req.params.id);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    res.json({ message: 'Candidate application deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
