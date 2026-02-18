const express = require('express');
const router = express.Router();
const musicController = require('../controllers/musicController');

router.get('/', musicController.getAllMusic);
router.get('/creators', musicController.getCreators);
router.get('/stats', musicController.getStats);
router.get('/:id/chords', musicController.getChordProgression);
router.post('/', musicController.createMusic);
router.put('/:id', musicController.updateMusic);
router.delete('/:id', musicController.deleteMusic);

module.exports = router;
