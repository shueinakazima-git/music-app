# Music App

音楽情報管理システムの REST API とクライアント用アプリケーション。

## 概要

このアプリケーションは、音楽、アルバム、アーティスト、コード進行などの音楽情報を管理・共有するための Web アプリケーションです。Express.js サーバーと Oracle Database を使用した CRUD 機能を提供します。

## 主な機能

- **音楽管理**: 楽曲情報の作成・読取・更新・削除
- **アルバム管理**: アルバム情報の管理
- **アーティスト・クリエイター管理**: 音楽制作者情報の管理
- **タグ管理**: 楽曲タグングシステム
- **グループ管理**: アーティストグループの管理
- **コード進行**: 楽曲のコード進行情報管理
- **統計情報**: 音楽データベースの統計情報提供

## 必要な環境

- **Node.js**: v14 以上
- **npm**: 6 以上 または **yarn**
- **データベース**: Oracle または PostgreSQL
  - Oracle Database 11g 以上（フリーバージョン [Oracle Database Free](https://www.oracle.com/jp/database/free/) でも動作確認済み）
  - PostgreSQL 13 以上（`pg` ドライバを利用）

環境変数 `DB_TYPE` に `oracle`（デフォルト）または `postgres` を指定することで切り替え可能です。

## セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/shueinakazima-git/music-app.git
cd music-app
```

### 2. 依存パッケージのインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.example` をコピーして `.env` ファイルを作成し、データベース接続情報を設定します。

```bash
cp .env.example .env
```

`.env` ファイルを編集して、実際のデータベース認証情報を設定してください。接続先に応じて環境変数が変わります。

#### Oracle の場合
```env
DB_TYPE=oracle
DB_USER=system
DB_PASSWORD=your_actual_password
DB_CONNECT_STRING=localhost/FREEPDB1
```

- `DB_TYPE`: `oracle`（省略時デフォルト）
- `DB_USER`: Oracle データベースのユーザー名
- `DB_PASSWORD`: Oracle データベースのパスワード
- `DB_CONNECT_STRING`: データベース接続文字列（ホスト/SID）

#### PostgreSQL の場合
```env
DB_TYPE=postgres
PG_USER=postgres
PG_PASSWORD=your_password
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=musicapp
```

- `DB_TYPE`: `postgres`
- `PG_USER`/`PG_PASSWORD`/`PG_HOST`/`PG_PORT`/`PG_DATABASE`: PostgreSQL 接続パラメータ

Oracle 用の変数（`DB_USER` など）は引き続き利用可能ですが、PostgreSQL では `PG_` 系を優先して読み込みます。

### 4. データベーステーブルの初期化

```bash
node server/initDb.js
```

テーブル構造が自動作成されます。

### 5. 本番環境用の環境変数設定（推奨）

本番環境では、環境変数をシステム環境変数として設定することを推奨します：

```bash
export DB_USER=system
export DB_PASSWORD=your_secure_password
export DB_CONNECT_STRING=production_host/PROD_SID
```

## 実行

### 開発環境での実行

```bash
npm start
```

サーバーはデフォルトで `http://localhost:3000` で起動します。

### テストの実行

```bash
npm test
```

Node.js 組み込みテストランナーを使用します。

## API エンドポイント

### 音楽 (`/music`)

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | `/music` | すべての楽曲を取得 |
| GET | `/music/:id/chords` | 特定楽曲のコード進行を取得 |
| POST | `/music` | 新規楽曲を作成 |
| PUT | `/music/:id` | 楽曲情報を更新 |
| DELETE | `/music/:id` | 楽曲を削除 |
| GET | `/music/creators` | すべてのクリエイターを取得 |
| GET | `/music/stats` | 統計情報を取得 |

**リクエスト例**:
```bash
# すべての楽曲を取得
curl http://localhost:3000/music

# 新規楽曲を作成
curl -X POST http://localhost:3000/music \
  -H "Content-Type: application/json" \
  -d '{
    "music_name": "Song Title",
    "album_id": 1,
    "creator_id": 1,
    "music_type": "SONG"
  }'
```

### アルバム (`/albums`)

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | `/albums` | すべてのアルバムを取得 |
| POST | `/albums` | 新規アルバムを作成 |
| PUT | `/albums/:id` | アルバム情報を更新 |
| DELETE | `/albums/:id` | アルバムを削除 |

### クリエイター (`/creators`)

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | `/creators` | すべてのクリエイターを取得 |
| POST | `/creators` | 新規クリエイターを作成 |
| PUT | `/creators/:id` | クリエイター情報を更新 |
| DELETE | `/creators/:id` | クリエイターを削除 |

### タグ (`/tags`)

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | `/tags` | すべてのタグを取得 |
| POST | `/tags` | 新規タグを作成 |
| PUT | `/tags/:id` | タグ情報を更新 |
| DELETE | `/tags/:id` | タグを削除 |

### アーティスト (`/artists`)

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | `/artists` | すべてのアーティストを取得 |
| POST | `/artists` | 新規アーティストを作成 |
| PUT | `/artists/:id` | アーティスト情報を更新 |
| DELETE | `/artists/:id` | アーティストを削除 |

### グループ (`/groups`)

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | `/groups` | すべてのグループを取得 |
| POST | `/groups` | 新規グループを作成 |
| PUT | `/groups/:id` | グループ情報を更新 |
| DELETE | `/groups/:id` | グループを削除 |

### コード進行 (`/chords`)

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | `/chords` | すべてのコード進行を取得 |
| POST | `/chords` | 新規コード進行を作成 |
| PUT | `/chords/:id` | コード進行を更新 |
| DELETE | `/chords/:id` | コード進行を削除 |

## クライアント

### Web UI

`public/` フォルダに HTML ベースのクライアントが含まれています。

- **index.html**: メインランディングページ
- **list.html**: 楽曲一覧ページ
- **chord.html**: コード進行ページ
- **setlist.html**: セットリスト管理ページ

対応するスタイルシートとスクリプト：
- `style.css`: 共通スタイル
- `chord.css`: コード進行専用スタイル
- `list.js`: 楽曲一覧機能
- `chord.js`: コード進行機能
- `setlist.js`: セットリスト機能
- `app.js`: 共通機能

## プロジェクト構造

```
music-app/
├── public/                    # クライアント側ファイル（HTML/CSS/JS）
│   ├── index.html
│   ├── list.html
│   ├── chord.html
│   ├── setlist.html
│   ├── style.css
│   ├── chord.css
│   ├── list.js
│   ├── chord.js
│   ├── setlist.js
│   └── app.js
├── server/                    # サーバー側ファイル
│   ├── app.js                # Express アプリケーション
│   ├── db.js                 # データベース接続管理
│   ├── initDb.js             # テーブル初期化スクリプト
│   ├── resetDb.js            # データベースリセットスクリプト
│   ├── routes/
│   │   └── musicRoutes.js    # ルータ定義
│   └── controllers/          # ロジック処理
│       ├── musicController.js
│       ├── albumController.js
│       ├── creatorController.js
│       ├── tagController.js
│       ├── artistController.js
│       ├── groupController.js
│       └── chordController.js
├── doc/                       # ドキュメント
│   └── query.sql             # SQL クエリ例
├── test/                      # テストファイル
├── .env.example              # 環境変数テンプレート
├── .gitignore                # Git 除外設定
├── package.json              # npm パッケージ定義
└── README.md                 # このファイル
```

## 入力バリデーション

すべての CRUD エンドポイントは以下のバリデーションを実施します：

- **必須フィールド検証**: 必要なフィールドが必ず含まれているか確認
- **型チェック**: ID 等の数値フィールドを整数に変換・検証
- **空白処理**: テキストフィールドをトリムして正規化

エラー例：
```bash
# 無効な ID の場合
curl -X DELETE http://localhost:3000/creators/invalid
# Response: 400 Bad Request
# {"error": "invalid id"}

# 必須フィールド不足の場合
curl -X POST http://localhost:3000/creators \
  -H "Content-Type: application/json" \
  -d '{}'
# Response: 400 Bad Request
# {"error": "creator_name is required"}
```

## パフォーマンス最適化

- **接続プーリング**: Oracle Database への接続を効率的に管理
- **prepare ステートメント**: SQL インジェクション対策と性能向上
- **非同期処理**: Node.js の async/await で効率的な I/O 処理

## セキュリティ機能

- **環境変数管理**: 認証情報を `.env` ファイルで管理（`.gitignore` で除外）
- **CORS 対応**: クロスオリジンリクエスト対応
- **入力サニタイズ**: 不正なデータの防止
- **接続タイムアウト**: データベース接続のタイムアウト設定

## トラブルシューティング

### データベース接続エラー

```
ORA-12514: TNS:listener does not currently know of service requested in connect descriptor
```

**対策**:
- `DB_CONNECT_STRING` が正しく設定されているか確認
- Oracle リスナーが起動しているか確認

### ポート 3000 が既に使用されている

```bash
# ポート 3000 を使用しているプロセスを終了
lsof -ti :3000 | xargs -r kill -9
```

### テストが見つからない

Node.js の標準テストランナーを使用しています。テストファイルは以下の規約に従う必要があります：
- ファイル名が `.test.js` または `.spec.js` で終わる
- または `test/` ディレクトリに配置

## 開発ガイドライン

### コーディング規約

- **非同期処理**: すべてのデータベース操作に async/await を使用
- **エラーハンドリング**: try-catch でエラーをキャッチしレスポンスを統一
- **レスポンス形式**: JSON 形式で統一（成功時・エラー時共に）

### コントローラー追加時

新しいコントローラーを追加する場合：

1. `server/controllers/` ディレクトリに新しいファイルを作成
2. `db.getConnection()` でコネクションを取得
3. `conn.execute()` でクエリ実行（named binds 使用）
4. `conn.close()` でコネクションを閉じる
5. `try-catch` でエラー処理

**テンプレート例**:
```javascript
exports.getAll = async (req, res) => {
  try {
    const conn = await db.getConnection();
    const result = await conn.execute(
      'SELECT * FROM table_name',
      [],
      { outFormat: require('../db').oracledb.OUT_FORMAT_OBJECT }
    );
    await conn.close();
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
```

## ライセンス

ISC

## 著者

shueinakazima-git

## GitHub リポジトリ

[https://github.com/shueinakazima-git/music-app](https://github.com/shueinakazima-git/music-app)

## 今後の改善予定

- [ ] ページネーション機能
- [ ] 高度な検索・フィルタリング
- [ ] 認証・認可機能
- [ ] キャッシング機能（Redis）
- [ ] 詳細なテストカバレッジ
- [ ] API ドキュメント（Swagger/OpenAPI)
- [ ] Docker コンテナ化
- [ ] CI/CD パイプライン統合

## サポート

質問や問題がある場合は、GitHub Issues で報告してください。

---

**最終更新**: 2026年2月19日
