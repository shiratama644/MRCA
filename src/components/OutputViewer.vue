<script setup>
import { computed } from 'vue';
import { Codemirror } from 'vue-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView, lineNumbers } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { srxLanguage } from '../core/srx-language';

const props = defineProps({
  machineCodes: Array,
  assembledLines: { type: Array, default: () => [] },
  settings: Object
});

// 内部状態として viewMode を管理する代わりに、親から渡されるか、ここで持つか。
// ここではシンプルに ref で持ちます。
import { ref } from 'vue';
const viewMode = ref("ASM"); // 初期値をASMに変更（見栄えが良いので）

// --- 表示用テキストの生成 ---
const outputText = computed(() => {
    if (props.machineCodes.length === 0) return "; Waiting for input...";

    if (viewMode.value === 'ASM') {
        return props.assembledLines.join('\n');
    } else if (viewMode.value === 'HEX') {
        return props.machineCodes.map(code => {
            const hex = code.toString(16).toUpperCase().padStart(6, '0');
            return hex.match(/.{1,2}/g).join(' ');
        }).join('\n');
    } else { // BIN
        return props.machineCodes.map(code => {
            const bin = code.toString(2).padStart(24, '0');
            return bin.match(/.{1,4}/g).join(' ');
        }).join('\n');
    }
});

// --- CodeMirror 拡張設定 ---
const extensions = computed(() => {
    const exts = [
        oneDark,
        EditorView.editable.of(false),
        EditorState.readOnly.of(true),
        
        // ★ ここを変更: 条件付きで追加
        ...(props.settings.wordWrap ? [EditorView.lineWrapping] : []),
        
        lineNumbers({
            formatNumber: (n) => (n - 1).toString(16).toUpperCase().padStart(2, '0')
        }),

        EditorView.theme({
            "&": { height: "100%", fontSize: `${props.settings.fontSize}px` },
            ".cm-scroller": { overflow: "auto" },
            ".cm-gutters": { 
                backgroundColor: "#282c34", 
                borderRight: "1px solid #3e4451", 
                color: "#64748b" 
            },
            ".cm-line": { paddingLeft: "8px" }
        })
    ];

    if (viewMode.value === 'ASM') {
        exts.push(srxLanguage);
    }

    return exts;
});
</script>

<template>
  <div class="h-full flex flex-col min-h-0 gap-1">
      <div class="flex justify-between items-center px-1 shrink-0">
          <label class="text-xs font-bold text-slate-400 tracking-wider">
              {{ viewMode === 'ASM' ? 'FINAL ASSEMBLY' : 'MACHINE CODE (24-bit)' }}
          </label>
          <div class="flex bg-slate-800 rounded p-0.5 border border-slate-700">
              <button @click="viewMode='HEX'" :class="viewMode==='HEX' ? 'bg-cyan-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'" class="px-2 py-0.5 text-[10px] font-bold rounded transition">HEX</button>
              <button @click="viewMode='BIN'" :class="viewMode==='BIN' ? 'bg-cyan-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'" class="px-2 py-0.5 text-[10px] font-bold rounded transition">BIN</button>
              <button @click="viewMode='ASM'" :class="viewMode==='ASM' ? 'bg-cyan-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'" class="px-2 py-0.5 text-[10px] font-bold rounded transition">ASM</button>
          </div>
      </div>
      
      <!-- CodeMirror Viewer -->
      <div class="flex-1 rounded-lg overflow-hidden border border-slate-700 shadow-inner bg-[#282c34]">
          <Codemirror
            :model-value="outputText"
            :extensions="extensions"
            :style="{ height: '100%', fontFamily: settings.fontFamily }"
            :tab-size="4"
          />
      </div>
  </div>
</template>

<style scoped>
/* 必要であれば追加の微調整 */
</style>