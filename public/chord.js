let songs = [];

document.addEventListener("DOMContentLoaded", () => {
  const select = document.getElementById('songSelect');
  const button = document.getElementById('showChordBtn');
  const chordDisplay = document.getElementById('chordDisplay');

  button.addEventListener("click", showChord);

  loadSongs(); // 曲リストを読み込む

  async function loadSongs() {
    const res = await fetch('/music');
    songs = await res.json();

    select.innerHTML = "";

    songs.forEach(song => {
      const option = document.createElement('option');
      option.value = song.MUSIC_ID;
      option.textContent = song.MUSIC_TITLE;
      select.appendChild(option);
    });
  }

  async function showChord() {
    const musicId = Number(select.value);
    console.log("Selected musicId =", musicId);

    if (!musicId) {
      chordDisplay.innerHTML = "曲を選択してください";
      return;
    }

    const res = await fetch(`/music/${musicId}/chords`);
    console.log("Fetch status =", res.status);
    const chords = await res.json();
    console.log("Fetched chords:", chords);

    if (chords.length === 0) {
      chordDisplay.innerHTML = "コード進行が登録されていません";
      return;
    }

    let html = "<h2>Chord Progression</h2><div class='chord-grid'>";
    chords.forEach((row, i) => {
      html += `<span>${row.CHORD_NAME}</span>`;
      if ((i + 1) % 4 === 0) html += "<br>";
    });
    html += "</div>";

    chordDisplay.innerHTML = html;
  }
});
