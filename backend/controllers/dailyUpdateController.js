const DailyUpdate = require('../models/DailyUpdate');
const User = require('../models/User');

// Get all daily updates with filters
exports.getDailyUpdates = async (req, res) => {
  try {
    const { filter = 'all' } = req.query;
    let query = {};

    if (filter === 'mine') {
      query.userId = req.user.id;
    } else if (filter === 'team') {
      const user = await User.findById(req.user.id);
      const teamMembers = await User.find({ department: user.department });
      query.userId = { $in: teamMembers.map(m => m._id) };
    }

    const updates = await DailyUpdate.find(query)
      .populate('userId', 'firstName lastName role department')
      .populate('comments.userId', 'firstName lastName')
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(50);

    res.json(updates);
  } catch (error) {
    console.error('Error fetching daily updates:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new daily update
exports.createDailyUpdate = async (req, res) => {
  try {
    const { content, tags, visibility } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const update = new DailyUpdate({
      userId: req.user.id,
      content: content.trim(),
      tags: tags || [],
      visibility: visibility || 'PUBLIC'
    });

    await update.save();
    await update.populate('userId', 'firstName lastName role department');

    res.status(201).json(update);
  } catch (error) {
    console.error('Error creating daily update:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Like/Unlike an update
exports.toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const update = await DailyUpdate.findById(id);

    if (!update) {
      return res.status(404).json({ message: 'Update not found' });
    }

    const likeIndex = update.likes.indexOf(req.user.id);

    if (likeIndex > -1) {
      update.likes.splice(likeIndex, 1);
    } else {
      update.likes.push(req.user.id);
    }

    await update.save();
    await update.populate('userId', 'firstName lastName role department');

    res.json(update);
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add a comment to an update
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ message: 'Comment is required' });
    }

    const update = await DailyUpdate.findById(id);

    if (!update) {
      return res.status(404).json({ message: 'Update not found' });
    }

    update.comments.push({
      userId: req.user.id,
      text: comment.trim()
    });

    await update.save();
    await update.populate('userId', 'firstName lastName role department');
    await update.populate('comments.userId', 'firstName lastName');

    res.json(update);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update an update
exports.updateDailyUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const update = await DailyUpdate.findById(id);

    if (!update) {
      return res.status(404).json({ message: 'Update not found' });
    }

    if (update.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    update.content = content.trim();
    await update.save();
    await update.populate('userId', 'firstName lastName role department');
    await update.populate('comments.userId', 'firstName lastName');

    res.json(update);
  } catch (error) {
    console.error('Error updating daily update:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete an update
exports.deleteUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const update = await DailyUpdate.findById(id);

    if (!update) {
      return res.status(404).json({ message: 'Update not found' });
    }

    // Check if user is the owner or admin
    if (update.userId.toString() !== req.user.id && !['ADMIN', 'HR'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await update.deleteOne();
    res.json({ message: 'Update deleted successfully' });
  } catch (error) {
    console.error('Error deleting update:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Pin/Unpin an update (Admin only)
exports.togglePin = async (req, res) => {
  try {
    if (!['ADMIN', 'HR'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { id } = req.params;
    const update = await DailyUpdate.findById(id);

    if (!update) {
      return res.status(404).json({ message: 'Update not found' });
    }

    update.isPinned = !update.isPinned;
    await update.save();

    res.json(update);
  } catch (error) {
    console.error('Error toggling pin:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
