document.addEventListener('DOMContentLoaded', () => {
  const TICKS_PER_BAR = 1920; // 4/4, 1beat=480ticks を前提
  const BARS_PER_ROW = 1;
  const MIN_POSITION_GAP = 0.12; // 同一レーン内の最小間隔（比率）

  const select = document.getElementById('songSelect');
  const button = document.getElementById('showChordBtn');
  const chordDisplay = document.getElementById('chordDisplay');

  button.addEventListener('click', showChord);
  loadSongs();

  async function loadSongs() {
    try {
      const res = await fetch('/music/with-chords');
      if (!res.ok) {
        throw new Error(`status ${res.status}`);
      }

      const data = await res.json();
      const uniqueSongs = [];
      const seen = new Set();

      (data || []).forEach((song) => {
        if (!song || !song.music_id || seen.has(song.music_id)) return;
        seen.add(song.music_id);
        uniqueSongs.push(song);
      });

      select.innerHTML = '<option value="">-- 曲を選択 --</option>';

      uniqueSongs.forEach((song) => {
        const option = document.createElement('option');
        option.value = song.music_id;
        option.textContent = song.music_title || `曲ID:${song.music_id}`;
        select.appendChild(option);
      });

      if (uniqueSongs.length === 0) {
        button.disabled = true;
        chordDisplay.textContent = '曲データがありません';
      }
    } catch (err) {
      console.error('曲一覧の読み込み失敗:', err);
      button.disabled = true;
      chordDisplay.textContent = '曲一覧の読み込みに失敗しました';
    }
  }

  function buildBars(chords) {
    const bars = new Map();

    (chords || []).forEach((row) => {
      const tick = Number(row.absolute_tick);
      if (!Number.isFinite(tick) || tick < 0) return;

      const barIndex = Math.floor(tick / TICKS_PER_BAR);
      const tickInBar = tick % TICKS_PER_BAR;
      const ratio = tickInBar / TICKS_PER_BAR;

      if (!bars.has(barIndex)) bars.set(barIndex, []);
      bars.get(barIndex).push({
        chordName: row.chord_name || '-',
        ratio
      });
    });

    if (bars.size === 0) return [];

    const maxBar = Math.max(...bars.keys());
    const result = [];
    for (let i = 0; i <= maxBar; i += 1) {
      const events = (bars.get(i) || []).sort((a, b) => a.ratio - b.ratio);
      result.push({ barIndex: i, events });
    }
    return result;
  }

  function assignLanes(events) {
    const laneLastRatio = [];

    events.forEach((event) => {
      let lane = 0;
      while (
        lane < laneLastRatio.length &&
        event.ratio - laneLastRatio[lane] < MIN_POSITION_GAP
      ) {
        lane += 1;
      }

      if (lane === laneLastRatio.length) laneLastRatio.push(-Infinity);
      laneLastRatio[lane] = event.ratio;
      event.lane = lane;
    });

    return Math.max(1, laneLastRatio.length);
  }

  function renderChordBars(chords) {
    chordDisplay.innerHTML = '';

    const heading = document.createElement('h2');
    heading.textContent = 'コード進行';
    chordDisplay.appendChild(heading);

    const sheet = document.createElement('div');
    sheet.className = 'chord-sheet';

    const bars = buildBars(chords);
    for (let i = 0; i < bars.length; i += BARS_PER_ROW) {
      const row = document.createElement('div');
      row.className = 'sheet-row';

      const chunk = bars.slice(i, i + BARS_PER_ROW);
      while (chunk.length < BARS_PER_ROW) {
        chunk.push({ barIndex: -1, events: [] });
      }

      chunk.forEach((barData) => {
        const bar = document.createElement('div');
        bar.className = 'bar-cell';

        const laneCount = assignLanes(barData.events);
        bar.style.setProperty('--lane-count', String(laneCount));

        const chordLayer = document.createElement('div');
        chordLayer.className = 'chord-layer';

        const measureLayer = document.createElement('div');
        measureLayer.className = 'measure-layer';

        for (let beat = 1; beat <= 3; beat += 1) {
          const beatLine = document.createElement('div');
          beatLine.className = 'beat-line';
          beatLine.style.left = `${(beat / 4) * 100}%`;
          measureLayer.appendChild(beatLine);
        }

        barData.events.forEach((event) => {
          const chord = document.createElement('span');
          chord.className = 'bar-chord';
          chord.textContent = event.chordName;
          chord.style.left = `${event.ratio * 100}%`;
          chord.style.top = `${6 + event.lane * 26}px`;

          chordLayer.appendChild(chord);
        });

        bar.appendChild(chordLayer);
        bar.appendChild(measureLayer);
        row.appendChild(bar);
      });

      sheet.appendChild(row);
    }

    chordDisplay.appendChild(sheet);
  }

  async function showChord() {
    const musicId = Number(select.value);
    if (!musicId) {
      chordDisplay.textContent = '曲を選択してください';
      return;
    }

    try {
      button.disabled = true;
      chordDisplay.textContent = 'コードを読み込み中...';

      const res = await fetch(`/music/${musicId}/chords`);
      if (!res.ok) {
        throw new Error(`status ${res.status}`);
      }

      const chords = await res.json();
      if (!Array.isArray(chords) || chords.length === 0) {
        chordDisplay.textContent = 'コード進行が登録されていません';
        return;
      }

      renderChordBars(chords);
    } catch (err) {
      console.error('コード進行の取得失敗:', err);
      chordDisplay.textContent = 'コード進行の取得に失敗しました';
    } finally {
      button.disabled = false;
    }
  }
});
