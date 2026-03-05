const db = require('./db');

async function resetDatabase() {
  let conn;
  try {
    conn = await db.getConnection();
    const isPg = db.dbType === 'postgres';

    console.log('データベースに接続しました。リセットを開始します...\n');

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
        console.log(`✓ ${table} を削除しました`);
      } catch (err) {
        if (!isPg && err.errorNum === 942) {
          console.log(`  ${table} は存在しないためスキップします`);
        } else {
          throw err;
        }
      }
    }

    console.log('\n✅ データベースのリセットが完了しました！\n');
    console.log('次を実行してください: node server/initDb.js');

  } catch (err) {
    console.error('❌ エラー:', err.message || err);
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (err) {
        console.error('接続クローズエラー:', err);
      }
    }
  }
}

resetDatabase();
