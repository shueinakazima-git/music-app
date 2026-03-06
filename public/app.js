async function loadStats() {
  const res = await fetch('/music/stats');
  const data = await res.json();

  document.getElementById('totalAlbums').textContent = data.totalAlbums || 0;
  document.getElementById('totalSongs').textContent = data.totalSongs;
  document.getElementById('totalCreators').textContent = data.totalCreators;
  document.getElementById('totalGroups').textContent = data.totalGroups || 0;
  document.getElementById('totalArtists').textContent = data.totalArtists || 0;
}

loadStats();
