const mongoose = require('mongoose');

const recruitmentSubtaskSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'CandidatePipeline', required: true },
  title: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'In Progress', 'Completed', 'Blocked'], 
    default: 'Pending' 
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dueDate: { type: Date }
}, { timestamps: true });

recruitmentSubtaskSchema.post('save', async function() {
  await updateCandidateSubtaskStats(this.candidate);
});

recruitmentSubtaskSchema.post('remove', async function() {
  await updateCandidateSubtaskStats(this.candidate);
});

recruitmentSubtaskSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    await updateCandidateSubtaskStats(doc.candidate);
  }
});

async function updateCandidateSubtaskStats(candidateId) {
  try {
    const CandidatePipeline = mongoose.model('CandidatePipeline');
    const RecruitmentSubtask = mongoose.model('RecruitmentSubtask');

    const subtasks = await RecruitmentSubtask.find({ candidate: candidateId });
    const total = subtasks.length;
    const completed = subtasks.filter(s => s.status === 'Completed').length;
    const pending = total - completed;

    await CandidatePipeline.findByIdAndUpdate(candidateId, {
      subtaskStats: { total, completed, pending }
    });
  } catch (err) {
    console.error("Failed to update candidate subtask stats:", err);
  }
}

module.exports = mongoose.model('RecruitmentSubtask', recruitmentSubtaskSchema);
