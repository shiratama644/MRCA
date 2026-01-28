import { StreamLanguage } from '@codemirror/language';
import { INSTRUCTIONS, MACRO_NAMES, CONDITIONS, ALU_TYPES } from './isa';

// キーワードリスト生成
const instructions = [...Object.keys(INSTRUCTIONS), ...MACRO_NAMES];
const conditions = Object.keys(CONDITIONS);
const types = Object.keys(ALU_TYPES);

// ALU/SHIFT命令かチェック（Typeフィールドを持つ命令）
const hasTypeField = (mnemonic) => {
  return ['ADD', 'SUB', 'BIT', 'SHF'].includes(mnemonic);
};

const srxLanguageDef = {
  // 状態の初期化
  startState: () => ({
    inArgs: false,      // 引数解析中か
    argCount: 0,        // 現在の引数インデックス
    expectTypeAt: -1,   // Typeフィールドが期待される位置
    afterLabel: false   // ラベル定義の直後か
  }),

  token: (stream, state) => {
    // ★重要: 行頭 (Start Of Line) で状態をリセット
    // これにより、前の行の状態を引きずらず、新しい行の先頭をニーモニックとして判定できます
    if (stream.sol()) {
      state.inArgs = false;
      state.argCount = 0;
      state.expectTypeAt = -1;
      state.afterLabel = false;
    }

    // 空白スキップ
    if (stream.eatSpace()) {
      return null;
    }

    // コメント
    if (stream.peek() === ';') {
      stream.skipToEnd();
      // コメント後は状態に関わらず終了ですが、次の行頭処理でリセットされるのでここではスキップのみ
      return 'comment';
    }

    // 数値 (Hex, Bin, Dec)
    if (stream.match(/^(-?(?:0x[\da-fA-F]+|0b[01]+|\d+))/)) {
      if (state.inArgs) state.argCount++;
      state.afterLabel = false;
      return 'number';
    }

    // レジスタ (R0-R15)
    if (stream.match(/^R\d+\b/i)) {
      if (state.inArgs) state.argCount++;
      state.afterLabel = false;
      return 'variableName'; 
    }

    // ラベル定義 (Label:)
    if (stream.match(/^\w+:/)) {
      state.afterLabel = true;
      return 'labelName';
    }

    // 識別子（命令、条件、タイプ、ラベル参照）
    if (stream.match(/^\w+/)) {
      const word = stream.current().toUpperCase();
      state.afterLabel = false;

      // ニーモニック（引数解析中でない場合）
      if (!state.inArgs && instructions.includes(word)) {
        state.inArgs = true;
        state.argCount = 0;
        // ALU/SHIFT命令の場合、3番目の引数（インデックス2）がTypeフィールド
        state.expectTypeAt = hasTypeField(word) ? 2 : -1;
        return 'keyword'; // 紫色
      }

      // 引数解析中
      if (state.inArgs) {
        // Typeフィールド
        if (state.argCount === state.expectTypeAt && types.includes(word)) {
          state.argCount++;
          // 'string' タグを返すことで、One Darkテーマの緑色(#98c379)を適用
          return 'string'; 
        }

        // 条件コード（BRT/BRF/LCOなどの最初の引数）
        if (state.argCount === 0 && conditions.includes(word)) {
          state.argCount++;
          return 'className'; // 黄色系
        }

        // その他の識別子（ラベル参照など）
        state.argCount++;
        return 'variable';
      }

      // その他
      return 'variable';
    }

    // カンマやその他の文字はスキップ
    stream.next();
    return null;
  }
};

export const srxLanguage = StreamLanguage.define(srxLanguageDef);