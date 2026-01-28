# SRX FUSION V Assembler

**SRX FUSION V**は、教育およびホビー用途に設計されたシンプルな8ビットCPUアーキテクチャです。このプロジェクトは、そのアセンブリコードをブラウザ上でリアルタイムに機械語へ変換するための高機能なWebアプリケーションです。

最新のWeb技術（Vite, Vue 3, CodeMirror 6）を使用しており、モバイルデバイスでも快適に動作するモダンな開発環境を提供します。
![MRCA Screenshot1](https://imgur.com/a/7Rcpey1)
![MRCA Screenshot2](https://imgur.com/a/8TUEgAE)

---

## ✨ 特徴

- **リアルタイムアセンブル**: コードを入力すると、即座に機械語（HEX/BIN）と最終的なアセンブリコードに変換されます。
- **高機能エディタ**: [CodeMirror 6](https://codemirror.net/) をベースにしたエディタ。
    - シンタックスハイライト
    - エラー箇所のリアルタイム表示（リンティング）
    - ラベル入力後の自動インデント
    - カラフルなインデントガイド
- **シンタックスシュガー対応**: `INC R1` や `MOV R1, R2` のような便利なマクロ（擬似命令）を定義・使用可能。
- **ラベル解決**: `JMP LOOP` のように、アドレスをラベルで指定できます（前方・後方参照対応）。
- **カスタマイズ可能なUI**: フォントの種類、サイズ、行の高さ、ワードラップなどを設定画面から変更可能。設定はブラウザに自動保存されます。
- **ファイル操作**:
    - アセンブリコード（`.asm`）のインポート・エクスポート
    - 生成されたバイナリ（`.bin`）のエクスポート
- **モバイルフレンドリー**: スマートフォンやタブレットでも使いやすいレスポンシブデザイン。
- **拡張性の高い設計**:
    - `src/core/isa.js` を編集するだけで、命令セットの変更や**全く新しいCPUアーキテクチャへの対応**が可能です。
    - `src/core/macros.js` に追記するだけで、新しいシンタックスシュガーを簡単に追加できます。

---

## 🚀 使い方

### 開発環境のセットアップ

1.  **リポジトリをクローン:**
    ```bash
    git clone https://github.com/shiratama644/MRCA.git
    cd srx-fusion-assembler
    ```

2.  **依存関係のインストール:**
    このプロジェクトでは `pnpm` を推奨しています。
    ```bash
    pnpm install
    ```

3.  **開発サーバーの起動:**
    ```bash
    pnpm dev
    ```
    表示されたURL（例: `http://localhost:5173`）にブラウザでアクセスしてください。

### ビルド

本番環境用に最適化されたファイルを生成します。

```bash
pnpm build```

生成された `dist` ディレクトリをWebサーバーにデプロイできます。

---

## 🔧 アーキテクチャの拡張方法

このアセンブラの最大の強みは、その柔軟な設計にあります。

### 新しい命令を追加する

1.  `src/core/isa.js` を開きます。
2.  `INSTRUCTIONS` オブジェクトに、新しい命令の定義を追加します。
    - `opcode`: 命令のオペコード。
    - `fields`: 命令のビットフィールド定義。`name`, `bits`, `shift`, `parser` を指定します。

    **例: `CMP R1, R2` (16bit命令) を追加する場合**
    ```javascript
    'CMP': { opcode: 22, fields: [
        { name: 'opcode', bits: 5, shift: 11, parser: 'opcode' },
        { name: 'rA',     bits: 4, shift: 7,  parser: 'register' },
        { name: 'rB',     bits: 4, shift: 3,  parser: 'register' },
    ]},
    ```

### 新しいシンタックスシュガーを追加する

1.  `src/core/macros.js` を開きます。
2.  `PSEUDO_OPS` オブジェクトに、新しいマクロ名と展開ロジックを追加します。
    - 関数は引数の配列を受け取り、展開後のアセンブリコードの配列を返します。

    **例: `PUSHALL R1, R2, R3` を追加する場合**
    ```javascript
    'PUSHALL': (args) => {
        if (args.length === 0) throw new Error("PUSHALL requires at least one register");
        // 各引数に対して PSH 命令を生成
        return args.map(reg => `PSH ${reg}`);
    },
    ```

### 別のCPUアーキテクチャに対応する

1.  `src/core/isa.js` を開きます。
2.  `architecture` オブジェクトを、新しいCPUの仕様に合わせて書き換えます（ビット幅など）。
3.  `parsers` を必要に応じて拡張・修正します。
4.  `INSTRUCTIONS` オブジェクトを、新しいCPUの命令セットに合わせて完全に書き換えます。

---

## 🛠️ 使用技術

-   **フレームワーク**: [Vue 3](https://vuejs.org/)
-   **ビルドツール**: [Vite](https://vitejs.dev/)
-   **CSS**: [Tailwind CSS](https://tailwindcss.com/)
-   **コードエディタ**: [CodeMirror 6](https://codemirror.net/)
-   **パッケージマネージャー**: [PNPM](https://pnpm.io/)
