const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  createCandidate,
  getCandidates,
  getCandidateById,
  updateCandidate,
  updateCandidateStage,
  deleteCandidate,
  addFeedback,
  addComment
} = require('../controllers/candidatePipelineController');

router.post('/', auth, createCandidate);
router.get('/', auth, getCandidates);
router.get('/:id', auth, getCandidateById);
router.put('/:id', auth, updateCandidate);
router.put('/:id/stage', auth, updateCandidateStage);
router.post('/:id/feedback', auth, addFeedback);
router.post('/:id/comments', auth, addComment);
router.delete('/:id', auth, deleteCandidate);

module.exports = router;
