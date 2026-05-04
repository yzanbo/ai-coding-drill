// commitlint 設定ファイル。
// commit-msg フック（後で lefthook 経由で接続）から起動され、
// コミットメッセージが Conventional Commits 規約に沿うかを検証する。
// 拡張子 .mjs ＝ ES Modules 形式（export default を直接使うため .js より明示的）

export default {
  // ────────────────────────────────────────────────────────────────
  // extends: ベースとなるルールセットを継承する。
  // @commitlint/config-conventional は Conventional Commits 公式の
  // 標準ルール一式（type 必須・許可 type リスト・subject 必須など）を提供。
  // 自前で全ルールを書く代わりにこれを土台にして、必要箇所だけ rules で上書きする。
  // ────────────────────────────────────────────────────────────────
  extends: ["@commitlint/config-conventional"],

  // ────────────────────────────────────────────────────────────────
  // rules: 個別ルールの上書き。
  // 値は [level, applicable, value?] の配列形式。
  //   level:      0 = 無効 / 1 = warning / 2 = error（commit を弾く）
  //   applicable: 'always' か 'never'
  //   value:      ルール固有の閾値（最大長など）
  // ────────────────────────────────────────────────────────────────
  rules: {
    // subject-case:
    //   既定では subject（コロン以降の本文）を kebab-case や lower-case など
    //   英語ケース規約に沿わせるよう要求する。
    //   日本語コミット（例: "feat: 問題生成 API を追加"）は判定対象外とすべきなので
    //   level=0 で完全に無効化する。
    "subject-case": [0],

    // header-max-length:
    //   ヘッダー（"type(scope): subject" の 1 行目全体）の最大文字数。
    //   既定 72 は英語前提の値で、日本語では情報量に対して短すぎる
    //   （日本語 1 文字 ≒ 英語 2〜3 文字相当の情報量）。
    //   level=2 (error) のまま上限だけ 100 に緩和。
    "header-max-length": [2, "always", 100],

    // body-max-line-length:
    //   本文（ヘッダーの後の改行以降）の 1 行あたり最大文字数。
    //   既定 100 を 200 に緩和（日本語の情報密度に合わせる）。
    //   level=2 (error) のまま運用し、長すぎる行はコミット時点で弾く。
    "body-max-line-length": [2, "always", 200],
  },
};
