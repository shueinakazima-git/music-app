async function generateSetlist() {
  const res = await fetch('/music');
  const data = await res.json();

  const list = document.getElementById('setlist');
  list.innerHTML = "";

  // 配列をシャッフル
  const shuffled = data.sort(() => 0.5 - Math.random());

  // 3曲取得
  const selected = shuffled.slice(0, 3);

  selected.forEach(song => {
    const li = document.createElement('li');
    li.textContent = `${song.music_title} - ${song.creator_name} - ${song.bpm} BPM`;
    list.appendChild(li);
  });
}
