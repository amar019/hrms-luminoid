const RequisitionDiscussion = require('../models/RequisitionDiscussion');

exports.getDiscussion = async (req, res) => {
  try {
    const { requisitionId } = req.params;
    let discussion = await RequisitionDiscussion.findOne({ requisition: requisitionId })
      .populate('messages.sender', 'firstName lastName email profileImage role');

    if (!discussion) {
      discussion = new RequisitionDiscussion({ requisition: requisitionId, messages: [] });
      await discussion.save();
    }

    res.json(discussion);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addMessage = async (req, res) => {
  try {
    const { requisitionId } = req.params;
    const { message } = req.body;

    let discussion = await RequisitionDiscussion.findOne({ requisition: requisitionId });
    if (!discussion) {
      discussion = new RequisitionDiscussion({ requisition: requisitionId, messages: [] });
    }

    discussion.messages.push({
      sender: req.user.id,
      message
    });

    await discussion.save();

    const updatedDiscussion = await RequisitionDiscussion.findById(discussion._id)
      .populate('messages.sender', 'firstName lastName email profileImage role');

    res.json(updatedDiscussion);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
