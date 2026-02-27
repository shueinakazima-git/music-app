async function loadCreators() {
  try {
    const res = await fetch('/music/creators');

    if (!res.ok) {
      console.error('Failed to load creators. Status:', res.status);
      alert('Failed to load artists. Please refresh the page.');
      return;
    }

    const creators = await res.json();
    
    if (!Array.isArray(creators) || creators.length === 0) {
      console.warn('No creators found');
      alert('No artists found in database');
      return;
    }

    // テーブル表示
    const tbody = document.getElementById('creatorList');
    tbody.innerHTML = "";

    creators.forEach(creator => {
      const tr = document.createElement('tr');
      const typeLabel = creator.creator_type === 'SOLO' ? 'Solo Artist' : 'Group/Band';
      tr.innerHTML = `
        <td>${creator.creator_name}</td>
        <td>${typeLabel}</td>
        <td>
          <button class="btn-edit" onclick="openEditCreatorModal(${creator.creator_id}, '${creator.creator_name.replace(/'/g, "\\'")}', '${creator.creator_type}')">Edit</button>
          <button class="btn-delete" onclick="deleteCreator(${creator.creator_id}, '${creator.creator_name.replace(/'/g, "\\'")}')" style="margin-left: 5px;">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // フォーム用セレクト要素を埋める
    const songSelect = document.getElementById('artistSelect');
    const albumSelect = document.getElementById('albumArtistSelect');
    const artistCreatorSelect = document.getElementById('artistCreatorSelect');
    const groupCreatorSelect = document.getElementById('groupCreatorSelect');
    
    // 既存のオプションをクリア（最初のデフォルトオプションは残す）
    while (songSelect.options.length > 1) {
      songSelect.remove(1);
    }
    while (albumSelect.options.length > 1) {
      albumSelect.remove(1);
    }
    while (artistCreatorSelect.options.length > 1) {
      artistCreatorSelect.remove(1);
    }
    while (groupCreatorSelect.options.length > 1) {
      groupCreatorSelect.remove(1);
    }

    // SOLOとGROUPで分ける
    creators.forEach(creator => {
      const option1 = document.createElement('option');
      option1.value = creator.creator_id;
      option1.textContent = creator.creator_name;
      songSelect.appendChild(option1);

      const option2 = document.createElement('option');
      option2.value = creator.creator_id;
      option2.textContent = creator.creator_name;
      albumSelect.appendChild(option2);

      if (creator.creator_type === 'SOLO') {
        const option3 = document.createElement('option');
        option3.value = creator.creator_id;
        option3.textContent = creator.creator_name;
        artistCreatorSelect.appendChild(option3);
      } else if (creator.creator_type === 'GROUP') {
        const option4 = document.createElement('option');
        option4.value = creator.creator_id;
        option4.textContent = creator.creator_name;
        groupCreatorSelect.appendChild(option4);
      }
    });

    console.log(`Loaded ${creators.length} creators`);

  } catch (err) {
    console.error('Failed to load creators:', err);
    alert('Error loading artists: ' + err.message);
  }
}

async function loadSongs() {
  try {
    const res = await fetch('/music');
    const data = await res.json();

    const tbody = document.getElementById('songList');
    tbody.innerHTML = "";

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4">No songs found</td></tr>';
      return;
    }

    data.forEach(song => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${song.music_title}</td>
        <td>${song.creator_name}</td>
        <td>${song.bpm} BPM</td>
        <td>
          <button class="btn-edit" onclick="openEditModal(${song.music_id}, '${song.music_title.replace(/'/g, "\\'")}', ${song.bpm}, '${song.musical_key ? song.musical_key.replace(/'/g, "\\'") : ''}', ${song.duration_seconds || 0})">Edit</button>
          <button class="btn-delete" onclick="deleteSong(${song.music_id}, '${song.music_title.replace(/'/g, "\\'")}')" style="margin-left: 5px;">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Failed to load songs:', err);
  }
}

async function loadAlbums() {
  try {
    const res = await fetch('/albums');
    const data = await res.json();

    const tbody = document.getElementById('albumList');
    tbody.innerHTML = "";

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4">No albums found</td></tr>';
      return;
    }

    data.forEach(album => {
      const tr = document.createElement('tr');
      const releaseDate = album.RELEASE_DATE ? new Date(album.RELEASE_DATE).toLocaleDateString() : 'N/A';
      tr.innerHTML = `
        <td>${album.album_name}</td>
        <td>${album.creator_name || 'N/A'}</td>
        <td>${releaseDate}</td>
        <td>
          <button class="btn-secondary" onclick="openAddSongsModal(${album.album_id}, '${album.album_name.replace(/'/g, "\\'")}')" style="background: #FF9800;">Add Songs</button>
          <button class="btn-edit" onclick="openEditAlbumModal(${album.album_id}, '${album.album_name.replace(/'/g, "\\'")}', ${album.creator_id || 0}, '${album.release_date || ''}')">Edit</button>
          <button class="btn-delete" onclick="deleteAlbum(${album.album_id}, '${album.album_name.replace(/'/g, "\\'")}')" style="margin-left: 5px;">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Failed to load albums:', err);
  }
}

async function addSong(event) {
  event.preventDefault();

  const title = document.getElementById('songTitle').value.trim();
  const creator_id = document.getElementById('artistSelect').value;
  const bpm = document.getElementById('bpm').value;
  const musical_key = document.getElementById('musicalKey').value.trim() || null;
  const duration_seconds = document.getElementById('duration').value || null;

  // 厳格なバリデーション
  if (!title) {
    alert('Please enter a song title');
    return;
  }

  if (!creator_id || creator_id === '') {
    alert('Please select an artist');
    return;
  }

  if (!bpm || bpm < 1) {
    alert('Please enter a valid BPM');
    return;
  }

  try {
    console.log('Adding song:', { title, creator_id: parseInt(creator_id), bpm: parseInt(bpm), musical_key, duration_seconds });
    
    const response = await fetch('/music', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title,
        creator_id: parseInt(creator_id),
        bpm: parseInt(bpm),
        musical_key,
        duration_seconds: duration_seconds ? parseInt(duration_seconds) : null
      })
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);
    console.log('Response body:', responseText);

    if (response.ok) {
      alert('Song added successfully!');
      document.getElementById('addSongForm').reset();
      loadSongs();
    } else {
      alert(`Failed to add song: ${response.status} - ${responseText}`);
    }
  } catch (err) {
    console.error('Error adding song:', err);
    alert('Error adding song: ' + err.message);
  }
}

function openEditModal(musicId, title, bpm, musical_key, duration) {
  document.getElementById('editMusicId').value = musicId;
  document.getElementById('editSongTitle').value = title;
  document.getElementById('editBpm').value = bpm;
  document.getElementById('editMusicalKey').value = musical_key || '';
  document.getElementById('editDuration').value = duration || '';
  
  document.getElementById('editModal').style.display = 'block';
}

function closeEditModal() {
  document.getElementById('editModal').style.display = 'none';
}

async function updateSong(event) {
  event.preventDefault();

  const musicId = document.getElementById('editMusicId').value;
  const title = document.getElementById('editSongTitle').value.trim();
  const bpm = document.getElementById('editBpm').value;
  const musical_key = document.getElementById('editMusicalKey').value.trim() || null;
  const duration_seconds = document.getElementById('editDuration').value || null;

  if (!title || !bpm) {
    alert('Please fill in required fields');
    return;
  }

  try {
    console.log('Updating song:', { musicId, title, bpm, musical_key, duration_seconds });

    const response = await fetch(`/music/${musicId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title,
        bpm: parseInt(bpm),
        musical_key,
        duration_seconds: duration_seconds ? parseInt(duration_seconds) : null
      })
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);

    if (response.ok) {
      alert('Song updated successfully!');
      closeEditModal();
      loadSongs();
    } else {
      alert(`Failed to update song: ${response.status} - ${responseText}`);
    }
  } catch (err) {
    console.error('Error updating song:', err);
    alert('Error updating song: ' + err.message);
  }
}

async function deleteSong(musicId, title) {
  if (!confirm(`Are you sure you want to delete "${title}"?`)) {
    return;
  }

  try {
    console.log('Deleting song:', musicId);

    const response = await fetch(`/music/${musicId}`, {
      method: 'DELETE'
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);

    if (response.ok) {
      alert('Song deleted successfully!');
      loadSongs();
    } else {
      alert(`Failed to delete song: ${response.status} - ${responseText}`);
    }
  } catch (err) {
    console.error('Error deleting song:', err);
    alert('Error deleting song: ' + err.message);
  }
}

// ===== アルバム関連関数 =====

async function addAlbum(event) {
  event.preventDefault();

  const albumName = document.getElementById('albumName').value.trim();
  const creator_id = document.getElementById('albumArtistSelect').value;
  const releaseDate = document.getElementById('releaseDate').value || null;

  if (!albumName) {
    alert('Please enter an album name');
    return;
  }

  if (!creator_id || creator_id === '') {
    alert('Please select an artist');
    return;
  }

  try {
    console.log('Adding album:', { albumName, creator_id: parseInt(creator_id), releaseDate });

    const response = await fetch('/albums', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        album_name: albumName,
        creator_id: parseInt(creator_id),
        release_date: releaseDate
      })
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);

    if (response.ok) {
      alert('Album added successfully!');
      document.getElementById('addAlbumForm').reset();
      loadAlbums();
    } else {
      alert(`Failed to add album: ${response.status} - ${responseText}`);
    }
  } catch (err) {
    console.error('Error adding album:', err);
    alert('Error adding album: ' + err.message);
  }
}

function openEditAlbumModal(albumId, albumName, creatorId, releaseDate) {
  document.getElementById('editAlbumId').value = albumId;
  document.getElementById('editAlbumName').value = albumName;
  document.getElementById('editAlbumCreatorSelect').value = creatorId;
  document.getElementById('editReleaseDate').value = releaseDate || '';
  
  document.getElementById('editAlbumModal').style.display = 'block';
}

function closeEditAlbumModal() {
  document.getElementById('editAlbumModal').style.display = 'none';
}

async function updateAlbum(event) {
  event.preventDefault();

  const albumId = document.getElementById('editAlbumId').value;
  const albumName = document.getElementById('editAlbumName').value.trim();
  const creator_id = document.getElementById('editAlbumCreatorSelect').value;
  const releaseDate = document.getElementById('editReleaseDate').value || null;

  if (!albumName || !creator_id) {
    alert('Please fill in required fields');
    return;
  }

  try {
    console.log('Updating album:', { albumId, albumName, creator_id, releaseDate });

    const response = await fetch(`/albums/${albumId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        album_name: albumName,
        creator_id: parseInt(creator_id),
        release_date: releaseDate
      })
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);

    if (response.ok) {
      alert('Album updated successfully!');
      closeEditAlbumModal();
      loadAlbums();
    } else {
      alert(`Failed to update album: ${response.status} - ${responseText}`);
    }
  } catch (err) {
    console.error('Error updating album:', err);
    alert('Error updating album: ' + err.message);
  }
}

async function deleteAlbum(albumId, albumName) {
  if (!confirm(`Are you sure you want to delete the album "${albumName}"?`)) {
    return;
  }

  try {
    console.log('Deleting album:', albumId);

    const response = await fetch(`/albums/${albumId}`, {
      method: 'DELETE'
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);

    if (response.ok) {
      alert('Album deleted successfully!');
      loadAlbums();
    } else {
      alert(`Failed to delete album: ${response.status} - ${responseText}`);
    }
  } catch (err) {
    console.error('Error deleting album:', err);
    alert('Error deleting album: ' + err.message);
  }
}

// ===== クリエイター関連関数 =====

async function addCreator(event) {
  event.preventDefault();

  const creatorName = document.getElementById('creatorName').value.trim();
  const creatorType = document.getElementById('creatorType').value;

  if (!creatorName) {
    alert('Please enter a creator name');
    return;
  }

  if (!creatorType) {
    alert('Please select a creator type');
    return;
  }

  try {
    console.log('Adding creator:', { creatorName, creatorType });

    const response = await fetch('/creators', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        creator_name: creatorName,
        creator_type: creatorType
      })
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);

    if (response.ok) {
      alert('Creator added successfully!');
      document.getElementById('addCreatorForm').reset();
      loadCreators();
    } else {
      alert(`Failed to add creator: ${response.status} - ${responseText}`);
    }
  } catch (err) {
    console.error('Error adding creator:', err);
    alert('Error adding creator: ' + err.message);
  }
}

function openEditCreatorModal(creatorId, creatorName, creatorType) {
  document.getElementById('editCreatorId').value = creatorId;
  document.getElementById('editCreatorName').value = creatorName;
  document.getElementById('editCreatorType').value = creatorType;
  
  document.getElementById('editCreatorModal').style.display = 'block';
}

function closeEditCreatorModal() {
  document.getElementById('editCreatorModal').style.display = 'none';
}

async function updateCreator(event) {
  event.preventDefault();

  const creatorId = document.getElementById('editCreatorId').value;
  const creatorName = document.getElementById('editCreatorName').value.trim();
  const creatorType = document.getElementById('editCreatorType').value;

  if (!creatorName || !creatorType) {
    alert('Please fill in all required fields');
    return;
  }

  try {
    console.log('Updating creator:', { creatorId, creatorName, creatorType });

    const response = await fetch(`/creators/${creatorId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        creator_name: creatorName,
        creator_type: creatorType
      })
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);

    if (response.ok) {
      alert('Creator updated successfully!');
      closeEditCreatorModal();
      loadCreators();
    } else {
      alert(`Failed to update creator: ${response.status} - ${responseText}`);
    }
  } catch (err) {
    console.error('Error updating creator:', err);
    alert('Error updating creator: ' + err.message);
  }
}

async function deleteCreator(creatorId, creatorName) {
  if (!confirm(`Are you sure you want to delete the creator "${creatorName}"? This will also delete associated songs and albums.`)) {
    return;
  }

  try {
    console.log('Deleting creator:', creatorId);

    const response = await fetch(`/creators/${creatorId}`, {
      method: 'DELETE'
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);

    if (response.ok) {
      alert('Creator deleted successfully!');
      loadCreators();
    } else {
      alert(`Failed to delete creator: ${response.status} - ${responseText}`);
    }
  } catch (err) {
    console.error('Error deleting creator:', err);
    alert('Error deleting creator: ' + err.message);
  }
}

// ===== アルバム曲選択関数 =====

async function openAddSongsModal(albumId, albumName) {
  document.getElementById('addSongsAlbumId').value = albumId;
  document.getElementById('addSongsAlbumName').textContent = albumName;

  // 利用可能な曲を読み込む
  try {
    const res = await fetch(`/albums/${albumId}/available-songs`);
    const songs = await res.json();

    const songsList = document.getElementById('availableSongsList');
    songsList.innerHTML = "";

    if (songs.length === 0) {
      songsList.innerHTML = '<p>No songs available to add</p>';
      document.getElementById('addSongsModal').style.display = 'block';
      return;
    }

    songs.forEach((song, index) => {
      const div = document.createElement('div');
      div.style.marginBottom = '10px';
      div.innerHTML = `
        <label>
          <input type="checkbox" name="songCheckbox" value="${song.MUSIC_ID}">
          ${song.MUSIC_TITLE} - ${song.creator_name} (${song.BPM} BPM)
        </label>
      `;
      songsList.appendChild(div);
    });

    document.getElementById('addSongsModal').style.display = 'block';

  } catch (err) {
    console.error('Failed to load available songs:', err);
    alert('Error loading songs: ' + err.message);
  }
}

function closeAddSongsModal() {
  document.getElementById('addSongsModal').style.display = 'none';
}

async function saveSongsToAlbum(event) {
  event.preventDefault();

  const albumId = document.getElementById('addSongsAlbumId').value;
  const checkboxes = document.querySelectorAll('input[name="songCheckbox"]:checked');

  if (checkboxes.length === 0) {
    alert('Please select at least one song');
    return;
  }

  const musicIds = Array.from(checkboxes).map(cb => parseInt(cb.value));

  try {
    console.log('Adding songs to album:', { albumId, musicIds });

    const response = await fetch(`/albums/${albumId}/songs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        music_ids: musicIds
      })
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);

    if (response.ok) {
      alert('Songs added to album successfully!');
      closeAddSongsModal();
      loadAlbums();
    } else {
      alert(`Failed to add songs: ${response.status} - ${responseText}`);
    }
  } catch (err) {
    console.error('Error adding songs:', err);
    alert('Error adding songs: ' + err.message);
  }
}

// ===== タグ管理関数 =====
async function loadTags() {
  try {
    const res = await fetch('/tags');
    
    if (!res.ok) {
      console.error('Failed to load tags. Status:', res.status);
      return;
    }

    const tags = await res.json();
    
    if (!Array.isArray(tags)) {
      console.warn('No tags found');
      return;
    }

    // テーブル表示
    const tbody = document.getElementById('tagList');
    if (!tbody) {
      console.warn('tagList element not found');
      return;
    }
    tbody.innerHTML = "";

    tags.forEach(tag => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${tag.tag_name}</td>
        <td>${tag.note || ''}</td>
        <td>
          <button class="btn-edit" onclick="openEditTagModal(${tag.tag_id}, '${tag.tag_name.replace(/'/g, "\\'")}', '${(tag.note || '').replace(/'/g, "\\'")}')" style="margin-right: 5px;">Edit</button>
          <button class="btn-delete" onclick="deleteTag(${tag.tag_id}, '${tag.tag_name.replace(/'/g, "\\'")}')" style="margin-left: 5px;">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    console.log(`Loaded ${tags.length} tags`);

  } catch (err) {
    console.error('Failed to load tags:', err);
  }
}

async function addTag(event) {
  event.preventDefault();

  const tagName = document.getElementById('tagName').value.trim();
  const tagNote = document.getElementById('tagNote').value.trim();

  if (!tagName) {
    alert('Please enter tag name');
    return;
  }

  try {
    console.log('Adding tag:', { tagName, tagNote });

    const response = await fetch('/tags', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tag_name: tagName,
        note: tagNote || null
      })
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);

    if (response.ok) {
      alert('Tag added successfully!');
      document.getElementById('addTagForm').reset();
      loadTags();
    } else {
      alert(`Failed to add tag: ${response.status} - ${responseText}`);
    }
  } catch (err) {
    console.error('Error adding tag:', err);
    alert('Error adding tag: ' + err.message);
  }
}

function openEditTagModal(tagId, tagName, tagNote) {
  document.getElementById('editTagId').value = tagId;
  document.getElementById('editTagName').value = tagName;
  document.getElementById('editTagNote').value = tagNote;
  
  document.getElementById('editTagModal').style.display = 'block';
}

function closeEditTagModal() {
  document.getElementById('editTagModal').style.display = 'none';
}

async function updateTag(event) {
  event.preventDefault();

  const tagId = document.getElementById('editTagId').value;
  const tagName = document.getElementById('editTagName').value.trim();
  const tagNote = document.getElementById('editTagNote').value.trim();

  if (!tagName) {
    alert('Please fill in required fields');
    return;
  }

  try {
    console.log('Updating tag:', { tagId, tagName, tagNote });

    const response = await fetch(`/tags/${tagId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tag_name: tagName,
        note: tagNote || null
      })
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);

    if (response.ok) {
      alert('Tag updated successfully!');
      closeEditTagModal();
      loadTags();
    } else {
      alert(`Failed to update tag: ${response.status} - ${responseText}`);
    }
  } catch (err) {
    console.error('Error updating tag:', err);
    alert('Error updating tag: ' + err.message);
  }
}

async function deleteTag(tagId, tagName) {
  if (!confirm(`Are you sure you want to delete the tag "${tagName}"?`)) {
    return;
  }

  try {
    console.log('Deleting tag:', tagId);

    const response = await fetch(`/tags/${tagId}`, {
      method: 'DELETE'
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);

    if (response.ok) {
      alert('Tag deleted successfully!');
      loadTags();
    } else {
      alert(`Failed to delete tag: ${response.status} - ${responseText}`);
    }
  } catch (err) {
    console.error('Error deleting tag:', err);
    alert('Error deleting tag: ' + err.message);
  }
}

// ===== アーティスト管理関数 =====
async function loadArtists() {
  try {
    const res = await fetch('/artists');
    
    if (!res.ok) {
      console.error('Failed to load artists. Status:', res.status);
      return;
    }

    const artists = await res.json();
    
    if (!Array.isArray(artists)) {
      console.warn('No artists found');
      return;
    }

    // テーブル表示
    const tbody = document.getElementById('artistList');
    if (!tbody) {
      console.warn('artistList element not found');
      return;
    }
    tbody.innerHTML = "";

    artists.forEach(artist => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${artist.artist_name}</td>
        <td>${artist.date_of_birth ? artist.date_of_birth.substring(0, 10) : ''}</td>
        <td>${artist.started_at ? artist.started_at.substring(0, 10) : ''}</td>
        <td>${artist.ended_at ? artist.ended_at.substring(0, 10) : ''}</td>
        <td>
          <button class="btn-edit" onclick="openEditArtistModal(${artist.artist_id}, ${artist.creator_id}, '${(artist.artist_name || '').replace(/'/g, "\\'")}', '${(artist.date_of_birth || '').substring(0, 10)}', '${(artist.started_at || '').substring(0, 10)}', '${(artist.ended_at || '').substring(0, 10)}')" style="margin-right: 5px;">Edit</button>
          <button class="btn-delete" onclick="deleteArtist(${artist.artist_id}, '${(artist.artist_name || '').replace(/'/g, "\\'")}')" style="margin-left: 5px;">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    console.log(`Loaded ${artists.length} artists`);

  } catch (err) {
    console.error('Failed to load artists:', err);
  }
}

async function addArtist(event) {
  event.preventDefault();

  const creatorId = document.getElementById('artistCreatorSelect').value;
  const dateOfBirth = document.getElementById('artistDoB').value || null;
  const startedAt = document.getElementById('artistStartDate').value || null;
  const endedAt = document.getElementById('artistEndDate').value || null;

  if (!creatorId) {
    alert('Please select a creator');
    return;
  }

  try {
    console.log('Adding artist:', { creatorId, dateOfBirth, startedAt, endedAt });

    const response = await fetch('/artists', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        creator_id: parseInt(creatorId),
        date_of_birth: dateOfBirth,
        started_at: startedAt,
        ended_at: endedAt
      })
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);

    if (response.ok) {
      alert('Artist added successfully!');
      document.getElementById('addArtistForm').reset();
      loadArtists();
    } else {
      alert(`Failed to add artist: ${response.status} - ${responseText}`);
    }
  } catch (err) {
    console.error('Error adding artist:', err);
    alert('Error adding artist: ' + err.message);
  }
}

function openEditArtistModal(artistId, creatorId, artistName, dateOfBirth, startedAt, endedAt) {
  document.getElementById('editArtistId').value = artistId;
  document.getElementById('editArtistCreatorSelect').value = creatorId;
  document.getElementById('editArtistName').value = artistName;
  document.getElementById('editArtistDoB').value = dateOfBirth;
  document.getElementById('editArtistStartDate').value = startedAt;
  document.getElementById('editArtistEndDate').value = endedAt;
  
  document.getElementById('editArtistModal').style.display = 'block';
}

function closeEditArtistModal() {
  document.getElementById('editArtistModal').style.display = 'none';
}

async function updateArtist(event) {
  event.preventDefault();

  const artistId = document.getElementById('editArtistId').value;
  const creatorId = document.getElementById('editArtistCreatorSelect').value;
  const dateOfBirth = document.getElementById('editArtistDoB').value || null;
  const startedAt = document.getElementById('editArtistStartDate').value || null;
  const endedAt = document.getElementById('editArtistEndDate').value || null;

  if (!creatorId) {
    alert('Please select a creator');
    return;
  }

  try {
    console.log('Updating artist:', { artistId, creatorId, dateOfBirth, startedAt, endedAt });

    const response = await fetch(`/artists/${artistId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        creator_id: parseInt(creatorId),
        date_of_birth: dateOfBirth,
        started_at: startedAt,
        ended_at: endedAt
      })
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);

    if (response.ok) {
      alert('Artist updated successfully!');
      closeEditArtistModal();
      loadArtists();
    } else {
      alert(`Failed to update artist: ${response.status} - ${responseText}`);
    }
  } catch (err) {
    console.error('Error updating artist:', err);
    alert('Error updating artist: ' + err.message);
  }
}

async function deleteArtist(artistId, artistName) {
  if (!confirm(`Are you sure you want to delete the artist "${artistName}"?`)) {
    return;
  }

  try {
    console.log('Deleting artist:', artistId);

    const response = await fetch(`/artists/${artistId}`, {
      method: 'DELETE'
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);

    if (response.ok) {
      alert('Artist deleted successfully!');
      loadArtists();
    } else {
      alert(`Failed to delete artist: ${response.status} - ${responseText}`);
    }
  } catch (err) {
    console.error('Error deleting artist:', err);
    alert('Error deleting artist: ' + err.message);
  }
}

// ===== グループ管理関数 =====
async function loadGroups() {
  try {
    const res = await fetch('/groups');
    
    if (!res.ok) {
      console.error('Failed to load groups. Status:', res.status);
      return;
    }

    const groups = await res.json();
    
    if (!Array.isArray(groups)) {
      console.warn('No groups found');
      return;
    }

    // テーブル表示
    const tbody = document.getElementById('groupList');
    if (!tbody) {
      console.warn('groupList element not found');
      return;
    }
    tbody.innerHTML = "";

    groups.forEach(group => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${group.group_name}</td>
        <td>${group.formation_date ? group.formation_date.substring(0, 10) : ''}</td>
        <td>${group.dissolution_date ? group.dissolution_date.substring(0, 10) : ''}</td>
        <td>
          <button class="btn-edit" onclick="openEditGroupModal(${group.group_id}, ${group.creator_id}, '${group.group_name.replace(/'/g, "\\'")}', '${(group.formation_date || '').substring(0, 10)}', '${(group.dissolution_date || '').substring(0, 10)}')" style="margin-right: 5px;">Edit</button>
          <button class="btn-delete" onclick="deleteGroup(${group.group_id}, '${group.group_name.replace(/'/g, "\\'")}')" style="margin-left: 5px;">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    console.log(`Loaded ${groups.length} groups`);

  } catch (err) {
    console.error('Failed to load groups:', err);
  }
}

async function addGroup(event) {
  event.preventDefault();

  const creatorId = document.getElementById('groupCreatorSelect').value;
  const formationDate = document.getElementById('groupFormationDate').value || null;
  const dissolutionDate = document.getElementById('groupDissolutionDate').value || null;

  if (!creatorId) {
    alert('Please select a creator');
    return;
  }

  try {
    console.log('Adding group:', { creatorId, formationDate, dissolutionDate });

    const response = await fetch('/groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        creator_id: parseInt(creatorId),
        formation_date: formationDate,
        dissolution_date: dissolutionDate
      })
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);

    if (response.ok) {
      alert('Group added successfully!');
      document.getElementById('addGroupForm').reset();
      loadGroups();
    } else {
      alert(`Failed to add group: ${response.status} - ${responseText}`);
    }
  } catch (err) {
    console.error('Error adding group:', err);
    alert('Error adding group: ' + err.message);
  }
}

function openEditGroupModal(groupId, creatorId, groupName, formationDate, dissolutionDate) {
  document.getElementById('editGroupId').value = groupId;
  document.getElementById('editGroupCreatorSelect').value = creatorId;
  document.getElementById('editGroupName').value = groupName;
  document.getElementById('editGroupFormationDate').value = formationDate;
  document.getElementById('editGroupDissolutionDate').value = dissolutionDate;
  
  document.getElementById('editGroupModal').style.display = 'block';
}

function closeEditGroupModal() {
  document.getElementById('editGroupModal').style.display = 'none';
}

async function updateGroup(event) {
  event.preventDefault();

  const groupId = document.getElementById('editGroupId').value;
  const creatorId = document.getElementById('editGroupCreatorSelect').value;
  const formationDate = document.getElementById('editGroupFormationDate').value || null;
  const dissolutionDate = document.getElementById('editGroupDissolutionDate').value || null;

  if (!creatorId) {
    alert('Please select a creator');
    return;
  }

  try {
    console.log('Updating group:', { groupId, creatorId, formationDate, dissolutionDate });

    const response = await fetch(`/groups/${groupId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        creator_id: parseInt(creatorId),
        formation_date: formationDate,
        dissolution_date: dissolutionDate
      })
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);

    if (response.ok) {
      alert('Group updated successfully!');
      closeEditGroupModal();
      loadGroups();
    } else {
      alert(`Failed to update group: ${response.status} - ${responseText}`);
    }
  } catch (err) {
    console.error('Error updating group:', err);
    alert('Error updating group: ' + err.message);
  }
}

async function deleteGroup(groupId, groupName) {
  if (!confirm(`Are you sure you want to delete the group "${groupName}"?`)) {
    return;
  }

  try {
    console.log('Deleting group:', groupId);

    const response = await fetch(`/groups/${groupId}`, {
      method: 'DELETE'
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);

    if (response.ok) {
      alert('Group deleted successfully!');
      loadGroups();
    } else {
      alert(`Failed to delete group: ${response.status} - ${responseText}`);
    }
  } catch (err) {
    console.error('Error deleting group:', err);
    alert('Error deleting group: ' + err.message);
  }
}

// ===== アコーディオン機能 =====
function setupAccordions() {
  const formSections = document.querySelectorAll('.form-section');
  
  formSections.forEach((section, index) => {
    const h2 = section.querySelector('h2');
    if (!h2) return;

    // 最初の数個は展開、残りは折り畳み
    if (index > 1) {
      section.classList.add('collapsed');
    }

    // クリックイベント
    h2.addEventListener('click', () => {
      section.classList.toggle('collapsed');
    });
  });
}

// ===== タブ機能 =====
function setupTabNavigation() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');

      // すべてのボタンとコンテンツを非アクティブにします
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      // クリックされたボタンとコンテンツをアクティブにします
      button.classList.add('active');
      const activeContent = document.getElementById(tabName);
      if (activeContent) {
        activeContent.classList.add('active');
      }
    });
  });
}


// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadCreators();
  loadSongs();
  loadAlbums();
  loadTags();
  loadArtists();
  loadGroups();

  // アコーディオン機能
  setupAccordions();

  // タブ機能
  setupTabNavigation();
  
  // 曲フォーム
  const form = document.getElementById('addSongForm');
  form.addEventListener('submit', addSong);

  const editForm = document.getElementById('editSongForm');
  editForm.addEventListener('submit', updateSong);

  // アルバムフォーム
  const albumForm = document.getElementById('addAlbumForm');
  albumForm.addEventListener('submit', addAlbum);

  const editAlbumForm = document.getElementById('editAlbumForm');
  editAlbumForm.addEventListener('submit', updateAlbum);

  // クリエイターフォーム
  const creatorForm = document.getElementById('addCreatorForm');
  creatorForm.addEventListener('submit', addCreator);

  const editCreatorForm = document.getElementById('editCreatorForm');
  editCreatorForm.addEventListener('submit', updateCreator);

  // タグフォーム
  const tagForm = document.getElementById('addTagForm');
  tagForm.addEventListener('submit', addTag);

  const editTagForm = document.getElementById('editTagForm');
  editTagForm.addEventListener('submit', updateTag);

  // アーティストフォーム
  const artistForm = document.getElementById('addArtistForm');
  artistForm.addEventListener('submit', addArtist);

  const editArtistForm = document.getElementById('editArtistForm');
  editArtistForm.addEventListener('submit', updateArtist);

  // グループフォーム
  const groupForm = document.getElementById('addGroupForm');
  groupForm.addEventListener('submit', addGroup);

  const editGroupForm = document.getElementById('editGroupForm');
  editGroupForm.addEventListener('submit', updateGroup);

  // 曲編集モーダルの閉じる処理
  const modal = document.getElementById('editModal');
  const closeBtn = document.querySelector('.close');
  const cancelBtn = document.getElementById('cancelEdit');

  closeBtn.onclick = closeEditModal;
  cancelBtn.onclick = closeEditModal;

  window.onclick = function(event) {
    if (event.target === modal) {
      closeEditModal();
    }
  };

  // アルバム編集モーダルの閉じる処理
  const albumModal = document.getElementById('editAlbumModal');
  const closeAlbumBtn = document.querySelector('.close-album');
  const cancelAlbumBtn = document.getElementById('cancelEditAlbum');

  closeAlbumBtn.onclick = closeEditAlbumModal;
  cancelAlbumBtn.onclick = closeEditAlbumModal;

  window.onclick = function(event) {
    if (event.target === albumModal) {
      closeEditAlbumModal();
    }
  };

  // クリエイター編集モーダルの閉じる処理
  const creatorModal = document.getElementById('editCreatorModal');
  const closeCreatorBtn = document.querySelector('.close-creator');
  const cancelCreatorBtn = document.getElementById('cancelEditCreator');

  closeCreatorBtn.onclick = closeEditCreatorModal;
  cancelCreatorBtn.onclick = closeEditCreatorModal;

  window.onclick = function(event) {
    if (event.target === creatorModal) {
      closeEditCreatorModal();
    }
  };

  // タグ編集モーダルの閉じる処理
  const tagModal = document.getElementById('editTagModal');
  if (tagModal) {
    const closeTagBtn = tagModal.querySelector('.close-tag');
    const cancelTagBtn = document.getElementById('cancelEditTag');

    if (closeTagBtn) closeTagBtn.onclick = closeEditTagModal;
    if (cancelTagBtn) cancelTagBtn.onclick = closeEditTagModal;

    window.onclick = function(event) {
      if (event.target === tagModal) {
        closeEditTagModal();
      }
    };
  }

  // アーティスト編集モーダルの閉じる処理
  const artistModal = document.getElementById('editArtistModal');
  if (artistModal) {
    const closeArtistBtn = artistModal.querySelector('.close-artist');
    const cancelArtistBtn = document.getElementById('cancelEditArtist');

    if (closeArtistBtn) closeArtistBtn.onclick = closeEditArtistModal;
    if (cancelArtistBtn) cancelArtistBtn.onclick = closeEditArtistModal;

    window.onclick = function(event) {
      if (event.target === artistModal) {
        closeEditArtistModal();
      }
    };
  }

  // グループ編集モーダルの閉じる処理
  const groupModal = document.getElementById('editGroupModal');
  if (groupModal) {
    const closeGroupBtn = groupModal.querySelector('.close-group');
    const cancelGroupBtn = document.getElementById('cancelEditGroup');

    if (closeGroupBtn) closeGroupBtn.onclick = closeEditGroupModal;
    if (cancelGroupBtn) cancelGroupBtn.onclick = closeEditGroupModal;

    window.onclick = function(event) {
      if (event.target === groupModal) {
        closeEditGroupModal();
      }
    };
  }

  // 曲選択モーダルの閉じる処理
  const songsModal = document.getElementById('addSongsModal');
  const closeSongsBtn = document.querySelector('.close-songs');
  const cancelSongsBtn = document.getElementById('cancelAddSongs');
  const addSongsForm = document.getElementById('addSongsForm');

  closeSongsBtn.onclick = closeAddSongsModal;
  cancelSongsBtn.onclick = closeAddSongsModal;
  addSongsForm.addEventListener('submit', saveSongsToAlbum);

  window.onclick = function(event) {
    if (event.target === songsModal) {
      closeAddSongsModal();
    }
    if (event.target === creatorModal) {
      closeEditCreatorModal();
    }
    if (event.target === albumModal) {
      closeEditAlbumModal();
    }
    if (event.target === modal) {
      closeEditModal();
    }
  };

  // アルバム編集モーダルのカテゴリ選択肢を埋める
  const editAlbumSelect = document.getElementById('editAlbumCreatorSelect');
  const albumSelect = document.getElementById('albumArtistSelect');
  
  // 既に作成されたオプションをコピー
  Array.from(albumSelect.options).forEach(option => {
    if (option.value !== '') {
      const newOption = option.cloneNode(true);
      editAlbumSelect.appendChild(newOption);
    }
  });

  // アーティスト編集モーダルの選択肢を埋める
  const editArtistCreatorSelect = document.getElementById('editArtistCreatorSelect');
  const artistCreatorSelect = document.getElementById('artistCreatorSelect');
  
  Array.from(artistCreatorSelect.options).forEach(option => {
    if (option.value !== '') {
      const newOption = option.cloneNode(true);
      editArtistCreatorSelect.appendChild(newOption);
    }
  });

  // グループ編集モーダルの選択肢を埋める
  const editGroupCreatorSelect = document.getElementById('editGroupCreatorSelect');
  const groupCreatorSelect = document.getElementById('groupCreatorSelect');
  
  Array.from(groupCreatorSelect.options).forEach(option => {
    if (option.value !== '') {
      const newOption = option.cloneNode(true);
      editGroupCreatorSelect.appendChild(newOption);
    }
  });
});
