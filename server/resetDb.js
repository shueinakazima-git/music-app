const db = require('./db');

async function resetDatabase() {
  let conn;
  try {
    conn = await db.getConnection();
    console.log('データベースのリセットを開始します');

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
      await conn.execute(`DROP TABLE IF EXISTS ${table} CASCADE`);
      console.log(`削除: ${table}`);
    }

    console.log('データベースのリセットが完了しました');
  } catch (err) {
    console.error('リセットエラー:', err);
    process.exitCode = 1;
  } finally {
    if (conn) await conn.close();
  }
}

resetDatabase();
