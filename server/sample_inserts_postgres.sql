-- server/sample_inserts_postgres.sql
-- サンプルデータ（PostgreSQL向け）
-- 明示的にIDを指定して外部キー整合性を保っています。

-- ユーザー
INSERT INTO tbl_users (user_id, user_name, date_of_birth)
VALUES (1, 'John Doe', '1990-01-15'::date);

-- クリエイター（ソロ/グループ）
INSERT INTO tbl_creators (creator_id, creator_name, creator_type) VALUES (1, 'Michael Jackson', 'SOLO');
INSERT INTO tbl_creators (creator_id, creator_name, creator_type) VALUES (2, 'David Bowie', 'SOLO');
INSERT INTO tbl_creators (creator_id, creator_name, creator_type) VALUES (3, 'Freddie Mercury', 'SOLO');
INSERT INTO tbl_creators (creator_id, creator_name, creator_type) VALUES (4, 'The Beatles', 'GROUP');
INSERT INTO tbl_creators (creator_id, creator_name, creator_type) VALUES (5, 'Queen', 'GROUP');
INSERT INTO tbl_creators (creator_id, creator_name, creator_type) VALUES (6, 'Pink Floyd', 'GROUP');

-- アーティスト（ソロは creator_id を artist_id として使用）
INSERT INTO tbl_artists (artist_id, artist_name, started_at) VALUES (1, 'Michael Jackson', NOW());
INSERT INTO tbl_artists (artist_id, artist_name, started_at) VALUES (2, 'David Bowie', NOW());
INSERT INTO tbl_artists (artist_id, artist_name, started_at) VALUES (3, 'Freddie Mercury', NOW());

-- グループ
INSERT INTO tbl_groups (group_id, group_name, formation_date) VALUES (4, 'The Beatles', NOW());
INSERT INTO tbl_groups (group_id, group_name, formation_date) VALUES (5, 'Queen', NOW());
INSERT INTO tbl_groups (group_id, group_name, formation_date) VALUES (6, 'Pink Floyd', NOW());

-- 楽曲（creator_id を参照）
INSERT INTO tbl_music (music_id, music_title, creator_id, bpm, musical_key, duration_seconds)
VALUES (1, 'Thriller', 1, 82, 'E', 294);
INSERT INTO tbl_music (music_id, music_title, creator_id, bpm, musical_key, duration_seconds)
VALUES (2, 'Billie Jean', 1, 117, 'F#', 294);
INSERT INTO tbl_music (music_id, music_title, creator_id, bpm, musical_key, duration_seconds)
VALUES (3, 'Heroes', 2, 108, 'G', 423);
INSERT INTO tbl_music (music_id, music_title, creator_id, bpm, musical_key, duration_seconds)
VALUES (4, 'Space Oddity', 2, 96, 'D', 301);
INSERT INTO tbl_music (music_id, music_title, creator_id, bpm, musical_key, duration_seconds)
VALUES (5, 'Let It Be', 4, 127, 'C', 243);
INSERT INTO tbl_music (music_id, music_title, creator_id, bpm, musical_key, duration_seconds)
VALUES (6, 'Come Together', 4, 83, 'A', 259);
INSERT INTO tbl_music (music_id, music_title, creator_id, bpm, musical_key, duration_seconds)
VALUES (7, 'Bohemian Rhapsody', 5, 55, 'B', 354);
INSERT INTO tbl_music (music_id, music_title, creator_id, bpm, musical_key, duration_seconds)
VALUES (8, 'We Will Rock You', 5, 81, 'A', 143);
INSERT INTO tbl_music (music_id, music_title, creator_id, bpm, musical_key, duration_seconds)
VALUES (9, 'Wish You Were Here', 6, 81, 'E', 296);
INSERT INTO tbl_music (music_id, music_title, creator_id, bpm, musical_key, duration_seconds)
VALUES (10, 'Comfortably Numb', 6, 68, 'G#m', 406);

-- アルバム
INSERT INTO tbl_albums (album_id, album_name, creator_id, release_date) VALUES (1, 'Thriller', 1, NOW());

-- タグ
INSERT INTO tbl_tags (tag_id, tag_name, note, user_id, created_at) VALUES (1, 'rock', NULL, 1, NOW());

-- 楽曲タグ
INSERT INTO tbl_music_tags (music_id, tag_id, created_at) VALUES (7, 1, NOW());

COMMIT;

-- 注意: このファイルは PostgreSQL 向けの構文（'YYYY-MM-DD'::date, NOW()）を使用しています。
