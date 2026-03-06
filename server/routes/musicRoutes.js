const express = require('express');
const router = express.Router();
const musicController = require('../controllers/musicController');

router.get('/', musicController.getAllMusic);
router.get('/with-chords', musicController.getMusicWithChords);
router.get('/creators', musicController.getCreators);
router.get('/stats', musicController.getStats);
router.get('/:id/tags', musicController.getMusicTags);
router.get('/:id/available-tags', musicController.getAvailableTags);
router.post('/:id/tags', musicController.addTagsToMusic);
router.delete('/:musicId/tags/:tagId', musicController.removeTagFromMusic);
router.get('/:id/chords', musicController.getChordProgression);
router.post('/', musicController.createMusic);
router.put('/:id', musicController.updateMusic);
router.delete('/:id', musicController.deleteMusic);

module.exports = router;
