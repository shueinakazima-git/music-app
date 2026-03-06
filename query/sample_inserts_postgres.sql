-- server/sample_inserts_postgres.sql
-- サンプルデータ（PostgreSQL向け）
-- 明示的にIDを指定して外部キー整合性を保っています。

-- ユーザー
INSERT INTO tbl_users (user_id, user_name, date_of_birth)
VALUES (1, 'John Doe', '1990-01-15');

-- クリエイター（ソロ/グループ）
INSERT INTO tbl_creators (creator_name, creator_type) VALUES ('Michael Jackson', 'SOLO');
INSERT INTO tbl_creators (creator_name, creator_type) VALUES ('David Bowie', 'SOLO');
INSERT INTO tbl_creators (creator_name, creator_type) VALUES ('Freddie Mercury', 'SOLO');
INSERT INTO tbl_creators (creator_name, creator_type) VALUES ('The Beatles', 'GROUP');
INSERT INTO tbl_creators (creator_name, creator_type) VALUES ('Queen', 'GROUP');
INSERT INTO tbl_creators (creator_name, creator_type) VALUES ('Pink Floyd', 'GROUP');

-- アーティスト（ソロは creator_id を artist_id として使用）
INSERT INTO tbl_artists (artist_name, started_at) VALUES ('Michael Jackson', NOW());
INSERT INTO tbl_artists (artist_name, started_at) VALUES ('David Bowie', NOW());
INSERT INTO tbl_artists (artist_name, started_at) VALUES ('Freddie Mercury', NOW());

-- グループ
INSERT INTO tbl_groups (group_name, formation_date) VALUES ('The Beatles', NOW());
INSERT INTO tbl_groups (group_name, formation_date) VALUES ('Queen', NOW());
INSERT INTO tbl_groups (group_name, formation_date) VALUES ('Pink Floyd', NOW());

-- 楽曲（creator_id を参照）
INSERT INTO tbl_music (music_title, creator_id, bpm, musical_key, duration_seconds)
VALUES ('Thriller', 1, 82, 'E', 294);
INSERT INTO tbl_music (music_title, creator_id, bpm, musical_key, duration_seconds)
VALUES ('Billie Jean', 1, 117, 'F#', 294);
INSERT INTO tbl_music (music_title, creator_id, bpm, musical_key, duration_seconds)
VALUES ('Heroes', 2, 108, 'G', 423);
INSERT INTO tbl_music (music_title, creator_id, bpm, musical_key, duration_seconds)
VALUES ('Space Oddity', 2, 96, 'D', 301);
INSERT INTO tbl_music (music_title, creator_id, bpm, musical_key, duration_seconds)
VALUES ('Let It Be', 4, 127, 'C', 243);
INSERT INTO tbl_music (music_title, creator_id, bpm, musical_key, duration_seconds)
VALUES ('Come Together', 4, 83, 'A', 259);
INSERT INTO tbl_music (music_title, creator_id, bpm, musical_key, duration_seconds)
VALUES ('Bohemian Rhapsody', 5, 55, 'B', 354);
INSERT INTO tbl_music (music_title, creator_id, bpm, musical_key, duration_seconds)
VALUES ('We Will Rock You', 5, 81, 'A', 143);
INSERT INTO tbl_music (music_title, creator_id, bpm, musical_key, duration_seconds)
VALUES ('Wish You Were Here', 6, 81, 'E', 296);
INSERT INTO tbl_music (music_title, creator_id, bpm, musical_key, duration_seconds)
VALUES ('Comfortably Numb', 6, 68, 'G#m', 406);

-- アルバム
INSERT INTO tbl_albums (album_name, creator_id, release_date) VALUES ('Thriller', 1, NOW());

-- タグ
INSERT INTO tbl_tags (tag_name, note, user_id, created_at) VALUES ('rock', NULL, 1, NOW());

-- 楽曲タグ
INSERT INTO tbl_music_tags (music_id, tag_id, created_at) VALUES (7, 1, NOW());

COMMIT;

-- 注意: このファイルは PostgreSQL 向けの構文（'YYYY-MM-DD', NOW()）を使用しています。
