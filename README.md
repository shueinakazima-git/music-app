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
| Container | Docker / Docker Compose |
| Test | Node.js built-in test runner (`node --test`) |

## 必要環境

- Docker 24 以上 / Docker Compose v2 推奨
- ローカル実行する場合のみ:
- Node.js 18 以上
- npm 9 以上
- PostgreSQL 13 以上

## セットアップ

1. リポジトリを取得

```bash
git clone https://github.com/shueinakazima-git/music-app.git
cd music-app
```

## Docker での起動

### 前提

`docker-compose.yml` では以下の 2 サービスを起動します。

- `app`: Node.js / Express アプリケーション
- `db`: PostgreSQL

`.env` がなくても起動できます。必要に応じて環境変数を上書きしてください。

### 起動

```bash
docker compose up -d --build
```

- アプリ: `http://localhost:3000`
- DB: `localhost:5432`

### 初回セットアップ

`docker compose up` だけではテーブル作成用 SQL は反映されますが、アプリで利用する初期データは投入されません。
初回のみ、別途 DB 初期化を実行してください。

```bash
docker compose run --rm app node server/initDb.js
```

このコマンドで以下を実施します。

- テーブル作成 SQL の再実行
- 初期ユーザーの投入
- クリエーター、アーティスト、グループ、楽曲などのサンプルデータ投入

### 起動手順の例

初回:

```bash
docker compose up -d --build
docker compose run --rm app node server/initDb.js
```

2回目以降:

```bash
docker compose up -d
```

### 停止

```bash
docker compose down
```

### データリセット

```bash
docker compose down -v
docker compose up -d --build
docker compose run --rm app node server/initDb.js
```

## Kubernetes での起動

`k8s/` 配下にはアプリと PostgreSQL の manifest を配置しています。

- `k8s/postgres/`: PostgreSQL の Deployment / Service / PVC / Secret テンプレート
- `k8s/app/`: アプリの Deployment / Service / Ingress / initdb Job / Secret テンプレート

### 事前準備

1. Secret テンプレートをコピーして実値を設定

```bash
cp k8s/postgres/secret.example.yaml k8s/postgres/secret.yaml
cp k8s/app/secret.example.yaml k8s/app/secret.yaml
```

2. `secret.yaml` の認証情報や接続先を環境に合わせて編集

- `k8s/postgres/secret.yaml`: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- `k8s/app/secret.yaml`: `PG_USER`, `PG_PASSWORD`, `PG_DATABASE`, `PG_HOST`, `PG_PORT`, `PORT`

`k8s/app/secret.yaml` と `k8s/postgres/secret.yaml` は `.gitignore` に追加済みです。加えて `.dockerignore` にも含めており、Docker build 時にイメージへコピーされないようにしています。

### デプロイ例

```bash
kubectl apply -f k8s/postgres/secret.yaml
kubectl apply -f k8s/postgres/postgres-pvc.yaml
kubectl apply -f k8s/postgres/postgres-deployment.yaml
kubectl apply -f k8s/postgres/postgres-service.yaml

kubectl apply -f k8s/app/secret.yaml
kubectl apply -f k8s/app/music-app-initdb-job.yaml
kubectl apply -f k8s/app/music-app-deployment.yaml
kubectl apply -f k8s/app/music-app-service.yaml
kubectl apply -f k8s/app/music-app-ingress.yaml
```

### initdb Job について

`k8s/app/music-app-initdb-job.yaml` は `node server/initDb.js` を実行して、テーブル作成と初期データ投入を行います。

- DB 接続はリトライ付きです
- デフォルト値は `DB_CONNECT_RETRY_DELAY_MS=2000`、`DB_CONNECT_MAX_RETRIES=30` です
- PostgreSQL Pod の起動直後でも、一定時間は接続待ちを行います

### 現時点の懸念点

- `k8s/` 配下の manifest は最小構成です。`readinessProbe`、`livenessProbe`、resource requests/limits などは未設定です
- `music-app-initdb` Job は接続リトライ付きですが、クラスタ状態によっては再実行が必要になる場合があります
- `secret.yaml` は各環境で個別作成する前提です。Git には含めません
- Docker build では `.dockerignore` により `k8s/**/secret.yaml` を build context から除外しています
- 利用するアプリイメージ `matthew95713/music-app:0.1.0` が pull 可能であることを前提としています

## ローカル実行

1. 依存関係をインストール

```bash
npm install
```

2. `.env` を作成

```bash
cp .env.example .env
```

3. `.env` に PostgreSQL 接続情報を設定

`server/db.js` は PostgreSQL の `PG_*` 系環境変数を参照します。

```env
PG_USER=postgres
PG_PASSWORD=your_password
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=musicdb
PORT=3000
```

4. DB 初期化

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
