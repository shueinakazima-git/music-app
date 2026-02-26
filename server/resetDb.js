const db = require('./db');

async function resetDatabase() {
  let conn;
  try {
    conn = await db.getConnection();
    const isPg = db.dbType === 'postgres';

    console.log('Connected to database. Starting reset...\n');

    // テーブルをDROP（外部キー制約のため逆順）
    const tables = [
      'tbl_chord_progression',
      'tbl_music_tags',
      'tbl_chords',
      'tbl_group_members',
      'tbl_setlist_music',
      'tbl_setlists',
      'tbl_user_owned_music',
      'tbl_album_music',
      'tbl_albums',
      'tbl_music',
      'tbl_artists',
      'tbl_groups',
      'tbl_creators',
      'tbl_tags',
      'tbl_users'
    ];

    for (const table of tables) {
      const sql = isPg
        ? `DROP TABLE IF EXISTS ${table} CASCADE`
        : `DROP TABLE ${table}`;
      try {
        await conn.execute(sql);
        console.log(`✓ Dropped ${table}`);
      } catch (err) {
        if (!isPg && err.errorNum === 942) {
          console.log(`  ${table} does not exist (skipping)`);
        } else {
          throw err;
        }
      }
    }

    console.log('\n✅ Database reset completed!\n');
    console.log('Now run: node server/initDb.js');

  } catch (err) {
    console.error('❌ Error:', err.message || err);
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
}

resetDatabase();
