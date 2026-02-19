const express = require('express');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config();

const app = express();

app.use(express.json());
// serve static files from project public directory regardless of cwd
app.use(express.static(path.join(__dirname, '..', 'public')));

const musicRoutes = require('./routes/musicRoutes');
const albumController = require('./controllers/albumController');
const creatorController = require('./controllers/creatorController');
const tagController = require('./controllers/tagController');
const artistController = require('./controllers/artistController');
const groupController = require('./controllers/groupController');

app.use('/music', musicRoutes);

// アルバムエンドポイント
app.get('/albums', albumController.getAllAlbums);
app.post('/albums', albumController.createAlbum);
app.put('/albums/:id', albumController.updateAlbum);
app.delete('/albums/:id', albumController.deleteAlbum);
app.get('/albums/:id/available-songs', albumController.getAvailableSongs);
app.post('/albums/:id/songs', albumController.addSongsToAlbum);

// クリエイターエンドポイント
app.get('/creators', creatorController.getAllCreators);
app.post('/creators', creatorController.createCreator);
app.put('/creators/:id', creatorController.updateCreator);
app.delete('/creators/:id', creatorController.deleteCreator);

// タグエンドポイント
app.get('/tags', tagController.getAllTags);
app.post('/tags', tagController.createTag);
app.put('/tags/:id', tagController.updateTag);
app.delete('/tags/:id', tagController.deleteTag);

// アーティストエンドポイント
app.get('/artists', artistController.getAllArtists);
app.post('/artists', artistController.createArtist);
app.put('/artists/:id', artistController.updateArtist);
app.delete('/artists/:id', artistController.deleteArtist);

// グループエンドポイント
app.get('/groups', groupController.getAllGroups);
app.post('/groups', groupController.createGroup);
app.put('/groups/:id', groupController.updateGroup);
app.delete('/groups/:id', groupController.deleteGroup);

app.listen(3000, () => {
  console.log('Server started on port 3000');
});
