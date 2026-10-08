const RecruiterDailyLog = require('../models/RecruiterDailyLog');

exports.createDailyUpdate = async (req, res) => {
  try {
    const {
      requisition,
      profilesSourcedCount,
      callsConductedCount,
      interviewsScheduledCount,
      offersExtendedCount,
      notesWorkedOn,
      blockers,
      highlights,
      date
    } = req.body;

    const dailyLog = new RecruiterDailyLog({
      recruiter: req.user.id,
      date: date || Date.now(),
      requisition: requisition || null,
      profilesSourcedCount: profilesSourcedCount || 0,
      callsConductedCount: callsConductedCount || 0,
      interviewsScheduledCount: interviewsScheduledCount || 0,
      offersExtendedCount: offersExtendedCount || 0,
      notesWorkedOn,
      blockers,
      highlights
    });

    await dailyLog.save();

    const populatedLog = await RecruiterDailyLog.findById(dailyLog._id)
      .populate('recruiter', 'firstName lastName email profileImage')
      .populate('requisition', 'title code');

    res.status(201).json(populatedLog);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDailyUpdates = async (req, res) => {
  try {
    const { recruiterId, startDate, endDate } = req.query;
    let query = {};

    if (recruiterId) {
      query.recruiter = recruiterId;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const logs = await RecruiterDailyLog.find(query)
      .populate('recruiter', 'firstName lastName email profileImage')
      .populate('requisition', 'title code')
      .sort({ date: -1 });

    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteDailyUpdate = async (req, res) => {
  try {
    const log = await RecruiterDailyLog.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ message: 'Daily log not found' });
    }

    if (log.recruiter.toString() !== req.user.id && !['ADMIN', 'HR'].includes(req.user.role)) {
      return res.status(430).json({ message: 'Unauthorized to delete this log' });
    }

    await log.deleteOne();
    res.json({ message: 'Daily log deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
