const fs = require('fs');
const path = require('path');
const db = require('./db');

const CONNECT_RETRY_DELAY_MS = Number(process.env.DB_CONNECT_RETRY_DELAY_MS) || 2000;
const CONNECT_MAX_RETRIES = Number(process.env.DB_CONNECT_MAX_RETRIES) || 30;

function splitSqlStatements(sqlText) {
  return sqlText
    .split(';')
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length > 0);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getConnectionWithRetry() {
  let lastError;

  for (let attempt = 1; attempt <= CONNECT_MAX_RETRIES; attempt += 1) {
    try {
      return await db.getConnection();
    } catch (err) {
      lastError = err;
      console.warn(
        `DB connection attempt ${attempt}/${CONNECT_MAX_RETRIES} failed: ${err.message}`
      );

      if (attempt < CONNECT_MAX_RETRIES) {
        await sleep(CONNECT_RETRY_DELAY_MS);
      }
    }
  }

  throw lastError;
}

async function executeSqlFile(conn, filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  const statements = splitSqlStatements(sql);

  for (const stmt of statements) {
    try {
      await conn.execute(stmt);
    } catch (err) {
      if (err?.code === '42P07') {
        continue;
      }
      throw err;
    }
  }
}

async function seedIfEmpty(conn) {
  const usersCount = await conn.execute(
    `SELECT COUNT(*)::int AS cnt
     FROM tbl_users`,
    []
  );

  if ((usersCount.rows[0]?.cnt || 0) > 0) {
    return;
  }

  await conn.execute(`BEGIN`);
  try {
    await conn.execute(
      `INSERT INTO tbl_users (user_name, date_of_birth)
       VALUES ($1, $2)`,
      ['John Doe', '1990-01-15']
    );

    const creators = [
      { name: 'Michael Jackson', type: 'SOLO' },
      { name: 'David Bowie', type: 'SOLO' },
      { name: 'Freddie Mercury', type: 'SOLO' },
      { name: 'The Beatles', type: 'GROUP' },
      { name: 'Queen', type: 'GROUP' },
      { name: 'Pink Floyd', type: 'GROUP' }
    ];

    for (const creator of creators) {
      await conn.execute(
        `INSERT INTO tbl_creators (creator_name, creator_type)
         VALUES ($1, $2)`,
        [creator.name, creator.type]
      );
    }

    const creatorsResult = await conn.execute(
      `SELECT creator_id, creator_name, creator_type
       FROM tbl_creators`,
      []
    );

    const creatorMap = new Map();
    creatorsResult.rows.forEach((row) => {
      creatorMap.set(row.creator_name, row.creator_id);
    });

    for (const row of creatorsResult.rows) {
      if (row.creator_type === 'SOLO') {
        await conn.execute(
          `INSERT INTO tbl_artists (artist_id, artist_name, started_at)
           VALUES ($1, $2, CURRENT_DATE)`,
          [row.creator_id, row.creator_name]
        );
      } else if (row.creator_type === 'GROUP') {
        await conn.execute(
          `INSERT INTO tbl_groups (group_id, group_name, formation_date)
           VALUES ($1, $2, CURRENT_DATE)`,
          [row.creator_id, row.creator_name]
        );
      }
    }

    const songs = [
      { title: 'Thriller', creator: 'Michael Jackson', bpm: 82, key: 'E', duration: 294 },
      { title: 'Billie Jean', creator: 'Michael Jackson', bpm: 117, key: 'F#', duration: 294 },
      { title: 'Heroes', creator: 'David Bowie', bpm: 108, key: 'G', duration: 423 },
      { title: 'Space Oddity', creator: 'David Bowie', bpm: 96, key: 'D', duration: 301 },
      { title: 'Let It Be', creator: 'The Beatles', bpm: 127, key: 'C', duration: 243 },
      { title: 'Come Together', creator: 'The Beatles', bpm: 83, key: 'A', duration: 259 },
      { title: 'Bohemian Rhapsody', creator: 'Queen', bpm: 55, key: 'B', duration: 354 },
      { title: 'We Will Rock You', creator: 'Queen', bpm: 81, key: 'A', duration: 143 },
      { title: 'Wish You Were Here', creator: 'Pink Floyd', bpm: 81, key: 'E', duration: 296 },
      { title: 'Comfortably Numb', creator: 'Pink Floyd', bpm: 68, key: 'G#m', duration: 406 }
    ];

    for (const song of songs) {
      const creatorId = creatorMap.get(song.creator);
      if (!creatorId) continue;
      await conn.execute(
        `INSERT INTO tbl_music (music_title, creator_id, bpm, musical_key, duration_seconds)
         VALUES ($1, $2, $3, $4, $5)`,
        [song.title, creatorId, song.bpm, song.key, song.duration]
      );
    }

    await conn.execute('COMMIT');
    console.log('初期データを投入しました');
  } catch (err) {
    await conn.execute('ROLLBACK');
    throw err;
  }
}

async function initializeDatabase() {
  let conn;
  try {
    conn = await getConnectionWithRetry();
    const ddlPath = path.join(__dirname, '..', 'query', 'create_table_postgres.sql');

    await executeSqlFile(conn, ddlPath);
    console.log('テーブル作成が完了しました');

    await seedIfEmpty(conn);
    console.log('データベース初期化に成功しました');
  } catch (err) {
    console.error('初期化エラー:', err);
    process.exitCode = 1;
  } finally {
    if (conn) await conn.close();
  }
}

initializeDatabase();
