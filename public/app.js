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
  list.innerHTML = ""; // 念のため初期化

  data.forEach(song => {
    const li = document.createElement('li');
    li.textContent = `${song.MUSIC_TITLE} - ${song.CREATOR_NAME} - ${song.BPM} BPM`;
    list.appendChild(li);
  });
}

loadStats();
loadSongs();
