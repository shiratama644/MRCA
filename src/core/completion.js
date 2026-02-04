import { INSTRUCTIONS } from "./isa";
import { MACRO_OPS } from "./macros";

// R0～R15のレジスタ名
const registers = Array.from({ length: 16 }, (_, i) => `R${i}`);

// 命令名・マクロ名・レジスタ名の補完候補リスト
export const completionKeywords = [
  ...Object.keys(INSTRUCTIONS),
  ...Object.keys(MACRO_OPS),
  ...registers,
];

// PSH/POPなどで大量レジスタを一括補完するための関数
// R0（ゼロレジスタ）を除外し、r1, r2, ... から始める
// 例: suggestRegisterSequence('r', 8) => "r1, r2, r3, r4, r5, r6, r7, r8"
export function suggestRegisterSequence(prefix, count) {
  return Array.from({ length: count }, (_, i) => `${prefix}${i + 1}`).join(
    ", ",
  );
}
