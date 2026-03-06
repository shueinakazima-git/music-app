function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeForSingleQuote(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n');
}

const detailData = {
  creators: new Map(),
  songs: new Map(),
  albums: new Map(),
  tags: new Map(),
  artists: new Map(),
  groups: new Map()
};

function toDetailValue(value) {
  if (value === null || value === undefined || value === '') {
    return '未設定';
  }
  return String(value);
}

function openDetailModal(title, fields) {
  const modal = document.getElementById('detailModal');
  const titleEl = document.getElementById('detailModalTitle');
  const body = document.getElementById('detailModalBody');

  if (!modal || !titleEl || !body) return;

  titleEl.textContent = title;
  body.innerHTML = '';

  fields.forEach((field) => {
    const group = document.createElement('div');
    group.className = 'form-group';

    const label = document.createElement('label');
    label.textContent = field.label;

    const value = document.createElement('input');
    value.type = 'text';
    value.readOnly = true;
    value.value = toDetailValue(field.value);

    group.appendChild(label);
    group.appendChild(value);
    body.appendChild(group);
  });

  modal.style.display = 'block';
}

function closeDetailModal() {
  const modal = document.getElementById('detailModal');
  if (modal) modal.style.display = 'none';
}

function openCreatorDetail(creatorId) {
  const creator = detailData.creators.get(Number(creatorId));
  if (!creator) return;

  openDetailModal('クリエイター詳細', [
    { label: 'ID', value: creator.creator_id },
    { label: '名前', value: creator.creator_name },
    { label: '種別', value: creator.creator_type === 'SOLO' ? 'Solo Artist' : 'Group/Band' }
  ]);
}

function openSongDetail(musicId) {
  const song = detailData.songs.get(Number(musicId));
  if (!song) return;

  openDetailModal('楽曲詳細', [
    { label: 'ID', value: song.music_id },
    { label: 'タイトル', value: song.music_title },
    { label: 'アーティスト', value: song.creator_name },
    { label: 'BPM', value: song.bpm },
    { label: 'キー', value: song.musical_key },
    { label: '再生時間(秒)', value: song.duration_seconds },
    { label: 'アルバム', value: song.album_name },
    { label: 'タグ', value: song.tag_name }
  ]);
}

function openAlbumDetail(albumId) {
  const album = detailData.albums.get(Number(albumId));
  if (!album) return;

  openDetailModal('アルバム詳細', [
    { label: 'ID', value: album.album_id },
    { label: 'アルバム名', value: album.album_name },
    { label: 'アーティスト', value: album.creator_name },
    { label: 'リリース日', value: album.release_date }
  ]);
}

function openTagDetail(tagId) {
  const tag = detailData.tags.get(Number(tagId));
  if (!tag) return;

  openDetailModal('タグ詳細', [
    { label: 'ID', value: tag.tag_id },
    { label: 'タグ名', value: tag.tag_name },
    { label: 'メモ', value: tag.note }
  ]);
}

function openArtistDetail(artistId) {
  const artist = detailData.artists.get(Number(artistId));
  if (!artist) return;

  openDetailModal('アーティスト詳細', [
    { label: 'ID', value: artist.artist_id },
    { label: '名前', value: artist.artist_name },
    { label: '生年月日', value: artist.date_of_birth },
    { label: '活動開始日', value: artist.started_at },
    { label: '活動終了日', value: artist.ended_at }
  ]);
}

function openGroupDetail(groupId) {
  const group = detailData.groups.get(Number(groupId));
  if (!group) return;

  openDetailModal('グループ詳細', [
    { label: 'ID', value: group.group_id },
    { label: 'グループ名', value: group.group_name },
    { label: '結成年', value: group.formation_date },
    { label: '解散日', value: group.dissolution_date }
  ]);
}

async function requestWithText(url, options = {}) {
  const response = await fetch(url, options);
  const responseText = await response.text();
  return { response, responseText };
}

async function runMutation({
  url,
  method,
  body,
  successMessage,
  failureLabel,
  onSuccess
}) {
  const options = { method };
  if (body !== undefined) {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(body);
  }

  const { response, responseText } = await requestWithText(url, options);
  console.log('レスポンスステータス:', response.status);

  if (!response.ok) {
    alert(`${failureLabel}: ${response.status} - ${responseText}`);
    return false;
  }

  if (successMessage) {
    alert(successMessage);
  }

  if (onSuccess) {
    await onSuccess();
  }

  return true;
}

async function createCreatorWithType(name, type) {
  const response = await fetch('/creators', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creator_name: name,
      creator_type: type
    })
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (err) {
    payload = null;
  }

  return { response, payload };
}

async function loadCreators() {
  try {
    const res = await fetch('/music/creators');

    if (!res.ok) {
      console.error('クリエイター読み込み失敗。ステータス:', res.status);
      alert('アーティストの読み込みに失敗しました。ページを再読み込みしてください。');
      return;
    }

    const creators = await res.json();
    
    if (!Array.isArray(creators) || creators.length === 0) {
      console.warn('クリエイターが見つかりません');
      alert('データベースにアーティストが見つかりません。');
      return;
    }

    // テーブル表示（Creatorsタブがある場合のみ）
    const tbody = document.getElementById('creatorList');
    detailData.creators.clear();
    if (tbody) {
      tbody.innerHTML = '';

      creators.forEach(creator => {
        detailData.creators.set(Number(creator.creator_id), creator);
        const tr = document.createElement('tr');
        const typeLabel = creator.creator_type === 'SOLO' ? 'Solo Artist' : 'Group/Band';
        const creatorName = escapeHtml(creator.creator_name);
        tr.innerHTML = `
          <td>${creatorName}</td>
          <td>${escapeHtml(typeLabel)}</td>
          <td>
            <button class="btn-more" onclick="openCreatorDetail(${creator.creator_id})">More</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    // フォーム用セレクト要素を埋める
    const songSelect = document.getElementById('artistSelect');
    const albumSelect = document.getElementById('albumArtistSelect');
    const editAlbumSelect = document.getElementById('editAlbumCreatorSelect');
    if (!songSelect || !albumSelect) {
      return;
    }

    // 既存のオプションをクリア（最初のデフォルトオプションは残す）
    while (songSelect.options.length > 1) songSelect.remove(1);
    while (albumSelect.options.length > 1) albumSelect.remove(1);
    while (editAlbumSelect && editAlbumSelect.options.length > 1) editAlbumSelect.remove(1);

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

      const optionEdit = document.createElement('option');
      optionEdit.value = creator.creator_id;
      optionEdit.textContent = creator.creator_name;
      if (editAlbumSelect) {
        editAlbumSelect.appendChild(optionEdit);
      }
    });

    console.log(`${creators.length}件のクリエイターを読み込みました`);

  } catch (err) {
    console.error('クリエイター読み込み失敗:', err);
    alert('アーティスト読み込みエラー: ' + err.message);
  }
}

async function loadSongs() {
  try {
    const res = await fetch('/music');
    const data = await res.json();

    const tbody = document.getElementById('songList');
    tbody.innerHTML = "";
    detailData.songs.clear();

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4">楽曲が見つかりません</td></tr>';
      return;
    }

    data.forEach(song => {
      if (!detailData.songs.has(Number(song.music_id))) {
        detailData.songs.set(Number(song.music_id), song);
      }
      const tr = document.createElement('tr');
      const songTitleArg = escapeForSingleQuote(song.music_title);
      const songKeyArg = escapeForSingleQuote(song.musical_key || '');
      tr.innerHTML = `
        <td>${escapeHtml(song.music_title)}</td>
        <td>${escapeHtml(song.creator_name)}</td>
        <td>${escapeHtml(song.album_name || '')}</td>
        <td>
          <button class="btn-add" onclick="openAddTagsModal(${song.music_id}, '${songTitleArg}')">Add Tag</button>
          <button class="btn-more" onclick="openSongDetail(${song.music_id})">More</button>
          <button class="btn-edit" onclick="openEditModal(${song.music_id}, '${songTitleArg}', ${song.bpm}, '${songKeyArg}', ${song.duration_seconds || 0})">Edit</button>
          <button class="btn-delete" onclick="deleteSong(${song.music_id}, '${songTitleArg}')" style="margin-left: 5px;">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('楽曲読み込み失敗:', err);
  }
}

async function loadAlbums() {
  try {
    const res = await fetch('/albums');
    const data = await res.json();

    const tbody = document.getElementById('albumList');
    tbody.innerHTML = "";
    detailData.albums.clear();

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4">アルバムが見つかりません</td></tr>';
      return;
    }

    data.forEach(album => {
      detailData.albums.set(Number(album.album_id), album);
      const tr = document.createElement('tr');
      const releaseDate = album.release_date ? new Date(album.release_date).toLocaleDateString() : 'N/A';
      const albumNameArg = escapeForSingleQuote(album.album_name);
      const releaseDateArg = escapeForSingleQuote(album.release_date || '');
      tr.innerHTML = `
        <td>${escapeHtml(album.album_name)}</td>
        <td>${escapeHtml(album.creator_name || 'N/A')}</td>
        <td>${escapeHtml(releaseDate)}</td>
        <td>
          <button class="btn-add" onclick="openAddSongsModal(${album.album_id}, '${albumNameArg}')">Add Songs</button>
          <button class="btn-more" onclick="openAlbumDetail(${album.album_id})">More</button>
          <button class="btn-edit" onclick="openEditAlbumModal(${album.album_id}, '${albumNameArg}', ${album.creator_id || 0}, '${releaseDateArg}')">Edit</button>
          <button class="btn-delete" onclick="deleteAlbum(${album.album_id}, '${albumNameArg}')" style="margin-left: 5px;">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('アルバム読み込み失敗:', err);
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
    alert('楽曲名を入力してください');
    return;
  }

  if (!creator_id || creator_id === '') {
    alert('アーティストを選択してください');
    return;
  }

  if (!bpm || bpm < 1) {
    alert('BPMを正しく入力してください');
    return;
  }

  try {
    console.log('楽曲追加:', { title, creator_id: parseInt(creator_id), bpm: parseInt(bpm), musical_key, duration_seconds });

    await runMutation({
      url: '/music',
      method: 'POST',
      body: {
        title,
        creator_id: parseInt(creator_id),
        bpm: parseInt(bpm),
        musical_key,
        duration_seconds: duration_seconds ? parseInt(duration_seconds) : null
      },
      successMessage: '楽曲を登録しました！',
      failureLabel: '楽曲の登録に失敗しました',
      onSuccess: async () => {
        document.getElementById('addSongForm').reset();
        await loadSongs();
      }
    });
  } catch (err) {
    console.error('楽曲登録エラー:', err);
    alert('楽曲登録エラー: ' + err.message);
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
    alert('必須項目を入力してください');
    return;
  }

  try {
    console.log('楽曲更新:', { musicId, title, bpm, musical_key, duration_seconds });
    await runMutation({
      url: `/music/${musicId}`,
      method: 'PUT',
      body: {
        title,
        bpm: parseInt(bpm),
        musical_key,
        duration_seconds: duration_seconds ? parseInt(duration_seconds) : null
      },
      successMessage: '楽曲を更新しました！',
      failureLabel: '楽曲の更新に失敗しました',
      onSuccess: async () => {
        closeEditModal();
        await loadSongs();
      }
    });
  } catch (err) {
    console.error('楽曲更新エラー:', err);
    alert('楽曲更新エラー: ' + err.message);
  }
}

async function deleteSong(musicId, title) {
  if (!confirm(`"${title}" を削除してもよろしいですか？`)) {
    return;
  }

  try {
    console.log('楽曲削除:', musicId);
    await runMutation({
      url: `/music/${musicId}`,
      method: 'DELETE',
      successMessage: '楽曲を削除しました！',
      failureLabel: '楽曲の削除に失敗しました',
      onSuccess: loadSongs
    });
  } catch (err) {
    console.error('楽曲削除エラー:', err);
    alert('楽曲削除エラー: ' + err.message);
  }
}

// ===== アルバム関連関数 =====

async function addAlbum(event) {
  event.preventDefault();

  const albumName = document.getElementById('albumName').value.trim();
  const creator_id = document.getElementById('albumArtistSelect').value;
  const releaseDate = document.getElementById('releaseDate').value || null;

  if (!albumName) {
    alert('アルバム名を入力してください');
    return;
  }

  if (!creator_id || creator_id === '') {
    alert('アーティストを選択してください');
    return;
  }

  try {
    console.log('アルバム追加:', { albumName, creator_id: parseInt(creator_id), releaseDate });
    await runMutation({
      url: '/albums',
      method: 'POST',
      body: {
        album_name: albumName,
        creator_id: parseInt(creator_id),
        release_date: releaseDate
      },
      successMessage: 'アルバムを登録しました！',
      failureLabel: 'アルバムの登録に失敗しました',
      onSuccess: async () => {
        document.getElementById('addAlbumForm').reset();
        await loadAlbums();
      }
    });
  } catch (err) {
    console.error('アルバム登録エラー:', err);
    alert('アルバム登録エラー: ' + err.message);
  }
}

function openEditAlbumModal(albumId, albumName, creatorId, releaseDate) {
  document.getElementById('editAlbumId').value = albumId;
  document.getElementById('editAlbumName').value = albumName;
  document.getElementById('editAlbumCreatorSelect').value = creatorId;
  const formattedDate = releaseDate
    ? releaseDate.split('T')[0] // "YYYY-MM-DDTHH:MM:SSZ" -> "YYYY-MM-DD"
    : '';
  document.getElementById('editReleaseDate').value = formattedDate;
  
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
    alert('必須項目を入力してください');
    return;
  }

  try {
    console.log('アルバム更新:', { albumId, albumName, creator_id, releaseDate });
    await runMutation({
      url: `/albums/${albumId}`,
      method: 'PUT',
      body: {
        album_name: albumName,
        creator_id: parseInt(creator_id),
        release_date: releaseDate
      },
      successMessage: 'アルバムを更新しました！',
      failureLabel: 'アルバムの更新に失敗しました',
      onSuccess: async () => {
        closeEditAlbumModal();
        await loadAlbums();
      }
    });
  } catch (err) {
    console.error('アルバム更新エラー:', err);
    alert('アルバム更新エラー: ' + err.message);
  }
}

async function deleteAlbum(albumId, albumName) {
  if (!confirm(`アルバム "${albumName}" を削除してもよろしいですか？`)) {
    return;
  }

  try {
    console.log('アルバム削除:', albumId);
    await runMutation({
      url: `/albums/${albumId}`,
      method: 'DELETE',
      successMessage: 'アルバムを削除しました！',
      failureLabel: 'アルバムの削除に失敗しました',
      onSuccess: loadAlbums
    });
  } catch (err) {
    console.error('アルバム削除エラー:', err);
    alert('アルバム削除エラー: ' + err.message);
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
      songsList.innerHTML = '<p>追加可能な楽曲がありません</p>';
      document.getElementById('addSongsModal').style.display = 'block';
      return;
    }

    songs.forEach((song, index) => {
      const div = document.createElement('div');
      div.style.marginBottom = '10px';
      div.innerHTML = `
        <label>
          <input type="checkbox" name="songCheckbox" value="${song.music_id}">
          ${escapeHtml(song.music_title)} - ${escapeHtml(song.creator_name)} (${escapeHtml(song.bpm)} BPM)
        </label>
      `;
      songsList.appendChild(div);
    });

    document.getElementById('addSongsModal').style.display = 'block';

  } catch (err) {
    console.error('追加可能楽曲の読み込み失敗:', err);
    alert('楽曲読み込みエラー: ' + err.message);
  }
}

function closeAddSongsModal() {
  document.getElementById('addSongsModal').style.display = 'none';
}

async function openAddTagsModal(musicId, musicTitle) {
  document.getElementById('addTagsMusicId').value = musicId;
  document.getElementById('addTagsMusicName').textContent = musicTitle;

  try {
    const [linkedRes, availableRes] = await Promise.all([
      fetch(`/music/${musicId}/tags`),
      fetch(`/music/${musicId}/available-tags`)
    ]);
    const linkedTags = await linkedRes.json();
    const tags = await availableRes.json();

    const linkedTagsList = document.getElementById('linkedTagsList');
    const tagsList = document.getElementById('availableTagsList');
    linkedTagsList.innerHTML = '';
    tagsList.innerHTML = '';

    if (!Array.isArray(linkedTags) || linkedTags.length === 0) {
      linkedTagsList.innerHTML = '<p>現在紐付いているタグはありません</p>';
    } else {
      linkedTags.forEach((tag) => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.justifyContent = 'space-between';
        row.style.marginBottom = '8px';

        const text = document.createElement('span');
        text.textContent = `${tag.tag_name}${tag.note ? ` (${tag.note})` : ''}`;

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'btn-delete';
        removeBtn.textContent = '解除';
        removeBtn.style.marginLeft = '8px';
        removeBtn.onclick = () => removeTagFromMusic(musicId, tag.tag_id, tag.tag_name, musicTitle);

        row.appendChild(text);
        row.appendChild(removeBtn);
        linkedTagsList.appendChild(row);
      });
    }

    if (!Array.isArray(tags) || tags.length === 0) {
      tagsList.innerHTML = '<p>追加可能なタグがありません</p>';
      document.getElementById('addTagsModal').style.display = 'block';
      return;
    }

    tags.forEach((tag) => {
      const wrapper = document.createElement('div');
      wrapper.style.marginBottom = '10px';

      const label = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = 'tagCheckbox';
      checkbox.value = tag.tag_id;

      const text = document.createTextNode(` ${tag.tag_name}${tag.note ? ` (${tag.note})` : ''}`);

      label.appendChild(checkbox);
      label.appendChild(text);
      wrapper.appendChild(label);
      tagsList.appendChild(wrapper);
    });

    document.getElementById('addTagsModal').style.display = 'block';
  } catch (err) {
    console.error('タグ候補の読み込み失敗:', err);
    alert('タグ候補の読み込みに失敗しました: ' + err.message);
  }
}

function closeAddTagsModal() {
  document.getElementById('addTagsModal').style.display = 'none';
}

async function removeTagFromMusic(musicId, tagId, tagName, musicTitle) {
  if (!confirm(`タグ「${tagName}」の紐付けを解除しますか？`)) {
    return;
  }

  try {
    const response = await fetch(`/music/${musicId}/tags/${tagId}`, {
      method: 'DELETE'
    });
    const responseText = await response.text();

    if (response.ok) {
      alert('タグの紐付けを解除しました');
      await openAddTagsModal(musicId, musicTitle);
      await loadSongs();
    } else {
      alert(`タグ解除に失敗しました: ${response.status} - ${responseText}`);
    }
  } catch (err) {
    console.error('タグ解除エラー:', err);
    alert('タグ解除エラー: ' + err.message);
  }
}

async function saveTagsToMusic(event) {
  event.preventDefault();

  const musicId = document.getElementById('addTagsMusicId').value;
  const checkboxes = document.querySelectorAll('input[name="tagCheckbox"]:checked');

  if (checkboxes.length === 0) {
    alert('1つ以上のタグを選択してください');
    return;
  }

  const tagIds = Array.from(checkboxes).map((cb) => Number(cb.value));

  try {
    console.log('曲へのタグ紐付け:', { musicId, tagIds });
    await runMutation({
      url: `/music/${musicId}/tags`,
      method: 'POST',
      body: { tag_ids: tagIds },
      successMessage: 'タグを紐付けました！',
      failureLabel: 'タグ紐付けに失敗しました',
      onSuccess: async () => {
        closeAddTagsModal();
        await loadSongs();
      }
    });
  } catch (err) {
    console.error('タグ紐付けエラー:', err);
    alert('タグ紐付けエラー: ' + err.message);
  }
}

async function saveSongsToAlbum(event) {
  event.preventDefault();

  const albumId = document.getElementById('addSongsAlbumId').value;
  const checkboxes = document.querySelectorAll('input[name="songCheckbox"]:checked');

  if (checkboxes.length === 0) {
    alert('1曲以上選択してください');
    return;
  }

  const musicIds = Array.from(checkboxes).map(cb => parseInt(cb.value));

  try {
    console.log('アルバムへの楽曲追加:', { albumId, musicIds });
    await runMutation({
      url: `/albums/${albumId}/songs`,
      method: 'POST',
      body: { music_ids: musicIds },
      successMessage: 'アルバムに楽曲を追加しました！',
      failureLabel: '楽曲追加に失敗しました',
      onSuccess: async () => {
        closeAddSongsModal();
        await loadAlbums();
      }
    });
  } catch (err) {
    console.error('楽曲追加エラー:', err);
    alert('楽曲追加エラー: ' + err.message);
  }
}

// ===== タグ管理関数 =====
async function loadTags() {
  try {
    const res = await fetch('/tags');
    
    if (!res.ok) {
      console.error('タグ読み込み失敗。ステータス:', res.status);
      return;
    }

    const tags = await res.json();
    
    if (!Array.isArray(tags)) {
      console.warn('タグが見つかりません');
      return;
    }

    // テーブル表示
    const tbody = document.getElementById('tagList');
    if (!tbody) {
      console.warn('tagList要素が見つかりません');
      return;
    }
    tbody.innerHTML = "";
    detailData.tags.clear();

    tags.forEach(tag => {
      detailData.tags.set(Number(tag.tag_id), tag);
      const tr = document.createElement('tr');
      const tagNameArg = escapeForSingleQuote(tag.tag_name);
      const tagNoteArg = escapeForSingleQuote(tag.note || '');
      tr.innerHTML = `
        <td>${escapeHtml(tag.tag_name)}</td>
        <td>${escapeHtml(tag.note || '')}</td>
        <td>
          <button class="btn-more" onclick="openTagDetail(${tag.tag_id})">More</button>
          <button class="btn-edit" onclick="openEditTagModal(${tag.tag_id}, '${tagNameArg}', '${tagNoteArg}')" style="margin-right: 5px;">Edit</button>
          <button class="btn-delete" onclick="deleteTag(${tag.tag_id}, '${tagNameArg}')" style="margin-left: 5px;">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    console.log(`${tags.length}件のタグを読み込みました`);

  } catch (err) {
    console.error('タグ読み込み失敗:', err);
  }
}

async function addTag(event) {
  event.preventDefault();

  const tagName = document.getElementById('tagName').value.trim();
  const tagNote = document.getElementById('tagNote').value.trim();

  if (!tagName) {
    alert('タグ名を入力してください');
    return;
  }

  try {
    console.log('タグ追加:', { tagName, tagNote });

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

    let payload = null;
    try {
      payload = await response.json();
    } catch (parseErr) {
      payload = null;
    }

    console.log('レスポンスステータス:', response.status);

    if (response.ok) {
      const message = payload?.message || 'タグを作成しました！';
      alert(message);
      document.getElementById('addTagForm').reset();
      loadTags();
    } else if (response.status === 409) {
      alert(payload?.error || '同名のタグが既に存在します');
    } else {
      alert(`タグ作成に失敗しました: ${response.status} - ${payload?.error || '不明なエラー'}`);
    }
  } catch (err) {
    console.error('タグ作成エラー:', err);
    alert('タグ作成エラー: ' + err.message);
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
    alert('必須項目を入力してください');
    return;
  }

  try {
    console.log('タグ更新:', { tagId, tagName, tagNote });
    await runMutation({
      url: `/tags/${tagId}`,
      method: 'PUT',
      body: {
        tag_name: tagName,
        note: tagNote || null
      },
      successMessage: 'タグを更新しました！',
      failureLabel: 'タグ更新に失敗しました',
      onSuccess: async () => {
        closeEditTagModal();
        await loadTags();
      }
    });
  } catch (err) {
    console.error('タグ更新エラー:', err);
    alert('タグ更新エラー: ' + err.message);
  }
}

async function deleteTag(tagId, tagName) {
  if (!confirm(`タグ "${tagName}" を削除してもよろしいですか？`)) {
    return;
  }

  try {
    console.log('タグ削除:', tagId);
    await runMutation({
      url: `/tags/${tagId}`,
      method: 'DELETE',
      successMessage: 'タグを削除しました！',
      failureLabel: 'タグ削除に失敗しました',
      onSuccess: loadTags
    });
  } catch (err) {
    console.error('タグ削除エラー:', err);
    alert('タグ削除エラー: ' + err.message);
  }
}

// ===== アーティスト管理関数 =====
async function loadArtists() {
  try {
    const res = await fetch('/artists');
    
    if (!res.ok) {
      console.error('アーティスト読み込み失敗。ステータス:', res.status);
      return;
    }

    const artists = await res.json();
    
    if (!Array.isArray(artists)) {
      console.warn('アーティストが見つかりません');
      return;
    }

    // テーブル表示
    const tbody = document.getElementById('artistList');
    if (!tbody) {
      console.warn('artistList要素が見つかりません');
      return;
    }
    tbody.innerHTML = "";
    detailData.artists.clear();

    artists.forEach(artist => {
      detailData.artists.set(Number(artist.artist_id), artist);
      const tr = document.createElement('tr');
      const artistNameArg = escapeForSingleQuote(artist.artist_name || '');
      const dob = (artist.date_of_birth || '').substring(0, 10);
      const started = (artist.started_at || '').substring(0, 10);
      const ended = (artist.ended_at || '').substring(0, 10);
      tr.innerHTML = `
        <td>${escapeHtml(artist.artist_name)}</td>
        <td>${escapeHtml(dob)}</td>
        <td>${escapeHtml(started)}</td>
        <td>${escapeHtml(ended)}</td>
        <td>
          <button class="btn-more" onclick="openArtistDetail(${artist.artist_id})">More</button>
          <button class="btn-edit" onclick="openEditArtistModal(${artist.artist_id}, '${artistNameArg}', '${escapeForSingleQuote(dob)}', '${escapeForSingleQuote(started)}', '${escapeForSingleQuote(ended)}')" style="margin-right: 5px;">Edit</button>
          <button class="btn-delete" onclick="deleteArtist(${artist.artist_id}, '${artistNameArg}')" style="margin-left: 5px;">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    console.log(`${artists.length}件のアーティストを読み込みました`);

  } catch (err) {
    console.error('アーティスト読み込み失敗:', err);
  }
}

async function addArtist(event) {
  event.preventDefault();

  const artistName = document.getElementById('artistName').value.trim();
  const dateOfBirth = document.getElementById('artistDoB').value || null;
  const startedAt = document.getElementById('artistStartDate').value || null;
  const endedAt = document.getElementById('artistEndDate').value || null;

  if (!artistName) {
    alert('アーティスト名を入力してください');
    return;
  }

  try {
    console.log('アーティスト追加:', { artistName, dateOfBirth, startedAt, endedAt });

    const { response: creatorRes, payload } = await createCreatorWithType(artistName, 'SOLO');
    if (!creatorRes.ok || !payload?.creator_id) {
      alert(`アーティスト登録に失敗しました: ${creatorRes.status} - ${payload?.error || '不明なエラー'}`);
      return;
    }

    const creatorId = Number(payload.creator_id);
    await runMutation({
      url: `/artists/${creatorId}`,
      method: 'PUT',
      body: {
        creator_id: creatorId,
        date_of_birth: dateOfBirth,
        started_at: startedAt,
        ended_at: endedAt
      },
      successMessage: 'アーティストを登録しました！',
      failureLabel: 'アーティストの登録に失敗しました',
      onSuccess: async () => {
        document.getElementById('addArtistForm').reset();
        await loadCreators();
        await loadArtists();
      }
    });
  } catch (err) {
    console.error('アーティスト登録エラー:', err);
    alert('アーティスト登録エラー: ' + err.message);
  }
}

function openEditArtistModal(artistId, artistName, dateOfBirth, startedAt, endedAt) {
  document.getElementById('editArtistId').value = artistId;
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

  const artistId = Number(document.getElementById('editArtistId').value);
  const artistName = document.getElementById('editArtistName').value.trim();
  const dateOfBirth = document.getElementById('editArtistDoB').value || null;
  const startedAt = document.getElementById('editArtistStartDate').value || null;
  const endedAt = document.getElementById('editArtistEndDate').value || null;

  if (!artistName) {
    alert('アーティスト名を入力してください');
    return;
  }

  try {
    console.log('アーティスト更新:', { artistId, artistName, dateOfBirth, startedAt, endedAt });

    const renameRes = await fetch(`/creators/${artistId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creator_name: artistName,
        creator_type: 'SOLO'
      })
    });
    const renameText = await renameRes.text();
    if (!renameRes.ok) {
      alert(`アーティスト名更新に失敗しました: ${renameRes.status} - ${renameText}`);
      return;
    }

    await runMutation({
      url: `/artists/${artistId}`,
      method: 'PUT',
      body: {
        creator_id: artistId,
        date_of_birth: dateOfBirth,
        started_at: startedAt,
        ended_at: endedAt
      },
      successMessage: 'アーティストを更新しました！',
      failureLabel: 'アーティストの更新に失敗しました',
      onSuccess: async () => {
        closeEditArtistModal();
        await loadCreators();
        await loadArtists();
      }
    });
  } catch (err) {
    console.error('アーティスト更新エラー:', err);
    alert('アーティスト更新エラー: ' + err.message);
  }
}

async function deleteArtist(artistId, artistName) {
  if (!confirm(`アーティスト "${artistName}" を削除してもよろしいですか？`)) {
    return;
  }

  try {
    console.log('アーティスト削除:', artistId);
    await runMutation({
      url: `/artists/${artistId}`,
      method: 'DELETE',
      successMessage: 'アーティストを削除しました！',
      failureLabel: 'アーティストの削除に失敗しました',
      onSuccess: loadArtists
    });
  } catch (err) {
    console.error('アーティスト削除エラー:', err);
    alert('アーティスト削除エラー: ' + err.message);
  }
}

// ===== グループ管理関数 =====
async function loadGroups() {
  try {
    const res = await fetch('/groups');
    
    if (!res.ok) {
      console.error('グループ読み込み失敗。ステータス:', res.status);
      return;
    }

    const groups = await res.json();
    
    if (!Array.isArray(groups)) {
      console.warn('グループが見つかりません');
      return;
    }

    // テーブル表示
    const tbody = document.getElementById('groupList');
    if (!tbody) {
      console.warn('groupList要素が見つかりません');
      return;
    }
    tbody.innerHTML = "";
    detailData.groups.clear();

    groups.forEach(group => {
      detailData.groups.set(Number(group.group_id), group);
      const tr = document.createElement('tr');
      const groupNameArg = escapeForSingleQuote(group.group_name || '');
      const formationDate = (group.formation_date || '').substring(0, 10);
      const dissolutionDate = (group.dissolution_date || '').substring(0, 10);
      tr.innerHTML = `
        <td>${escapeHtml(group.group_name)}</td>
        <td>${escapeHtml(formationDate)}</td>
        <td>${escapeHtml(dissolutionDate)}</td>
        <td>
          <button class="btn-add" onclick="openAddMembersModal(${group.group_id}, '${groupNameArg}')">Add Artists</button>
          <button class="btn-more" onclick="openGroupDetail(${group.group_id})">More</button>
          <button class="btn-edit" onclick="openEditGroupModal(${group.group_id}, '${groupNameArg}', '${escapeForSingleQuote(formationDate)}', '${escapeForSingleQuote(dissolutionDate)}')" style="margin-right: 5px;">Edit</button>
          <button class="btn-delete" onclick="deleteGroup(${group.group_id}, '${groupNameArg}')" style="margin-left: 5px;">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    console.log(`${groups.length}件のグループを読み込みました`);

  } catch (err) {
    console.error('グループ読み込み失敗:', err);
  }
}

async function addGroup(event) {
  event.preventDefault();

  const groupName = document.getElementById('groupName').value.trim();
  const formationDate = document.getElementById('groupFormationDate').value || null;
  const dissolutionDate = document.getElementById('groupDissolutionDate').value || null;

  if (!groupName) {
    alert('グループ名を入力してください');
    return;
  }

  try {
    console.log('グループ追加:', { groupName, formationDate, dissolutionDate });

    const { response: creatorRes, payload } = await createCreatorWithType(groupName, 'GROUP');
    if (!creatorRes.ok || !payload?.creator_id) {
      alert(`グループ登録に失敗しました: ${creatorRes.status} - ${payload?.error || '不明なエラー'}`);
      return;
    }

    const creatorId = Number(payload.creator_id);
    await runMutation({
      url: `/groups/${creatorId}`,
      method: 'PUT',
      body: {
        formation_date: formationDate,
        dissolution_date: dissolutionDate
      },
      successMessage: 'グループを登録しました！',
      failureLabel: 'グループの登録に失敗しました',
      onSuccess: async () => {
        document.getElementById('addGroupForm').reset();
        await loadCreators();
        await loadGroups();
      }
    });
  } catch (err) {
    console.error('グループ登録エラー:', err);
    alert('グループ登録エラー: ' + err.message);
  }
}

async function openAddMembersModal(groupId, groupName) {
  document.getElementById('addMembersGroupId').value = groupId;
  document.getElementById('addMembersGroupName').textContent = groupName;

  try {
    const [membersRes, availableRes] = await Promise.all([
      fetch(`/groups/${groupId}/members`),
      fetch(`/groups/${groupId}/available-artists`)
    ]);

    const members = await membersRes.json();
    const availableArtists = await availableRes.json();

    const membersList = document.getElementById('groupMembersList');
    const availableList = document.getElementById('availableArtistsList');
    membersList.innerHTML = '';
    availableList.innerHTML = '';

    if (!Array.isArray(members) || members.length === 0) {
      membersList.innerHTML = '<p>現在メンバーはいません</p>';
    } else {
      members.forEach((member) => {
        const row = document.createElement('div');
        row.style.marginBottom = '8px';
        row.textContent = `${member.artist_name}`;
        membersList.appendChild(row);
      });
    }

    if (!Array.isArray(availableArtists) || availableArtists.length === 0) {
      availableList.innerHTML = '<p>追加可能なアーティストがいません</p>';
      document.getElementById('addMembersModal').style.display = 'block';
      return;
    }

    availableArtists.forEach((artist) => {
      const wrapper = document.createElement('div');
      wrapper.style.marginBottom = '10px';

      const label = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = 'artistCheckbox';
      checkbox.value = artist.artist_id;

      const text = document.createTextNode(` ${artist.artist_name}`);
      label.appendChild(checkbox);
      label.appendChild(text);
      wrapper.appendChild(label);
      availableList.appendChild(wrapper);
    });

    document.getElementById('addMembersModal').style.display = 'block';
  } catch (err) {
    console.error('グループメンバー候補の読み込み失敗:', err);
    alert('グループメンバー候補の読み込みに失敗しました: ' + err.message);
  }
}

function closeAddMembersModal() {
  document.getElementById('addMembersModal').style.display = 'none';
}

async function saveMembersToGroup(event) {
  event.preventDefault();

  const groupId = document.getElementById('addMembersGroupId').value;
  const groupName = document.getElementById('addMembersGroupName').textContent;
  const checkboxes = document.querySelectorAll('input[name="artistCheckbox"]:checked');

  if (checkboxes.length === 0) {
    alert('1人以上のアーティストを選択してください');
    return;
  }

  const artistIds = Array.from(checkboxes).map((cb) => Number(cb.value));

  try {
    console.log('グループへアーティスト追加:', { groupId, artistIds });
    await runMutation({
      url: `/groups/${groupId}/members`,
      method: 'POST',
      body: { artist_ids: artistIds },
      successMessage: 'グループにアーティストを追加しました！',
      failureLabel: 'アーティスト追加に失敗しました',
      onSuccess: async () => openAddMembersModal(groupId, groupName)
    });
  } catch (err) {
    console.error('グループメンバー追加エラー:', err);
    alert('グループメンバー追加エラー: ' + err.message);
  }
}

function openEditGroupModal(groupId, groupName, formationDate, dissolutionDate) {
  document.getElementById('editGroupId').value = groupId;
  document.getElementById('editGroupName').value = groupName;

  document.getElementById('editGroupFormationDate').value =
    formationDate ? formationDate.split('T')[0] : '';

  document.getElementById('editGroupDissolutionDate').value =
    dissolutionDate ? dissolutionDate.split('T')[0] : '';

  document.getElementById('editGroupModal').style.display = 'block';
}

function closeEditGroupModal() {
  document.getElementById('editGroupModal').style.display = 'none';
}

async function updateGroup(event) {
  event.preventDefault();

  const groupId = Number(document.getElementById('editGroupId').value);
  const groupName = document.getElementById('editGroupName').value.trim();
  const formationDate = document.getElementById('editGroupFormationDate').value || null;
  const dissolutionDate = document.getElementById('editGroupDissolutionDate').value || null;

  if (!groupName) {
    alert('グループ名を入力してください');
    return;
  }

  try {
    console.log('グループ更新:', { groupId, groupName, formationDate, dissolutionDate });

    const renameRes = await fetch(`/creators/${groupId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creator_name: groupName,
        creator_type: 'GROUP'
      })
    });
    const renameText = await renameRes.text();
    if (!renameRes.ok) {
      alert(`グループ名更新に失敗しました: ${renameRes.status} - ${renameText}`);
      return;
    }

    await runMutation({
      url: `/groups/${groupId}`,
      method: 'PUT',
      body: {
        formation_date: formationDate,
        dissolution_date: dissolutionDate
      },
      successMessage: 'グループを更新しました！',
      failureLabel: 'グループの更新に失敗しました',
      onSuccess: async () => {
        closeEditGroupModal();
        await loadCreators();
        await loadGroups();
      }
    });
  } catch (err) {
    console.error('グループ更新エラー:', err);
    alert('グループ更新エラー: ' + err.message);
  }
}

async function deleteGroup(groupId, groupName) {
  if (!confirm(`グループ "${groupName}" を削除してもよろしいですか？`)) {
    return;
  }

  try {
    console.log('グループ削除:', groupId);
    await runMutation({
      url: `/groups/${groupId}`,
      method: 'DELETE',
      successMessage: 'グループを削除しました！',
      failureLabel: 'グループの削除に失敗しました',
      onSuccess: loadGroups
    });
  } catch (err) {
    console.error('グループ削除エラー:', err);
    alert('グループ削除エラー: ' + err.message);
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
  if (form) form.addEventListener('submit', addSong);

  const editForm = document.getElementById('editSongForm');
  if (editForm) editForm.addEventListener('submit', updateSong);

  // アルバムフォーム
  const albumForm = document.getElementById('addAlbumForm');
  if (albumForm) albumForm.addEventListener('submit', addAlbum);

  const editAlbumForm = document.getElementById('editAlbumForm');
  if (editAlbumForm) editAlbumForm.addEventListener('submit', updateAlbum);

  // タグフォーム
  const tagForm = document.getElementById('addTagForm');
  if (tagForm) tagForm.addEventListener('submit', addTag);

  const editTagForm = document.getElementById('editTagForm');
  if (editTagForm) editTagForm.addEventListener('submit', updateTag);

  // アーティストフォーム
  const artistForm = document.getElementById('addArtistForm');
  if (artistForm) artistForm.addEventListener('submit', addArtist);

  const editArtistForm = document.getElementById('editArtistForm');
  if (editArtistForm) editArtistForm.addEventListener('submit', updateArtist);

  // グループフォーム
  const groupForm = document.getElementById('addGroupForm');
  if (groupForm) groupForm.addEventListener('submit', addGroup);

  const editGroupForm = document.getElementById('editGroupForm');
  if (editGroupForm) editGroupForm.addEventListener('submit', updateGroup);

  // 曲編集モーダルの閉じる処理
  const modal = document.getElementById('editModal');
  const closeBtn = document.querySelector('.close');
  const cancelBtn = document.getElementById('cancelEdit');

  if (closeBtn) closeBtn.onclick = closeEditModal;
  if (cancelBtn) cancelBtn.onclick = closeEditModal;

  // アルバム編集モーダルの閉じる処理
  const albumModal = document.getElementById('editAlbumModal');
  const closeAlbumBtn = document.querySelector('.close-album');
  const cancelAlbumBtn = document.getElementById('cancelEditAlbum');

  if (closeAlbumBtn) closeAlbumBtn.onclick = closeEditAlbumModal;
  if (cancelAlbumBtn) cancelAlbumBtn.onclick = closeEditAlbumModal;

  // 詳細確認モーダルの閉じる処理
  const detailModal = document.getElementById('detailModal');
  const closeDetailBtn = document.querySelector('.close-detail');
  const closeDetailModalBtn = document.getElementById('closeDetailModal');
  if (closeDetailBtn) closeDetailBtn.onclick = closeDetailModal;
  if (closeDetailModalBtn) closeDetailModalBtn.onclick = closeDetailModal;

  // タグ編集モーダルの閉じる処理
  const tagModal = document.getElementById('editTagModal');
  if (tagModal) {
    const closeTagBtn = tagModal.querySelector('.close-tag');
    const cancelTagBtn = document.getElementById('cancelEditTag');

    if (closeTagBtn) closeTagBtn.onclick = closeEditTagModal;
    if (cancelTagBtn) cancelTagBtn.onclick = closeEditTagModal;

  }

  // アーティスト編集モーダルの閉じる処理
  const artistModal = document.getElementById('editArtistModal');
  if (artistModal) {
    const closeArtistBtn = artistModal.querySelector('.close-artist');
    const cancelArtistBtn = document.getElementById('cancelEditArtist');

    if (closeArtistBtn) closeArtistBtn.onclick = closeEditArtistModal;
    if (cancelArtistBtn) cancelArtistBtn.onclick = closeEditArtistModal;

  }

  // グループ編集モーダルの閉じる処理
  const groupModal = document.getElementById('editGroupModal');
  if (groupModal) {
    const closeGroupBtn = groupModal.querySelector('.close-group');
    const cancelGroupBtn = document.getElementById('cancelEditGroup');

    if (closeGroupBtn) closeGroupBtn.onclick = closeEditGroupModal;
    if (cancelGroupBtn) cancelGroupBtn.onclick = closeEditGroupModal;

  }

  // 曲選択モーダルの閉じる処理
  const songsModal = document.getElementById('addSongsModal');
  const closeSongsBtn = document.querySelector('.close-songs');
  const cancelSongsBtn = document.getElementById('cancelAddSongs');
  const addSongsForm = document.getElementById('addSongsForm');

  if (closeSongsBtn) closeSongsBtn.onclick = closeAddSongsModal;
  if (cancelSongsBtn) cancelSongsBtn.onclick = closeAddSongsModal;
  if (addSongsForm) addSongsForm.addEventListener('submit', saveSongsToAlbum);

  // 曲タグ紐付けモーダルの閉じる処理
  const tagsBindModal = document.getElementById('addTagsModal');
  const closeTagsBindBtn = document.querySelector('.close-tags');
  const cancelTagsBindBtn = document.getElementById('cancelAddTags');
  const addTagsForm = document.getElementById('addTagsForm');

  if (closeTagsBindBtn) closeTagsBindBtn.onclick = closeAddTagsModal;
  if (cancelTagsBindBtn) cancelTagsBindBtn.onclick = closeAddTagsModal;
  if (addTagsForm) addTagsForm.addEventListener('submit', saveTagsToMusic);

  // グループメンバー追加モーダルの閉じる処理
  const membersModal = document.getElementById('addMembersModal');
  const closeMembersBtn = document.querySelector('.close-members');
  const cancelMembersBtn = document.getElementById('cancelAddMembers');
  const addMembersForm = document.getElementById('addMembersForm');

  if (closeMembersBtn) closeMembersBtn.onclick = closeAddMembersModal;
  if (cancelMembersBtn) cancelMembersBtn.onclick = closeAddMembersModal;
  if (addMembersForm) addMembersForm.addEventListener('submit', saveMembersToGroup);

  // すべてのモーダルの外側クリックを1つのハンドラで処理
  window.addEventListener('click', (event) => {
    if (event.target === modal) closeEditModal();
    if (event.target === albumModal) closeEditAlbumModal();
    if (event.target === detailModal) closeDetailModal();
    if (tagModal && event.target === tagModal) closeEditTagModal();
    if (artistModal && event.target === artistModal) closeEditArtistModal();
    if (groupModal && event.target === groupModal) closeEditGroupModal();
    if (event.target === songsModal) closeAddSongsModal();
    if (tagsBindModal && event.target === tagsBindModal) closeAddTagsModal();
    if (membersModal && event.target === membersModal) closeAddMembersModal();
  });

  // 各編集用セレクトは loadCreators() で都度再構築する
});
