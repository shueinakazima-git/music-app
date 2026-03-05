const db = require('../db');

//
// 全グループ取得
//
async function getAllGroups(req, res) {
  let conn;

  try {
    conn = await db.getConnection();

    const result = await conn.execute(
      `SELECT 
         g.group_id,
         g.group_id AS creator_id,
         c.creator_name AS group_name,
         TO_CHAR(g.formation_date, 'YYYY-MM-DD') AS formation_date,
         TO_CHAR(g.dissolution_date, 'YYYY-MM-DD') AS dissolution_date
       FROM tbl_groups g
       JOIN tbl_creators c ON g.group_id = c.creator_id
       ORDER BY c.creator_name`,
      []
    );

    res.json(result.rows);

  } catch (err) {
    console.error('グループ取得エラー:', err.message);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  } finally {
    if (conn) await conn.close();
  }
}

//
// グループ作成
//
async function createGroup(req, res) {
  let conn;

  const { creator_id, formation_date, dissolution_date } = req.body;

  if (!creator_id) {
    return res.status(400).json({ error: 'クリエイターIDは必須です' });
  }

  try {
    conn = await db.getConnection();

    const creatorCheck = await conn.execute(
      `SELECT creator_name, creator_type
       FROM tbl_creators
       WHERE creator_id = $1`,
      [creator_id]
    );

    if (creatorCheck.rows.length === 0) {
      return res.status(400).json({ error: 'クリエイターが見つかりません' });
    }

    if (creatorCheck.rows[0].creator_type !== 'GROUP') {
      return res.status(400).json({ error: 'GROUPタイプのクリエイターのみグループ登録できます' });
    }

    const groupCheck = await conn.execute(
      `SELECT group_id
       FROM tbl_groups
       WHERE group_id = $1`,
      [creator_id]
    );

    if (groupCheck.rows.length > 0) {
      return res.status(400).json({ error: 'このクリエイターのグループは既に存在します' });
    }

    await conn.execute(
      `INSERT INTO tbl_groups
       (group_id, group_name, formation_date, dissolution_date)
       VALUES ($1, $2, $3, $4)`,
      [
        creator_id,
        creatorCheck.rows[0].creator_name,
        formation_date || null,
        dissolution_date || null
      ]
    );

    res.status(201).json({
      message: 'グループを作成しました',
      group_id: creator_id,
      creator_id: creator_id
    });

  } catch (err) {
    console.error('グループ作成エラー:', err.message);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  } finally {
    if (conn) await conn.close();
  }
}

//
// グループ更新
//
async function updateGroup(req, res) {
  let conn;

  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'IDが不正です' });
  }

  const { formation_date, dissolution_date } = req.body;

  try {
    conn = await db.getConnection();

    const result = await conn.execute(
      `UPDATE tbl_groups
       SET 
           formation_date = $1,
           dissolution_date = $2
       WHERE group_id = $3`,
      [
        formation_date || null,
        dissolution_date || null,
        id
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'グループが見つかりません' });
    }

    res.json({
      message: 'グループを更新しました',
      group_id: id
    });

  } catch (err) {
    console.error('グループ更新エラー:', err.message);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  } finally {
    if (conn) await conn.close();
  }
}

//
// グループ削除
//
async function deleteGroup(req, res) {
  let conn;

  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'IDが不正です' });
  }

  try {
    conn = await db.getConnection();

    const result = await conn.execute(
      `DELETE FROM tbl_groups WHERE group_id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'グループが見つかりません' });
    }

    res.json({ message: 'グループを削除しました' });

  } catch (err) {
    console.error('グループ削除エラー:', err.message);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  } finally {
    if (conn) await conn.close();
  }
}

//
// グループメンバー取得
//
async function getGroupMembers(req, res) {
  let conn;
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'IDが不正です' });
  }

  try {
    conn = await db.getConnection();

    const result = await conn.execute(
      `SELECT
         gm.artist_id,
         c.creator_name AS artist_name,
         gm.join_date,
         gm.leave_date
       FROM tbl_group_members gm
       JOIN tbl_artists a
         ON gm.artist_id = a.artist_id
       JOIN tbl_creators c
         ON a.artist_id = c.creator_id
       WHERE gm.group_id = $1
       ORDER BY c.creator_name`,
      [id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('グループメンバー取得エラー:', err.message);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  } finally {
    if (conn) await conn.close();
  }
}

//
// グループに追加可能なアーティスト取得
//
async function getAvailableArtists(req, res) {
  let conn;
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'IDが不正です' });
  }

  try {
    conn = await db.getConnection();

    const result = await conn.execute(
      `SELECT
         c.creator_id AS artist_id,
         c.creator_name AS artist_name
       FROM tbl_creators c
       WHERE c.creator_type = 'SOLO'
         AND c.creator_id NOT IN (
         SELECT gm.artist_id
         FROM tbl_group_members gm
         WHERE gm.group_id = $1
       )
       ORDER BY c.creator_name`,
      [id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('追加可能アーティスト取得エラー:', err.message);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  } finally {
    if (conn) await conn.close();
  }
}

//
// グループにメンバー追加
//
async function addMembersToGroup(req, res) {
  let conn;
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'IDが不正です' });
  }

  const { artist_ids } = req.body || {};
  if (!Array.isArray(artist_ids) || artist_ids.length === 0) {
    return res.status(400).json({ error: 'アーティストが指定されていません' });
  }

  const uniqueArtistIds = [...new Set(artist_ids.map((v) => Number(v)).filter((v) => !Number.isNaN(v)))];
  if (uniqueArtistIds.length === 0) {
    return res.status(400).json({ error: 'アーティストが指定されていません' });
  }

  try {
    conn = await db.getConnection();
    await conn.execute('BEGIN');

    for (const artistId of uniqueArtistIds) {
      const creatorResult = await conn.execute(
        `SELECT creator_name, creator_type
         FROM tbl_creators
         WHERE creator_id = $1`,
        [artistId]
      );

      if (creatorResult.rows.length === 0) {
        await conn.execute('ROLLBACK');
        return res.status(400).json({ error: `クリエイターID ${artistId} が存在しません` });
      }

      const creator = creatorResult.rows[0];
      if (creator.creator_type !== 'SOLO') {
        await conn.execute('ROLLBACK');
        return res.status(400).json({ error: `クリエイターID ${artistId} はSOLOではありません` });
      }

      // SOLOクリエイターのみ登録されているケースに対応し、artistを自動補完
      await conn.execute(
        `INSERT INTO tbl_artists (artist_id, artist_name)
         VALUES ($1, $2)
         ON CONFLICT (artist_id) DO NOTHING`,
        [artistId, creator.creator_name]
      );

      await conn.execute(
        `INSERT INTO tbl_group_members (group_id, artist_id, join_date)
         VALUES ($1, $2, CURRENT_DATE)
         ON CONFLICT (group_id, artist_id) DO NOTHING`,
        [id, artistId]
      );
    }

    await conn.execute('COMMIT');
    res.json({ message: 'グループにアーティストを追加しました' });
  } catch (err) {
    if (conn) await conn.execute('ROLLBACK');
    console.error('グループメンバー追加エラー:', err.message);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  } finally {
    if (conn) await conn.close();
  }
}

module.exports = {
  getAllGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  getGroupMembers,
  getAvailableArtists,
  addMembersToGroup
};
