<script setup>
import { computed, watch, shallowRef, ref } from 'vue';
import { Codemirror } from 'vue-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { indentUnit } from '@codemirror/language';
import { indentationMarkers } from '@replit/codemirror-indentation-markers';
import { lintGutter, linter } from '@codemirror/lint';
import { srxLanguage } from '../core/srx-language';

const props = defineProps({
  modelValue: String,
  settings: Object,
  errorLine: Number,
  errorMsg: String
});

const emit = defineEmits(['update:modelValue', 'change']);

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
        message: props.errorMsg
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
  { immediate: true }
);

// カスタムキーマップ（ラベル入力後の自動インデント）
const customKeymap = keymap.of([
  {
    key: "Enter",
    run: (view) => {
      const state = view.state;
      const selection = state.selection.main;
      if (!selection.empty) return false;
      const line = state.doc.lineAt(selection.head);
      const textBeforeCursor = line.text.slice(0, selection.head - line.from);
      const codePart = textBeforeCursor.split(';')[0].trimEnd();
      if (codePart.endsWith(':')) {
        const currentIndent = line.text.match(/^\s*/)[0];
        const unit = "    ";
        const insertText = "\n" + currentIndent + unit;
        view.dispatch(state.update({
          changes: { from: selection.head, insert: insertText },
          selection: { anchor: selection.head + insertText.length },
          scrollIntoView: true
        }));
        return true;
      }
      return false;
    }
  }
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
    
    EditorState.tabSize.of(4),
    indentUnit.of("    "),
    indentationMarkers({
        colors: {
            dark: '#3E4451',
            activeDark: '#61AFEF',
            light: '#D1D5DB',
            activeLight: '#3B82F6',
        },
        thickness: 1,
        activeThickness: 1,
        hideFirstIndent: false,
        markerType: "line",
    }),
    EditorView.theme({
        "&": { height: "100%", fontSize: `${props.settings.fontSize}px` },
        ".cm-scroller": {
            overflow: "auto"
        },
        ".cm-gutters": {
            backgroundColor: "#0f172a",
            borderRight: "1px solid #1e293b",
            color: "#64748b"
        },
        ".cm-activeLineGutter": {
            backgroundColor: "#1e293b"
        }
    })
  ];

  if (props.settings.wordWrap) {
    exts.push(EditorView.lineWrapping);
  }

  return exts;
});

const handleChange = (val) => {
  emit('update:modelValue', val);
  emit('change');
};
</script>

<template>
  <div class="h-full w-full overflow-hidden rounded-lg border border-slate-700 shadow-inner bg-[#282c34]">
    <Codemirror
      :model-value="modelValue"
      :extensions="extensions"
      :style="{ height: '100%', fontFamily: settings.fontFamily }"
      :indent-with-tab="true"
      :tab-size="4"
      :autofocus="true"
      @update:model-value="handleChange"
      @ready="handleReady" 
    />
  </div>
</template>

<style>
.cm-editor { outline: none !important; }
</style>
