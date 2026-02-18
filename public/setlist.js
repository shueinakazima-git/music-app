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
    li.textContent = `${song.MUSIC_TITLE} - ${song.CREATOR_NAME} - ${song.BPM} BPM`;
    list.appendChild(li);
  });
}
