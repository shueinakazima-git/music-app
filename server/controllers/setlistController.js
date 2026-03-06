const db = require('../db');

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function normalizeDuration(seconds) {
  const parsed = Number(seconds);
  if (!Number.isFinite(parsed) || parsed <= 0) return 180;
  return Math.round(parsed);
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickWeightedSong(candidates, scoreFn) {
  const weighted = candidates.map((song) => {
    const score = Math.max(1, scoreFn(song));
    return { song, score };
  });

  const total = weighted.reduce((sum, item) => sum + item.score, 0);
  let threshold = Math.random() * total;

  for (const item of weighted) {
    threshold -= item.score;
    if (threshold <= 0) return item.song;
  }

  return weighted[weighted.length - 1].song;
}

function parseSelectedElements(rawElements) {
  const creators = new Set();
  const tags = new Set();

  (rawElements || []).forEach((value) => {
    const str = String(value || '');
    if (str.startsWith('creator:')) {
      const id = Number(str.slice('creator:'.length));
      if (!Number.isNaN(id)) creators.add(id);
    } else if (str.startsWith('tag:')) {
      const id = Number(str.slice('tag:'.length));
      if (!Number.isNaN(id)) tags.add(id);
    }
  });

  return {
    creatorIds: [...creators],
    tagIds: [...tags]
  };
}

function shouldIncludeSongByElements(song, creatorIds, tagIds) {
  if (creatorIds.length === 0 && tagIds.length === 0) return true;
  if (creatorIds.includes(song.creator_id)) return true;
  if (tagIds.length > 0) {
    const songTagIds = Array.isArray(song.tag_ids) ? song.tag_ids : [];
    return songTagIds.some((tagId) => tagIds.includes(Number(tagId)));
  }
  return false;
}

function createPreferenceScorer({ preferBpm, bpmMin, bpmMax, preferKey, key }) {
  const normalizedKey = key ? String(key).trim().toLowerCase() : null;

  return (song) => {
    let score = 1;

    if (preferBpm) {
      const bpm = toNumberOrNull(song.bpm);
      if (bpm !== null) {
        const min = bpmMin ?? -Infinity;
        const max = bpmMax ?? Infinity;
        if (bpm >= min && bpm <= max) score += 3;
      }
    }

    if (preferKey && normalizedKey) {
      const songKey = (song.musical_key || '').toString().trim().toLowerCase();
      if (songKey && songKey === normalizedKey) score += 3;
    }

    return score;
  };
}

function buildRandomSetlist(candidates, options) {
  const target = Math.max(60, options.targetSeconds);
  const limit = Math.max(1, options.maxSongs);
  const tolerance = 30;
  const allowDuplicates = !!options.allowDuplicates;
  const scoreFn = createPreferenceScorer(options);

  let bestSongs = [];
  let bestTotal = 0;
  let bestDiff = Infinity;

  for (let t = 0; t < 120; t += 1) {
    let pool = shuffle(candidates);
    const selected = [];
    let total = 0;

    while (selected.length < limit && pool.length > 0) {
      const song = pickWeightedSong(pool, scoreFn);
      const duration = normalizeDuration(song.duration_seconds);

      if (total + duration <= target + tolerance || selected.length === 0) {
        selected.push({ ...song, duration_seconds: duration });
        total += duration;
      }

      if (!allowDuplicates) {
        pool = pool.filter((s) => s.music_id !== song.music_id);
      }

      if (total >= target - 20) break;
      if (allowDuplicates && selected.length >= limit) break;
    }

    if (selected.length > 0) {
      const diff = Math.abs(target - total);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestSongs = selected;
        bestTotal = total;
      }
    }
  }

  return {
    songs: bestSongs,
    totalDurationSeconds: bestTotal
  };
}

async function getSetlistOptions(req, res) {
  let conn;
  try {
    conn = await db.getConnection();

    const creatorsResult = await conn.execute(
      `SELECT creator_id, creator_name
       FROM tbl_creators
       ORDER BY creator_name`,
      []
    );

    const tagsResult = await conn.execute(
      `SELECT tag_id, tag_name
       FROM tbl_tags
       WHERE deleted_at IS NULL
       ORDER BY tag_name`,
      []
    );

    const elements = [
      ...creatorsResult.rows.map((creator) => ({
        value: `creator:${creator.creator_id}`,
        label: `Creator: ${creator.creator_name}`
      })),
      ...tagsResult.rows.map((tag) => ({
        value: `tag:${tag.tag_id}`,
        label: `Tag: ${tag.tag_name}`
      }))
    ];

    res.json({ elements });
  } catch (err) {
    console.error('セットリスト条件取得エラー:', err.message);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  } finally {
    if (conn) await conn.close();
  }
}

async function generateSetlist(req, res) {
  let conn;
  try {
    const {
      target_minutes,
      selected_elements,
      allow_duplicates,
      prefer_bpm,
      bpm_min,
      bpm_max,
      prefer_key,
      musical_key,
      max_songs
    } = req.body || {};

    const targetMinutes = toNumberOrNull(target_minutes);
    if (!targetMinutes || targetMinutes <= 0) {
      return res.status(400).json({ error: '目標時間（分）は1以上で指定してください' });
    }

    const selectedElements = Array.isArray(selected_elements) ? selected_elements : [];
    if (selectedElements.length > 5) {
      return res.status(400).json({ error: '要素は最大5件までです' });
    }

    const { creatorIds, tagIds } = parseSelectedElements(selectedElements);

    const targetSeconds = Math.round(targetMinutes * 60);
    const maxSongs = toNumberOrNull(max_songs) || 20;

    const preferBpm = Boolean(prefer_bpm);
    const preferKey = Boolean(prefer_key);
    const bpmMin = preferBpm ? toNumberOrNull(bpm_min) : null;
    const bpmMax = preferBpm ? toNumberOrNull(bpm_max) : null;
    const key = preferKey ? (musical_key || '').trim() || null : null;

    conn = await db.getConnection();

    const result = await conn.execute(
      `SELECT
         m.music_id,
         m.music_title,
         m.creator_id,
         m.bpm,
         m.musical_key,
         m.duration_seconds,
         c.creator_name,
         COALESCE(
           ARRAY_AGG(mt.tag_id) FILTER (WHERE mt.tag_id IS NOT NULL),
           '{}'::INTEGER[]
         ) AS tag_ids
       FROM tbl_music m
       JOIN tbl_creators c
         ON m.creator_id = c.creator_id
       LEFT JOIN tbl_music_tags mt
         ON mt.music_id = m.music_id
       GROUP BY
         m.music_id,
         m.music_title,
         m.creator_id,
         m.bpm,
         m.musical_key,
         m.duration_seconds,
         c.creator_name
       ORDER BY m.music_id`,
      []
    );

    const allCandidates = result.rows || [];
    const filteredCandidates = allCandidates.filter((song) =>
      shouldIncludeSongByElements(song, creatorIds, tagIds)
    );

    if (filteredCandidates.length === 0) {
      return res.json({
        songs: [],
        target_duration_seconds: targetSeconds,
        total_duration_seconds: 0,
        candidate_count: 0
      });
    }

    const built = buildRandomSetlist(filteredCandidates, {
      targetSeconds,
      maxSongs,
      allowDuplicates: Boolean(allow_duplicates),
      preferBpm,
      bpmMin,
      bpmMax,
      preferKey,
      key
    });

    res.json({
      songs: built.songs,
      target_duration_seconds: targetSeconds,
      total_duration_seconds: built.totalDurationSeconds,
      candidate_count: filteredCandidates.length
    });
  } catch (err) {
    console.error('セットリスト生成エラー:', err.message);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  } finally {
    if (conn) await conn.close();
  }
}

async function saveSetlist(req, res) {
  let conn;
  try {
    const { setlist_name, music_ids, user_id } = req.body || {};
    const name = (setlist_name || '').trim();
    if (!name) {
      return res.status(400).json({ error: 'セットリスト名は必須です' });
    }

    if (!Array.isArray(music_ids) || music_ids.length === 0) {
      return res.status(400).json({ error: '保存する曲がありません' });
    }

    const musicIds = music_ids
      .map((id) => Number(id))
      .filter((id) => !Number.isNaN(id));

    if (musicIds.length === 0) {
      return res.status(400).json({ error: '保存する曲がありません' });
    }

    const userId = toNumberOrNull(user_id) || 1;

    conn = await db.getConnection();
    await conn.execute('BEGIN');

    const setlistResult = await conn.execute(
      `INSERT INTO tbl_setlists (setlist_name, user_id, created_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       RETURNING setlist_id`,
      [name, userId]
    );

    const setlistId = setlistResult.rows[0]?.setlist_id;

    for (let i = 0; i < musicIds.length; i += 1) {
      await conn.execute(
        `INSERT INTO tbl_setlist_music (setlist_id, music_id, track_number)
         VALUES ($1, $2, $3)`,
        [setlistId, musicIds[i], i + 1]
      );
    }

    await conn.execute('COMMIT');
    res.status(201).json({
      message: 'セットリストを保存しました',
      setlist_id: setlistId
    });
  } catch (err) {
    if (conn) await conn.execute('ROLLBACK');
    console.error('セットリスト保存エラー:', err.message);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  } finally {
    if (conn) await conn.close();
  }
}

module.exports = {
  getSetlistOptions,
  generateSetlist,
  saveSetlist
};
