<script setup>
import { computed, watch, shallowRef, ref } from "vue";
import { Codemirror } from "vue-codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView, keymap } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { indentUnit } from "@codemirror/language";
import { indentationMarkers } from "@replit/codemirror-indentation-markers";
import { lintGutter, linter } from "@codemirror/lint";
import { srxLanguage } from "../core/srx-language";

// 補完拡張のインポート
import { autocompletion, completeFromList } from "@codemirror/autocomplete";
import {
    completionKeywords,
    suggestRegisterSequence,
} from "../core/completion.js";
import {
    INSTRUCTIONS,
    MACRO_NAMES,
    INSTRUCTION_TYPE_KEYWORDS,
} from "../core/isa.js";

// 補完アイコンCDNマップ
const iconMap = {
    keyword: "https://cdn.jsdelivr.net/npm/@tabler/icons/icons/settings.svg",
    variable: "https://cdn.jsdelivr.net/npm/@tabler/icons/icons/cpu.svg",
    enum: "https://cdn.jsdelivr.net/npm/@tabler/icons/icons/function.svg",
    macro: "https://cdn.jsdelivr.net/npm/@tabler/icons/icons/magic-wand.svg",
};

const props = defineProps({
    modelValue: String,
    settings: Object,
    errorLine: Number,
    errorMsg: String,
});

const emit = defineEmits(["update:modelValue", "change"]);

const viewRef = shallowRef(null);

// 診断情報を保持するref
const diagnostics = ref([]);

// CodeMirror初期化時のイベントハンドラ
const handleReady = (payload) => {
    viewRef.value = payload.view;
    // 初期化時に現在のエラー情報を適用
    updateDiagnostics();
};

// 診断情報を更新する関数
const updateDiagnostics = () => {
    const view = viewRef.value;
    if (!view) return;

    const newDiagnostics = [];

    if (props.errorMsg && props.errorLine > 0) {
        const doc = view.state.doc;
        if (props.errorLine <= doc.lines) {
            const lineInfo = doc.line(props.errorLine);
            newDiagnostics.push({
                from: lineInfo.from,
                to: lineInfo.to,
                severity: "error",
                message: props.errorMsg,
            });
        }
    }

    diagnostics.value = newDiagnostics;
};

// エラー情報の変更を監視
watch(
    () => [props.errorLine, props.errorMsg],
    () => {
        updateDiagnostics();
    },
    { immediate: true },
);

// カスタムキーマップ（Tab補完優先・ラベル入力後の自動インデント）
import { acceptCompletion } from "@codemirror/autocomplete";
const customKeymap = keymap.of([
    {
        key: "Tab",
        run: (view) => acceptCompletion(view) || false,
    },
    {
        key: "Enter",
        run: (view) => {
            const state = view.state;
            const selection = state.selection.main;
            if (!selection.empty) return false;
            const line = state.doc.lineAt(selection.head);
            const textBeforeCursor = line.text.slice(
                0,
                selection.head - line.from,
            );
            const codePart = textBeforeCursor.split(";")[0].trimEnd();
            if (codePart.endsWith(":")) {
                const currentIndent = line.text.match(/^\s*/)[0];
                const unit = "    ";
                const insertText = "\n" + currentIndent + unit;
                view.dispatch(
                    state.update({
                        changes: { from: selection.head, insert: insertText },
                        selection: {
                            anchor: selection.head + insertText.length,
                        },
                        scrollIntoView: true,
                    }),
                );
                return true;
            }
            return false;
        },
    },
]);

// 外部から診断情報を提供するlinter
const externalLinter = linter(() => {
    return diagnostics.value;
});

const extensions = computed(() => {
    const exts = [
        srxLanguage,
        oneDark,
        customKeymap,
        lintGutter(),
        externalLinter, // ここで外部linterを使用

        // --- 補完拡張を追加 ---
        autocompletion({
            activateOnTyping: true,
            override: [
                // スペース直後で明示的に補完パネルを開く＋applyで自動カンマ補完
                (context) => {
                    // スペース直後かどうか判定
                    const before = context.matchBefore(/(\s)$/);
                    if (before && before.to === context.pos) {
                        // 直前の行を取得
                        const line = context.state.doc.lineAt(context.pos);
                        const text = line.text
                            .slice(0, context.pos - line.from)
                            .trimEnd();
                        // 命令名とオペランドを抽出
                        const tokens = text.split(/[\s,]+/).filter(Boolean);
                        if (tokens.length === 0) return null;
                        const mnemonic = tokens[0].toUpperCase();
                        const operandIndex = tokens.length - 1;
                        // 命令ごとのオペランド型ヒント
                        const OPERAND_HINTS = {
                            ADD: ["reg", "reg", "type", "reg"],
                            SUB: ["reg", "reg", "type", "reg"],
                            BIT: ["reg", "reg", "type", "reg"],
                            SHF: ["reg", "reg", "type", "imm"],
                            BRT: ["cond", "imm"],
                            BRF: ["cond", "imm"],
                            LCO: ["cond", "reg", "imm"],
                            LIM: ["reg", "imm"],
                            MST: ["reg", "reg", "imm"],
                            MLD: ["reg", "reg", "imm"],
                            PST: ["reg", "reg", "imm"],
                            PLD: ["reg", "reg", "imm"],
                            PSH: ["reg"],
                            POP: ["reg"],
                            PCT: ["reg", "reg"],
                            SSS: ["imm", "imm"],
                            JMP: ["imm"],
                            CAL: ["imm"],
                            RET: [],
                            NOP: [],
                            HLT: [],
                            UDI: [],
                        };
                        function getOperandType(mnemonic, index) {
                            return OPERAND_HINTS[mnemonic]?.[index] || null;
                        }
                        const opType = getOperandType(mnemonic, operandIndex);
                        // オペランド数
                        const operandCount =
                            OPERAND_HINTS[mnemonic]?.length || 0;
                        // ラベル候補取得
                        const labelMap = new Map();
                        for (let i = 0; i < context.state.doc.lines; ++i) {
                            const linetxt = context.state.doc.line(i + 1).text;
                            const match = linetxt.match(/^(\w+):/);
                            if (match) labelMap.set(match[1], true);
                        }
                        // 厳密な型判定で候補生成
                        if (opType === "reg") {
                            // レジスタ候補のみ
                            return {
                                from: context.pos,
                                options: completionKeywords
                                    .filter((word) => /^[Rr]\d+$/.test(word))
                                    .map((word) => ({
                                        label: word,
                                        type: "variable",
                                        render: (el) => {
                                            const span =
                                                document.createElement("span");
                                            span.textContent = word;
                                            span.style.color = "#56b6c2";
                                            el.appendChild(span);
                                        },
                                        apply: (view, completion, from, to) => {
                                            let insertText = word;
                                            if (
                                                operandIndex + 1 <
                                                operandCount
                                            ) {
                                                insertText += ",";
                                            }
                                            view.dispatch({
                                                changes: {
                                                    from,
                                                    to,
                                                    insert: insertText,
                                                },
                                                selection: {
                                                    anchor:
                                                        from +
                                                        insertText.length,
                                                },
                                            });
                                        },
                                    })),
                            };
                        } else if (opType === "type") {
                            // Typeフィールド候補のみ
                            let typeKeywords = [];
                            if (
                                mnemonic &&
                                INSTRUCTION_TYPE_KEYWORDS[mnemonic]
                            ) {
                                typeKeywords =
                                    INSTRUCTION_TYPE_KEYWORDS[mnemonic];
                            }
                            return {
                                from: context.pos,
                                options: typeKeywords.map((type) => ({
                                    label: type,
                                    type: "constant",
                                    render: (el) => {
                                        const span =
                                            document.createElement("span");
                                        span.textContent = type;
                                        span.style.color = "#d19a66";
                                        el.appendChild(span);
                                    },
                                    apply: (view, completion, from, to) => {
                                        let insertText = type;
                                        if (operandIndex + 1 < operandCount) {
                                            insertText += ",";
                                        }
                                        view.dispatch({
                                            changes: {
                                                from,
                                                to,
                                                insert: insertText,
                                            },
                                            selection: {
                                                anchor:
                                                    from + insertText.length,
                                            },
                                        });
                                    },
                                })),
                            };
                        } else if (opType === "cond") {
                            // 条件コード候補のみ
                            const conds = ["AL", "Z", "C", "N"];
                            return {
                                from: context.pos,
                                options: conds.map((cond) => ({
                                    label: cond,
                                    type: "constant",
                                    render: (el) => {
                                        const span =
                                            document.createElement("span");
                                        span.textContent = cond;
                                        span.style.color = "#d19a66";
                                        el.appendChild(span);
                                    },
                                    apply: (view, completion, from, to) => {
                                        let insertText = cond;
                                        if (operandIndex + 1 < operandCount) {
                                            insertText += ",";
                                        }
                                        view.dispatch({
                                            changes: {
                                                from,
                                                to,
                                                insert: insertText,
                                            },
                                            selection: {
                                                anchor:
                                                    from + insertText.length,
                                            },
                                        });
                                    },
                                })),
                            };
                        } else if (opType === "imm") {
                            // 即値候補＋ラベル候補（分岐命令など）
                            const imms = ["0", "1", "255"];
                            const isBranch = [
                                "JMP",
                                "BRT",
                                "BRF",
                                "CAL",
                            ].includes(mnemonic);
                            let labelOptions = [];
                            if (isBranch && labelMap.size > 0) {
                                labelOptions = Array.from(labelMap.keys()).map(
                                    (label) => ({
                                        label,
                                        type: "variable",
                                        render: (el) => {
                                            const span =
                                                document.createElement("span");
                                            span.textContent = label;
                                            span.style.color = "#56b6c2";
                                            el.appendChild(span);
                                        },
                                        apply: (view, completion, from, to) => {
                                            let insertText = label;
                                            if (
                                                operandIndex + 1 <
                                                operandCount
                                            ) {
                                                insertText += ",";
                                            }
                                            view.dispatch({
                                                changes: {
                                                    from,
                                                    to,
                                                    insert: insertText,
                                                },
                                                selection: {
                                                    anchor:
                                                        from +
                                                        insertText.length,
                                                },
                                            });
                                        },
                                    }),
                                );
                            }
                            return {
                                from: context.pos,
                                options: [
                                    ...imms.map((imm) => ({
                                        label: imm,
                                        type: "constant",
                                        render: (el) => {
                                            const span =
                                                document.createElement("span");
                                            span.textContent = imm;
                                            span.style.color = "#d19a66";
                                            el.appendChild(span);
                                        },
                                        apply: (view, completion, from, to) => {
                                            let insertText = imm;
                                            if (
                                                operandIndex + 1 <
                                                operandCount
                                            ) {
                                                insertText += ",";
                                            }
                                            view.dispatch({
                                                changes: {
                                                    from,
                                                    to,
                                                    insert: insertText,
                                                },
                                                selection: {
                                                    anchor:
                                                        from +
                                                        insertText.length,
                                                },
                                            });
                                        },
                                    })),
                                    ...labelOptions,
                                ],
                            };
                        } else {
                            // 型不明や命令直後は何も出さない
                            return null;
                        }
                    }
                    return null;
                },
                // 命令・マクロ・レジスタの基本補完
                completeFromList(
                    completionKeywords.map((word) => {
                        // 命令: keyword
                        if (
                            Object.prototype.hasOwnProperty.call(
                                INSTRUCTIONS,
                                word,
                            )
                        ) {
                            return {
                                label: word,
                                type: "keyword",
                                render: (el) => {
                                    const span = document.createElement("span");
                                    span.textContent = word;
                                    span.style.color = "#c678dd";
                                    el.appendChild(span);
                                },
                            };
                        }
                        // レジスタ: variable
                        if (/^[Rr]\d+$/.test(word)) {
                            return {
                                label: word,
                                type: "variable",
                                render: (el) => {
                                    const span = document.createElement("span");
                                    span.textContent = word;
                                    span.style.color = "#56b6c2";
                                    el.appendChild(span);
                                },
                            };
                        }
                        // マクロ: function
                        if (MACRO_NAMES.includes(word)) {
                            return {
                                label: word,
                                type: "function",
                                render: (el) => {
                                    const span = document.createElement("span");
                                    span.textContent = word;
                                    span.style.color = "#98c379";
                                    el.appendChild(span);
                                },
                            };
                        }
                        // Typeフィールド: constant
                        if (
                            Object.values(INSTRUCTION_TYPE_KEYWORDS)
                                .flat()
                                .includes(word)
                        ) {
                            return {
                                label: word,
                                type: "constant",
                                render: (el) => {
                                    const span = document.createElement("span");
                                    span.textContent = word;
                                    span.style.color = "#d19a66";
                                    el.appendChild(span);
                                },
                            };
                        }
                        // その他
                        return { label: word, type: "text" };
                    }),
                ),
                // PSH.x/POP.xの直後に一括レジスタ補完
                (context) => {
                    // 例: "psh.16 " の直後で補完
                    const before = context.matchBefore(/(psh|pop)\.(\d+)\s*$/i);
                    if (before) {
                        const count = parseInt(
                            before.text.match(/\.(\d+)/)[1],
                            10,
                        );
                        if (count > 0 && count <= 16) {
                            return {
                                from: before.to,
                                options: [
                                    {
                                        label: suggestRegisterSequence(
                                            "r",
                                            count,
                                        ),
                                        type: "variable",
                                        render: (el) => {
                                            const span =
                                                document.createElement("span");
                                            span.textContent =
                                                suggestRegisterSequence(
                                                    "r",
                                                    count,
                                                );
                                            span.style.color = "#56b6c2";
                                            el.appendChild(span);
                                        },
                                        apply: (view, completion, from, to) => {
                                            // from位置の直前が空白かどうかを判定
                                            const before = view.state.sliceDoc(
                                                from - 1,
                                                from,
                                            );
                                            let insertText =
                                                suggestRegisterSequence(
                                                    "r",
                                                    count,
                                                );
                                            if (before !== " " && from > 0) {
                                                insertText = " " + insertText;
                                            }
                                            view.dispatch({
                                                changes: {
                                                    from,
                                                    to,
                                                    insert: insertText,
                                                },
                                            });
                                        },
                                    },
                                ],
                                validFor: /$/,
                            };
                        }
                    }
                    return null;
                },
                // Typeフィールド補完（命令ごとにisa.jsから候補を取得）
                (context) => {
                    // 現在行の命令名をパース
                    const line = context.state.doc.lineAt(context.pos);
                    const text = line.text.slice(0, context.pos - line.from);
                    // 命令名をパース（例: ADD R1, R2, <ここ>)
                    const match = text.match(
                        /^\s*([A-Z]+)\s+[^,]*,[^,]*,\s*([A-Z]*)$/i,
                    );
                    let mnemonic = null;
                    if (match) {
                        mnemonic = match[1].toUpperCase();
                    }
                    let typeKeywords = [];
                    if (mnemonic && INSTRUCTION_TYPE_KEYWORDS[mnemonic]) {
                        typeKeywords = INSTRUCTION_TYPE_KEYWORDS[mnemonic];
                    }
                    if (typeKeywords.length > 0) {
                        const before = context.matchBefore(/[A-Z]*$/i);
                        if (before) {
                            return {
                                from: before.from,
                                options: typeKeywords.map((type) => ({
                                    label: type,
                                    type: "constant",
                                    render: (el) => {
                                        const span =
                                            document.createElement("span");
                                        span.textContent = type;
                                        span.style.color = "#d19a66";
                                        el.appendChild(span);
                                    },
                                })),
                                validFor: /^[A-Z]*$/i,
                            };
                        }
                    }
                    return null;
                },
            ],
        }),

        EditorState.tabSize.of(4),
        indentUnit.of("    "),
        indentationMarkers({
            colors: {
                dark: "#3E4451",
                activeDark: "#61AFEF",
                light: "#D1D5DB",
                activeLight: "#3B82F6",
            },
            thickness: 1,
            activeThickness: 1,
            hideFirstIndent: false,
            markerType: "line",
        }),
        EditorView.theme({
            "&": { height: "100%", fontSize: `${props.settings.fontSize}px` },
            ".cm-scroller": {
                overflow: "auto",
            },
            ".cm-gutters": {
                backgroundColor: "#0f172a",
                borderRight: "1px solid #1e293b",
                color: "#64748b",
            },
            ".cm-activeLineGutter": {
                backgroundColor: "#1e293b",
            },
        }),
    ];

    if (props.settings.wordWrap) {
        exts.push(EditorView.lineWrapping);
    }

    return exts;
});

const handleChange = (val) => {
    emit("update:modelValue", val);
    emit("change");
};
</script>

<template>
    <div
        class="h-full w-full overflow-hidden rounded-lg border border-slate-700 shadow-inner bg-[#282c34]"
    >
        <Codemirror
            :model-value="modelValue"
            :extensions="extensions"
            :style="{ height: '100%', fontFamily: settings.fontFamily }"
            :indent-with-tab="false"
            :tab-size="4"
            :autofocus="true"
            @update:model-value="handleChange"
            @ready="handleReady"
        />
    </div>
</template>

<style>
.cm-editor {
    outline: none !important;
}

/* 補完パネルのカスタマイズ */
.cm-tooltip-autocomplete {
    font-size: 1.25em;
    background: #232946;
    color: #eaeaea;
    border-radius: 8px;
    border: 1.5px solid #3b4252;
    box-shadow: 0 4px 24px #000a;
    min-width: 320px;
    max-width: 480px;
}
.cm-tooltip-autocomplete ul {
    padding: 0.25em 0;
}
.cm-tooltip-autocomplete li {
    padding: 0.35em 1.2em 0.35em 0.7em;
    font-size: 1.1em;
    border-radius: 6px;
    margin: 0.1em 0.2em;
    display: flex;
    align-items: center;
    gap: 0.5em;
}
.cm-tooltip-autocomplete li[aria-selected] {
    background: #3b82f6;
    color: #fff;
}
</style>
