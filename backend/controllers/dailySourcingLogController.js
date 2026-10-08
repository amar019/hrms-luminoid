const DailySourcingLog = require('../models/DailySourcingLog');
const logger = require('../utils/logger');

// Create a new daily sourcing log entry
exports.createSourcingLog = async (req, res) => {
  try {
    const { clientName, position, location, submission, interview, description } = req.body;

    if (!clientName || !position || !location || description === undefined) {
      return res.status(400).json({
        message: 'Client Name, Position, Location, and Description are required.'
      });
    }

    const employeeName = req.user
      ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email
      : 'Unknown Employee';

    const empId = req.user?.employeeId || req.user?.customId || req.user?._id?.toString() || '';

    const newLog = new DailySourcingLog({
      employee: req.user.id || req.user._id,
      employeeName,
      employeeId: empId,
      clientName: clientName.trim(),
      position: position.trim(),
      location: location.trim(),
      submission: Number(submission) || 0,
      interview: Number(interview) || 0,
      description: description.trim()
    });

    await newLog.save();

    const populatedLog = await DailySourcingLog.findById(newLog._id)
      .populate('employee', 'firstName lastName email employeeId profileImage department designation');

    return res.status(201).json(populatedLog);
  } catch (err) {
    logger.error('Error creating daily sourcing log:', { error: err.message });
    return res.status(500).json({ message: err.message || 'Failed to create daily sourcing log' });
  }
};

// Get daily sourcing logs with filtering & search
exports.getSourcingLogs = async (req, res) => {
  try {
    const { employeeId, startDate, endDate, search, filterScope } = req.query;

    let query = {};

    // Filter by specific employee if provided or if employee wants to see only their logs
    if (filterScope === 'mine' || (req.user.role === 'EMPLOYEE' && filterScope !== 'all')) {
      query.employee = req.user.id || req.user._id;
    } else if (employeeId && employeeId !== 'all') {
      query.employee = employeeId;
    }

    // Date range filtering
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Search query across text fields
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { clientName: regex },
        { position: regex },
        { location: regex },
        { description: regex },
        { employeeName: regex }
      ];
    }

    const logs = await DailySourcingLog.find(query)
      .populate('employee', 'firstName lastName email employeeId profileImage department designation')
      .sort({ createdAt: -1 });

    return res.json(logs);
  } catch (err) {
    logger.error('Error fetching daily sourcing logs:', { error: err.message });
    return res.status(500).json({ message: err.message || 'Failed to fetch daily sourcing logs' });
  }
};

// Update an existing daily sourcing log
exports.updateSourcingLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { clientName, position, location, submission, interview, description } = req.body;

    const log = await DailySourcingLog.findById(id);
    if (!log) {
      return res.status(404).json({ message: 'Daily sourcing log not found' });
    }

    // Authorization check: Only the employee who submitted the task can edit or delete it
    const userId = (req.user.id || req.user._id || '').toString();
    const userEmpId = (req.user.employeeId || req.user.customId || '').toString();

    const isOwner = (log.employee && log.employee.toString() === userId) ||
                    (log.employeeId && userEmpId && log.employeeId === userEmpId);

    if (!isOwner) {
      return res.status(403).json({ message: 'Only the employee who submitted this log can edit it.' });
    }

    if (clientName !== undefined) log.clientName = clientName.trim();
    if (position !== undefined) log.position = position.trim();
    if (location !== undefined) log.location = location.trim();
    if (submission !== undefined) log.submission = Number(submission) || 0;
    if (interview !== undefined) log.interview = Number(interview) || 0;
    if (description !== undefined) log.description = description.trim();

    await log.save();

    const updatedLog = await DailySourcingLog.findById(log._id)
      .populate('employee', 'firstName lastName email employeeId profileImage department designation');

    return res.json(updatedLog);
  } catch (err) {
    logger.error('Error updating daily sourcing log:', { error: err.message });
    return res.status(500).json({ message: err.message || 'Failed to update daily sourcing log' });
  }
};

// Delete a daily sourcing log
exports.deleteSourcingLog = async (req, res) => {
  try {
    const { id } = req.params;

    const log = await DailySourcingLog.findById(id);
    if (!log) {
      return res.status(404).json({ message: 'Daily sourcing log not found' });
    }

    const userId = (req.user.id || req.user._id || '').toString();
    const userEmpId = (req.user.employeeId || req.user.customId || '').toString();

    const isOwner = (log.employee && log.employee.toString() === userId) ||
                    (log.employeeId && userEmpId && log.employeeId === userEmpId);

    if (!isOwner) {
      return res.status(403).json({ message: 'Only the employee who submitted this log can delete it.' });
    }

    await log.deleteOne();

    return res.json({ message: 'Daily sourcing log deleted successfully' });
  } catch (err) {
    logger.error('Error deleting daily sourcing log:', { error: err.message });
    return res.status(500).json({ message: err.message || 'Failed to delete daily sourcing log' });
  }
};

// Get aggregated statistics for header cards
exports.getSourcingStats = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'EMPLOYEE' && req.query.filterScope === 'mine') {
      query.employee = req.user.id || req.user._id;
    }

    const logs = await DailySourcingLog.find(query);

    const totalSubmissions = logs.reduce((sum, l) => sum + (l.submission || 0), 0);
    const totalInterviews = logs.reduce((sum, l) => sum + (l.interview || 0), 0);
    const totalLogs = logs.length;

    const uniqueClients = new Set(logs.map(l => l.clientName.toLowerCase().trim())).size;
    const uniquePositions = new Set(logs.map(l => l.position.toLowerCase().trim())).size;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayLogsCount = logs.filter(l => new Date(l.createdAt) >= todayStart).length;

    return res.json({
      totalSubmissions,
      totalInterviews,
      totalLogs,
      uniqueClients,
      uniquePositions,
      todayLogsCount
    });
  } catch (err) {
    logger.error('Error fetching sourcing stats:', { error: err.message });
    return res.status(500).json({ message: err.message || 'Failed to fetch stats' });
  }
};
