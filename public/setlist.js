let generatedSongs = [];

function formatDuration(seconds) {
  const total = Number(seconds) || 0;
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
}

function getSelectedElements() {
  return [...new Set(getElementSlotValues())];
}

function hasDuplicateElementSelection() {
  const values = getElementSlotValues();
  return new Set(values).size !== values.length;
}

function getElementSlotValues() {
  const slots = [1, 2, 3, 4, 5];
  return slots
    .map((idx) => document.getElementById(`elementSlot${idx}`)?.value || '')
    .filter((v) => v !== '');
}

function toggleBpmRangeVisibility() {
  const preferBpm = document.getElementById('preferBpm').checked;
  const container = document.getElementById('bpmRangeContainer');
  const bpmMin = document.getElementById('bpmMin');
  const bpmMax = document.getElementById('bpmMax');

  container.style.display = preferBpm ? 'block' : 'none';
  bpmMin.disabled = !preferBpm;
  bpmMax.disabled = !preferBpm;
}

function toggleKeyFilterVisibility() {
  const preferKey = document.getElementById('preferKey').checked;
  const container = document.getElementById('keyFilterContainer');
  const keyFilter = document.getElementById('keyFilter');

  container.style.display = preferKey ? 'block' : 'none';
  keyFilter.disabled = !preferKey;
}

async function loadOptions() {
  try {
    const res = await fetch('/setlists/options');
    if (!res.ok) throw new Error(`status ${res.status}`);

    const data = await res.json();
    const elements = data.elements || [];

    [1, 2, 3, 4, 5].forEach((slotNo) => {
      const select = document.getElementById(`elementSlot${slotNo}`);
      if (!select) return;

      elements.forEach((element) => {
        const option = document.createElement('option');
        option.value = element.value;
        option.textContent = element.label;
        select.appendChild(option);
      });
    });
  } catch (err) {
    console.error('セットリスト条件の読み込み失敗:', err);
    alert('セットリスト条件の読み込みに失敗しました');
  }
}

function renderSetlist(songs, targetSeconds, totalSeconds, candidateCount) {
  const list = document.getElementById('setlist');
  const summary = document.getElementById('setlistSummary');
  const saveBtn = document.getElementById('saveSetlistBtn');

  list.innerHTML = '';

  if (!songs || songs.length === 0) {
    summary.textContent = `条件に一致する曲がありません（候補: ${candidateCount}曲）`;
    saveBtn.disabled = true;
    return;
  }

  songs.forEach((song, index) => {
    const li = document.createElement('li');
    li.textContent = `${index + 1}. ${song.music_title} - ${song.creator_name} - ${formatDuration(song.duration_seconds)}`;
    list.appendChild(li);
  });

  summary.textContent =
    `目標: ${formatDuration(targetSeconds)} / 合計: ${formatDuration(totalSeconds)} / 候補: ${candidateCount}曲 / 採用: ${songs.length}曲`;
  saveBtn.disabled = false;
}

async function generateSetlist(event) {
  event.preventDefault();

  const targetMinutes = Number(document.getElementById('targetMinutes').value);
  const selectedElements = getSelectedElements();
  const allowDuplicates = document.getElementById('allowDuplicates').checked;
  const preferBpm = document.getElementById('preferBpm').checked;
  const bpmMin = preferBpm ? (document.getElementById('bpmMin').value || null) : null;
  const bpmMax = preferBpm ? (document.getElementById('bpmMax').value || null) : null;
  const preferKey = document.getElementById('preferKey').checked;
  const key = document.getElementById('keyFilter').value.trim() || null;
  const maxSongs = Number(document.getElementById('maxSongs').value) || 20;

  if (!targetMinutes || targetMinutes < 1) {
    alert('目標時間（分）を正しく入力してください');
    return;
  }

  if (hasDuplicateElementSelection()) {
    alert('同じ要素を複数スロットで選択しています');
    return;
  }

  try {
    const response = await fetch('/setlists/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        target_minutes: targetMinutes,
        selected_elements: selectedElements,
        allow_duplicates: allowDuplicates,
        prefer_bpm: preferBpm,
        bpm_min: bpmMin,
        bpm_max: bpmMax,
        prefer_key: preferKey,
        musical_key: key,
        max_songs: maxSongs
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      alert(payload?.error || 'セットリスト生成に失敗しました');
      return;
    }

    generatedSongs = payload.songs || [];
    renderSetlist(
      generatedSongs,
      payload.target_duration_seconds || targetMinutes * 60,
      payload.total_duration_seconds || 0,
      payload.candidate_count || 0
    );
  } catch (err) {
    console.error('セットリスト生成エラー:', err);
    alert('セットリスト生成に失敗しました');
  }
}

async function saveSetlist(event) {
  event.preventDefault();

  if (!generatedSongs || generatedSongs.length === 0) {
    alert('保存するセットリストがありません');
    return;
  }

  const setlistNameInput = document.getElementById('setlistName');
  const fallbackName = `セトリ_${new Date().toISOString().slice(0, 10)}`;
  const setlistName = setlistNameInput.value.trim() || fallbackName;

  try {
    const response = await fetch('/setlists', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        setlist_name: setlistName,
        music_ids: generatedSongs.map((song) => song.music_id),
        user_id: 1
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      alert(payload?.error || 'セットリスト保存に失敗しました');
      return;
    }

    alert(`セットリストを保存しました（ID: ${payload.setlist_id}）`);
    setlistNameInput.value = setlistName;
  } catch (err) {
    console.error('セットリスト保存エラー:', err);
    alert('セットリスト保存に失敗しました');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadOptions();
  toggleBpmRangeVisibility();
  toggleKeyFilterVisibility();

  const generateForm = document.getElementById('generateSetlistForm');
  const saveForm = document.getElementById('saveSetlistForm');
  const preferBpm = document.getElementById('preferBpm');
  const preferKey = document.getElementById('preferKey');

  generateForm.addEventListener('submit', generateSetlist);
  saveForm.addEventListener('submit', saveSetlist);
  preferBpm.addEventListener('change', toggleBpmRangeVisibility);
  preferKey.addEventListener('change', toggleKeyFilterVisibility);
});
