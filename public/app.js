async function loadStats() {
  const res = await fetch('/music/stats');
  const data = await res.json();

  document.getElementById('totalSongs').textContent = data.totalSongs;
  document.getElementById('totalCreators').textContent = data.totalCreators;
  document.getElementById('avgBpm').textContent = data.avgBpm || 0;
}

async function loadSongs() {
  const res = await fetch('/music');
  const data = await res.json();

  const list = document.getElementById('songList');
  if (!list) return;
  list.innerHTML = ""; // 念のため初期化

  (data || []).forEach(song => {
    const title = song.MUSIC_TITLE || song.music_title || song.title || '';
    const creator = song.CREATOR_NAME || song.creator_name || song.creator || '';
    const bpm = song.BPM ?? song.bpm ?? '';

    const li = document.createElement('li');
    li.textContent = `${title} - ${creator} - ${bpm} BPM`;
    list.appendChild(li);
  });
}

loadStats();
loadSongs();
