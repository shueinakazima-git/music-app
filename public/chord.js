let songs = [];

async function loadSongs() {
  const res = await fetch('/music');
  songs = await res.json();

  const select = document.getElementById('songSelect');

  songs.forEach(song => {
    const option = document.createElement('option');
    option.value = song.MUSIC_ID;
    option.textContent = song.MUSIC_TITLE;
    select.appendChild(option);
  });
}

function showChord() {
  const select = document.getElementById('songSelect');
  const selectedId = parseInt(select.value);

  const song = songs.find(s => s.MUSIC_ID === selectedId);

  const chordDisplay = document.getElementById('chordDisplay');

  // 仮コード（BPMで変える）
  let chord;

  if (song.BPM >= 130) {
    chord = "C - G - Am - F";
  } else if (song.BPM >= 100) {
    chord = "G - D - Em - C";
  } else {
    chord = "Am - F - C - G";
  }

  chordDisplay.innerHTML = `
    <h2>${song.MUSIC_TITLE}</h2>
    <p>Chord Progression:</p>
    <strong>${chord}</strong>
  `;
}

loadSongs();
