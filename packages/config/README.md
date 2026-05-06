# @ai-coding-drill/config

モノレポ全 workspace で共有する**開発ツール設定の集約パッケージ**。各 `apps/*` および他 `packages/*` がここから設定を `extends` / `import` する形で参照する。

- パッケージ名：`@ai-coding-drill/config`
- npm 公開しない（`"private": true`）
- 本パッケージ自身は依存を持たない（設定ファイルの集約のみ）

---

## 役割

- 全 workspace で**設定の 2 重管理を防ぐ** SSoT
- ツールごとの共有ルールを 1 箇所で定義し、参照側はそれを `extends` するだけで済む構造を作る
- 「物理的位置」と「論理的依存」を分離（参照側は `@ai-coding-drill/config` という名前で借りるため、ディレクトリ構成変更の影響を受けない）

---

## 現状（R0）

`package.json` のみが存在する**ハコだけの状態**。共有が必要となる設定が出てきた段階で、本ディレクトリに集約していく。

中身が空である理由：

- YAGNI 原則（→ [プロジェクトルート CLAUDE.md「設計原則」](../../.claude/CLAUDE.md)）。`apps/*` がまだ存在しない R0 段階で先取り実装する意味が薄い
- ハコだけ先に置けば、R1 以降で共有が必要と判明した瞬間に**追加するだけ**で済む（ディレクトリ作成・ワークスペース登録の手間が不要）

---

## 追加予定（暫定、実装着手時に確定）

| タイミング | 追加するもの | 用途 |
|---|---|---|
| R1（apps 着手時） | `tsconfig/base.json` 等 | `apps/*` が extends する共有 tsconfig |
| R1（packages 増加時） | `tsconfig/library.json` | `packages/*` が extends する共有 tsconfig |
| R2 以降 | `vitest/base.ts` 等 | Vitest 共有設定 |
| 必要時のみ | `biome/base.jsonc` | ルート `biome.jsonc` の切り出し（per-workspace 上書きが増えた場合） |

具体的な追加判断は実装着手時に行う（[ADR 0013](../../docs/adr/0013-biome-for-tooling.md)：「設定はリポジトリルートに直接配置、必要時のみ workspace に追加して extends する 2 層構造」と整合）。

---

## ファイル追加時の規約

### 命名・配置

- ツールごとにサブディレクトリを切る（`tsconfig/` / `biome/` / `vitest/` 等）
- ファイル名はケバブケース（→ [プロジェクトルート CLAUDE.md「言語・ツール非依存の規約」](../../.claude/CLAUDE.md)）
- 用途別の派生（例：`tsconfig/nextjs.json` / `tsconfig/nestjs.json` / `tsconfig/library.json`）はサブディレクトリ内で展開

### 設定ファイル形式

[ADR 0028: 設定ファイル形式の選定方針](../../docs/adr/0028-config-file-format-priority.md) に従い、**自由選択時は TS > JSONC > YAML** の優先順位で選ぶ：

- 型 export があるツール（Vitest 等）：`.ts` でフィールド typo を保存時に弾く
- 純データの設定（tsconfig 等）：JSONC（コメント可）
- ツール強制 / 慣習がある場合（`tsconfig.json` / `biome.jsonc` 等）：それに従う

### `package.json` の `exports` フィールド

設定ファイルを追加したら、`package.json` の `exports` で**外から参照可能なエントリポイント**を明示する：

```jsonc
// 例（将来）
{
  "name": "@ai-coding-drill/config",
  "exports": {
    "./tsconfig/base": "./tsconfig/base.json",
    "./tsconfig/nextjs": "./tsconfig/nextjs.json",
    "./biome/base": "./biome/base.jsonc"
  }
}
```

`exports` で公開していないファイルは**外から参照されない前提**として扱う（内部ヘルパー等を `src/internal/` に置けば、利用側の意図せぬ依存を防げる）。

---

## 参照のされ方（追加後の想定）

### apps から借りる宣言

```jsonc
// apps/web/package.json（将来）
{
  "devDependencies": {
    "@ai-coding-drill/config": "workspace:*"
  }
}
```

`workspace:*` プロトコルでローカル参照を強制（→ [ADR 0029](../../docs/adr/0029-syncpack-package-json-consistency.md)、syncpack で機械検証）。

### tsconfig の extends

```jsonc
// apps/web/tsconfig.json（将来）
{
  "extends": "@ai-coding-drill/config/tsconfig/nextjs",
  "compilerOptions": {
    // 個別 workspace 固有の上書きはここに最小限だけ書く
  },
  "include": ["src/**/*"]
}
```

### Biome の extends（必要時のみ）

```jsonc
// 別 workspace で per-workspace 上書きが必要になった場合
{
  "extends": ["@ai-coding-drill/config/biome/base"]
}
```

---

## やってはいけないこと

- **同じ設定をルートと `packages/config` に二重管理しない**：ルート直接配置 → `packages/config` への切り出しはどちらか一方で運用する
- **コードロジック（実行時に動く汎用ヘルパー）を置かない**：本パッケージは「**設定ファイル集約**」が役割。汎用ヘルパーは別パッケージ（例：将来の `packages/utils/`）として作る
- **外部 npm に公開しない**：`"private": true` を必ず維持。internal-only スコープ
- **設定の根拠を ADR に書く前にモノレポ全体へ波及する設定を入れない**：「なぜこの共有設定があるのか」が説明できない状態で全体に影響する変更を加えない

---

## 関連ドキュメント

- [docs/requirements/2-foundation/06-dev-workflow.md](../../docs/requirements/2-foundation/06-dev-workflow.md)：開発フロー全体での `packages/config` の位置づけ
- [ADR 0012: Turborepo + pnpm workspaces](../../docs/adr/0012-turborepo-pnpm-monorepo.md)：モノレポ構造（`packages/config` を共有設定置き場とする設計）
- [ADR 0013: Biome を採用](../../docs/adr/0013-biome-for-tooling.md)：「ルート直接配置 / 必要時 packages/config に切り出す 2 層構造」方針
- [ADR 0028: 設定ファイル形式の選定方針](../../docs/adr/0028-config-file-format-priority.md)：TS > JSONC > YAML の優先順位
- [ADR 0029: syncpack で package.json 整合性を機械強制](../../docs/adr/0029-syncpack-package-json-consistency.md)：`workspace:*` 強制ルール
- [プロジェクトルート CLAUDE.md](../../.claude/CLAUDE.md)：プロジェクト全体のガイダンス
