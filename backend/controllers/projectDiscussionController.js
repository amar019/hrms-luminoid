const Project = require('../models/Project');
const ProjectDiscussion = require('../models/ProjectDiscussion');
const User = require('../models/User');
const logger = require('../utils/logger');

// Helper to check if user has access to a project
const checkProjectAccess = async (projectId, user) => {
  if (['ADMIN', 'HR', 'MANAGER'].includes(user.role)) {
    return true;
  }

  const project = await Project.findById(projectId);
  if (!project) return false;

  const isLeader = project.leader && project.leader.toString() === user.id;
  const isMember = project.members && project.members.some(m => m.toString() === user.id);

  return isLeader || isMember;
};

// GET /api/project-chat/rooms
exports.getAvailableRooms = async (req, res) => {
  try {
    logger.info('getAvailableRooms', { userId: req.user?.id });

    const filter = {};
    if (!['ADMIN', 'HR', 'MANAGER'].includes(req.user.role)) {
      filter.$or = [
        { leader: req.user.id },
        { members: req.user.id }
      ];
    }

    const projects = await Project.find(filter);

    const rooms = await Promise.all(projects.map(async (project) => {
      const lastMsg = await ProjectDiscussion.findOne({ project: project._id, isDeleted: { $ne: true } })
        .sort({ createdAt: -1 })
        .populate('sender', 'firstName lastName');

      return {
        projectId: project._id,
        projectName: project.name,
        projectCode: project.code,
        memberCount: (project.members?.length || 0) + (project.leader ? 1 : 0),
        lastMessage: lastMsg ? {
          _id: lastMsg._id,
          message: lastMsg.message,
          senderName: `${lastMsg.sender?.firstName || ''} ${lastMsg.sender?.lastName || ''}`.trim(),
          createdAt: lastMsg.createdAt
        } : null,
        lastActivity: lastMsg ? lastMsg.createdAt : project.createdAt
      };
    }));

    // Sort rooms by lastActivity descending
    rooms.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));

    res.json(rooms);
  } catch (err) {
    logger.error('Error fetching available rooms:', err);
    res.status(500).json({ error: 'Server error fetching available rooms' });
  }
};

// GET /api/project-chat/:projectId/messages
exports.getProjectDiscussions = async (req, res) => {
  try {
    const { projectId } = req.params;
    logger.info('getProjectDiscussions', { projectId, userId: req.user?.id });

    // Validate access permissions
    const hasAccess = await checkProjectAccess(projectId, req.user);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this project.' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const total = await ProjectDiscussion.countDocuments({ project: projectId, isDeleted: { $ne: true } });

    // Fetch latest messages for pagination (newest first)
    const messages = await ProjectDiscussion.find({ project: projectId, isDeleted: { $ne: true } })
      .populate('sender', 'firstName lastName profileImage designation')
      .populate('mentions', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Reverse messages to show them chronologically (oldest to newest) for client side display
    const reversedMessages = [...messages].reverse();

    res.json({
      messages: reversedMessages,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    logger.error('Error fetching project discussions:', err);
    res.status(500).json({ error: 'Server error fetching project discussions' });
  }
};

// POST /api/project-chat/:projectId/messages
exports.sendMessage = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { message } = req.body;

    logger.info('sendMessage', { projectId, userId: req.user?.id });

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    // Validate access permissions
    const hasAccess = await checkProjectAccess(projectId, req.user);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this project.' });
    }

    // Parse mentions (@username)
    const mentionRegex = /@(\w+)/g;
    const mentionsList = [];
    let match;
    while ((match = mentionRegex.exec(message)) !== null) {
      mentionsList.push(match[1]);
    }

    const mentionedUsers = await User.find({
      $or: [
        { firstName: { $in: mentionsList } },
        { lastName: { $in: mentionsList } }
      ]
    });

    const disc = new ProjectDiscussion({
      project: projectId,
      sender: req.user.id,
      message: message.trim(),
      mentions: mentionedUsers.map(u => u._id)
    });

    await disc.save();

    const populated = await ProjectDiscussion.findById(disc._id)
      .populate('sender', 'firstName lastName profileImage designation')
      .populate('mentions', 'firstName lastName');

    res.status(201).json(populated);
  } catch (err) {
    logger.error('Error sending message:', err);
    res.status(500).json({ error: 'Server error sending message' });
  }
};

// PUT /api/project-chat/messages/:messageId
exports.editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { message } = req.body;

    logger.info('editMessage', { messageId, userId: req.user?.id });

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    const disc = await ProjectDiscussion.findById(messageId);
    if (!disc) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const isAuthor = disc.sender.toString() === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ error: 'Access denied. You can only edit your own messages.' });
    }

    // Parse mentions (@username)
    const mentionRegex = /@(\w+)/g;
    const mentionsList = [];
    let match;
    while ((match = mentionRegex.exec(message)) !== null) {
      mentionsList.push(match[1]);
    }

    const mentionedUsers = await User.find({
      $or: [
        { firstName: { $in: mentionsList } },
        { lastName: { $in: mentionsList } }
      ]
    });

    disc.message = message.trim();
    disc.mentions = mentionedUsers.map(u => u._id);
    disc.editedAt = Date.now();

    await disc.save();

    const populated = await ProjectDiscussion.findById(disc._id)
      .populate('sender', 'firstName lastName profileImage designation')
      .populate('mentions', 'firstName lastName');

    res.json(populated);
  } catch (err) {
    logger.error('Error editing message:', err);
    res.status(500).json({ error: 'Server error editing message' });
  }
};

// DELETE /api/project-chat/messages/:messageId
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    logger.info('deleteMessage', { messageId, userId: req.user?.id });

    const disc = await ProjectDiscussion.findById(messageId);
    if (!disc) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const isAuthor = disc.sender.toString() === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ error: 'Access denied. You can only delete your own messages.' });
    }

    disc.isDeleted = true;
    await disc.save();

    res.json({ message: 'Message deleted successfully', messageId });
  } catch (err) {
    logger.error('Error deleting message:', err);
    res.status(500).json({ error: 'Server error deleting message' });
  }
};
