const express = require('express');
const {
  getFavorites,
  createFavorite,
  updateFavorite,
  deleteFavorite
} = require('../controllers/favoriteController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, getFavorites);
router.post('/', auth, createFavorite);
router.put('/:id', auth, updateFavorite);
router.delete('/:id', auth, deleteFavorite);

module.exports = router;