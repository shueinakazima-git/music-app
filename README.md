# Music App

音楽情報を管理する Web アプリケーションです。  
バックエンドは Express + PostgreSQL、フロントエンドは HTML/CSS/Vanilla JS で構成されています。

## 概要

- 楽曲・アルバム・タグ・アーティスト・グループ・コード進行・セットリストを管理できます。
- `Artists / Groups` を主画面で管理し、`Creators` は内部マスタとして同期します。
- ダッシュボードでは以下の件数を表示します。
- アルバム数
- 曲数
- クリエーター数
- グループ数
- アーティスト数

## 技術スタック

| 分類 | 技術 |
|---|---|
| Runtime | Node.js |
| Framework | Express |
| Database | PostgreSQL |
| Driver | pg |
| Frontend | HTML / CSS / Vanilla JS |
| Test | Node.js built-in test runner (`node --test`) |

## 必要環境

- Node.js 18 以上
- npm 9 以上
- PostgreSQL 13 以上

## セットアップ

1. リポジトリを取得

```bash
git clone https://github.com/shueinakazima-git/music-app.git
cd music-app
```

2. 依存関係をインストール

```bash
npm install
```

3. `.env` を作成

```bash
cp .env.example .env
```

4. `.env` に PostgreSQL 接続情報を設定

```env
PG_USER=postgres
PG_PASSWORD=your_password
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=musicapp
PORT=3000
```

5. DB 初期化

```bash
node server/initDb.js
```

## 実行

```bash
npm start
```

- 起動URL: `http://localhost:3000`

## テスト

```bash
npm test
```

## 主な画面

- `public/index.html`: ダッシュボード
- `public/list.html`: 楽曲・アルバム・タグ・アーティスト・グループ管理
- `public/setlist.html`: セットリスト生成・保存
- `public/chord.html`: コードビューア

## API エンドポイント

### Music

| Method | Path | 説明 |
|---|---|---|
| GET | `/music` | 楽曲一覧取得 |
| GET | `/music?creator_id=:id` | クリエーター絞り込み |
| GET | `/music/with-chords` | コード登録済み楽曲一覧 |
| GET | `/music/creators` | クリエーター一覧 |
| GET | `/music/stats` | ダッシュボード集計 |
| GET | `/music/:id/chords` | コード進行取得 |
| GET | `/music/:id/tags` | 楽曲に紐付くタグ |
| GET | `/music/:id/available-tags` | 紐付け可能タグ |
| POST | `/music` | 楽曲作成 |
| PUT | `/music/:id` | 楽曲更新 |
| DELETE | `/music/:id` | 楽曲削除 |
| POST | `/music/:id/tags` | タグ紐付け |
| DELETE | `/music/:musicId/tags/:tagId` | タグ紐付け解除 |

### Albums

| Method | Path | 説明 |
|---|---|---|
| GET | `/albums` | アルバム一覧 |
| POST | `/albums` | アルバム作成 |
| PUT | `/albums/:id` | アルバム更新 |
| DELETE | `/albums/:id` | アルバム削除 |
| GET | `/albums/:id/available-songs` | 追加可能楽曲 |
| POST | `/albums/:id/songs` | アルバムに楽曲追加 |

### Creators

| Method | Path | 説明 |
|---|---|---|
| GET | `/creators` | クリエーター一覧 |
| POST | `/creators` | クリエーター作成 |
| PUT | `/creators/:id` | クリエーター更新 |
| DELETE | `/creators/:id` | クリエーター削除 |

### Tags

| Method | Path | 説明 |
|---|---|---|
| GET | `/tags` | タグ一覧 |
| POST | `/tags` | タグ作成（重複時は 409、論理削除済みは復元） |
| PUT | `/tags/:id` | タグ更新 |
| DELETE | `/tags/:id` | タグ論理削除 |

### Artists

| Method | Path | 説明 |
|---|---|---|
| GET | `/artists` | アーティスト一覧 |
| POST | `/artists` | アーティスト作成 |
| PUT | `/artists/:id` | アーティスト更新 |
| DELETE | `/artists/:id` | アーティスト削除 |

### Groups

| Method | Path | 説明 |
|---|---|---|
| GET | `/groups` | グループ一覧 |
| POST | `/groups` | グループ作成 |
| PUT | `/groups/:id` | グループ更新 |
| DELETE | `/groups/:id` | グループ削除 |
| GET | `/groups/:id/members` | グループメンバー一覧 |
| GET | `/groups/:id/available-artists` | 追加可能アーティスト一覧 |
| POST | `/groups/:id/members` | メンバー追加 |

### Setlists

| Method | Path | 説明 |
|---|---|---|
| GET | `/setlists/options` | セットリスト条件取得 |
| POST | `/setlists/generate` | セットリスト生成 |
| POST | `/setlists` | セットリスト保存 |

## セットリスト生成仕様（現行）

- 目標時間（分）を指定してランダム生成
- 要素選択は 5 スロット（Creator/Tag 混在）
- 同一要素の重複選択は不可
- セットリスト内の楽曲重複はチェックボックスで許可/禁止
- BPM とキーは「優先条件」として重み付け
- 生成結果を DB に保存可能

## Chord Viewer 仕様（現行）

- コード登録済み楽曲のみ選択表示
- `absolute_tick` ベースで小節内の位置を表示
- 1行1小節レイアウト
- コード行と小節行を分離して表示

## DB 運用補助

- 初期化: `node server/initDb.js`
- リセット: `node server/resetDb.js`

## ディレクトリ構成

主要ファイルを含む構成です（`node_modules/`, `.git/`, `.env`, `.DS_Store` は省略）。

```text
music-app/
├── README.md
├── package.json
├── package-lock.json
├── .env.example
├── doc/
│   ├── definition_table.md
│   ├── ER図.xlsx
│   ├── テーブル定義書.xlsx
│   └── 画面設計.xlsx
├── public/
│   ├── index.html
│   ├── list.html
│   ├── setlist.html
│   ├── chord.html
│   ├── app.js
│   ├── list.js
│   ├── setlist.js
│   ├── chord.js
│   ├── style.css
│   └── chord.css
├── query/
│   ├── create_table_postgres.sql
│   └── sample_inserts_postgres.sql
├── scripts/
│   └── crud_sequence.js
├── server/
│   ├── app.js
│   ├── db.js
│   ├── initDb.js
│   ├── resetDb.js
│   ├── routes/
│   │   └── musicRoutes.js
│   ├── services/
│   │   └── creatorService.js
│   └── controllers/
│       ├── albumController.js
│       ├── artistController.js
│       ├── chordController.js
│       ├── creatorController.js
│       ├── groupController.js
│       ├── musicController.js
│       ├── setlistController.js
│       └── tagController.js
├── test/
│   ├── controllers.test.js
│   ├── db.test.js
│   ├── dbConversion.test.js
│   └── musicController.test.js
└── test-utils/
    └── withMockedDb.js
```
