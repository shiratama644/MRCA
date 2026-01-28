## Directory Structure
```
.
|── README.md
|── index.html
|── public
|── |── vite.svg
|── src
|── |── App.vue
|── |── assets
|── |── components
|── |── |── CodeEditor.vue
|── |── |── AppHeader.vue
|── |── |── SettingsModal.vue
|── |── |── OutputViewer.vue
|── |── main.js
|── |── style.css
|── |── core
|── |── |── isa.js
|── |── |── assembler.js
|── |── |── macros.js
|── |── |── srx-language.js
|── |── composables
|── |── |── useSettings.js
|── vite.config.js
|── package.json
|── node_modules
|── |── tailwindcss
|── |── vue
|── |── vite
|── |── @vitejs
|── |── |── plugin-vue
|── |── @tailwindcss
|── |── |── vite
|── |── postcss
|── |── autoprefixer
|── |── vue-codemirror
|── |── @codemirror
|── |── |── view
|── |── |── state
|── |── |── language
|── |── |── commands
|── |── |── theme-one-dark
|── |── |── lint
|── |── @lezer
|── |── |── highlight
|── |── @replit
|── |── |── codemirror-indentation-markers
|── |── @uiw
|── |── |── codemirror-theme-dracula
|── |── @heroicons
|── |── |── vue
|── |── @babel
|── |── |── runtime
|── code.md
|── pnpm-lock.yaml
```
---

## File: .vscode/extensions.json
```json
{
  "recommendations": ["Vue.volar"]
}

```

## File: README.md
```md
# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).

```

## File: .gitignore
```gitignore
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

```

## File: index.html
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>srx-fusion-assembler</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>

```

## File: public/vite.svg
```svg
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" class="iconify iconify--logos" width="31.88" height="32" preserveAspectRatio="xMidYMid meet" viewBox="0 0 256 257"><defs><linearGradient id="IconifyId1813088fe1fbc01fb466" x1="-.828%" x2="57.636%" y1="7.652%" y2="78.411%"><stop offset="0%" stop-color="#41D1FF"></stop><stop offset="100%" stop-color="#BD34FE"></stop></linearGradient><linearGradient id="IconifyId1813088fe1fbc01fb467" x1="43.376%" x2="50.316%" y1="2.242%" y2="89.03%"><stop offset="0%" stop-color="#FFEA83"></stop><stop offset="8.333%" stop-color="#FFDD35"></stop><stop offset="100%" stop-color="#FFA800"></stop></linearGradient></defs><path fill="url(#IconifyId1813088fe1fbc01fb466)" d="M255.153 37.938L134.897 252.976c-2.483 4.44-8.862 4.466-11.382.048L.875 37.958c-2.746-4.814 1.371-10.646 6.827-9.67l120.385 21.517a6.537 6.537 0 0 0 2.322-.004l117.867-21.483c5.438-.991 9.574 4.796 6.877 9.62Z"></path><path fill="url(#IconifyId1813088fe1fbc01fb467)" d="M185.432.063L96.44 17.501a3.268 3.268 0 0 0-2.634 3.014l-5.474 92.456a3.268 3.268 0 0 0 3.997 3.378l24.777-5.718c2.318-.535 4.413 1.507 3.936 3.838l-7.361 36.047c-.495 2.426 1.782 4.5 4.151 3.78l15.304-4.649c2.372-.72 4.652 1.36 4.15 3.788l-11.698 56.621c-.732 3.542 3.979 5.473 5.943 2.437l1.313-2.028l72.516-144.72c1.215-2.423-.88-5.186-3.54-4.672l-25.505 4.922c-2.396.462-4.435-1.77-3.759-4.114l16.646-57.705c.677-2.35-1.37-4.583-3.769-4.113Z"></path></svg>
```

## File: src/App.vue
```vue
<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { assembleSource } from './core/assembler';
import { useSettings } from './composables/useSettings';
import AppHeader from './components/AppHeader.vue';
import SettingsModal from './components/SettingsModal.vue';
import CodeEditor from './components/CodeEditor.vue';
import OutputViewer from './components/OutputViewer.vue';

// --- State ---
const { settings } = useSettings();
const showSettings = ref(false);
const activeTab = ref('editor');
const fileInput = ref(null); // ファイル入力用ref

// 初期コード (LocalStorageになければこれを使う)
const DEFAULT_CODE = `; SRX FUSION V Demo (Macros)
INIT:
    CLR R0        ; -> LIM R0, 0
    LIM R1, 0x10  
    INC R1        ; -> LIM R0, 1 + ADD...

LOOP:
    ADD R1, R1, ADD, R2
    ; Negative Immediate
    LIM R3, -5    ; -> LIM R3, 0xFB
        
    JMP 0x03
`;

const sourceCode = ref(DEFAULT_CODE);

// --- Auto-Save Logic ---
const STORAGE_KEY = 'srx-source-code';

onMounted(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        sourceCode.value = saved;
    }
    runAssemble(); // 初期アセンブル
});

// コード変更時に保存
watch(sourceCode, (newVal) => {
    localStorage.setItem(STORAGE_KEY, newVal);
});

// --- Assemble Logic ---
const machineCodes = ref([]);
const assembledLines = ref([]);
const errorMsg = ref("");
const errorLine = ref(0);
const lineCount = computed(() => sourceCode.value.split('\n').length);

const runAssemble = () => {
    const result = assembleSource(sourceCode.value);
    machineCodes.value = result.machineCodes;
    assembledLines.value = result.assembledLines || [];
    errorMsg.value = result.error || "";
    errorLine.value = result.errorLine || 0;
};

// --- File Operations ---

// 1. Download Binary (.bin)
const downloadBin = () => {
    if (errorMsg.value || machineCodes.value.length === 0) return;
    const buffer = new Uint8Array(machineCodes.value.length * 3);
    machineCodes.value.forEach((c, i) => {
        buffer[i*3] = (c >> 16) & 0xFF;
        buffer[i*3+1] = (c >> 8) & 0xFF;
        buffer[i*3+2] = c & 0xFF;
    });
    downloadBlob(new Blob([buffer], { type: "application/octet-stream" }), "program.bin");
};

// 2. Download Source (.asm)
const downloadSource = () => {
    downloadBlob(new Blob([sourceCode.value], { type: "text/plain" }), "source.asm");
};

// Helper
const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// 3. Upload Source
const triggerUpload = () => {
    fileInput.value.click();
};

const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        sourceCode.value = e.target.result;
        runAssemble();
        // inputをリセット（同じファイルを再選択できるように）
        event.target.value = '';
    };
    reader.readAsText(file);
};
</script>

<template>
<div class="h-dvh flex flex-col overflow-hidden text-slate-200 bg-slate-900 w-full max-w-7xl mx-auto p-2 sm:p-4 gap-3 relative">
    
    <!-- Hidden File Input -->
    <input 
        type="file" 
        ref="fileInput" 
        class="hidden" 
        accept=".asm,.txt,.srx" 
        @change="handleFileUpload"
    >

    <SettingsModal 
        :show="showSettings" 
        :settings="settings" 
        @close="showSettings = false" 
    />

    <AppHeader 
        @openSettings="showSettings = true" 
        @downloadBin="downloadBin"
        @downloadSource="downloadSource"
        @uploadSource="triggerUpload"
        :canDownload="!errorMsg && machineCodes.length > 0"
    />

    <!-- Mobile Tabs -->
    <div class="flex md:hidden bg-slate-800 rounded-lg p-1 gap-1 border border-slate-700 shrink-0">
        <button 
            @click="activeTab = 'editor'"
            class="flex-1 py-1.5 text-xs font-bold rounded transition text-center"
            :class="activeTab === 'editor' ? 'bg-slate-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'"
        >
            EDITOR
        </button>
        <button 
            @click="activeTab = 'output'"
            class="flex-1 py-1.5 text-xs font-bold rounded transition text-center flex items-center justify-center gap-2"
            :class="activeTab === 'output' ? 'bg-slate-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'"
        >
            OUTPUT
            <span v-if="errorMsg" class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span v-else class="w-2 h-2 rounded-full bg-emerald-500"></span>
        </button>
    </div>

    <main class="flex-1 flex flex-col md:flex-row gap-3 min-h-0 relative">
        <!-- Editor Section -->
        <div 
            class="flex-1 flex flex-col min-h-0 gap-1 transition-all duration-300 absolute inset-0 md:relative z-10 md:z-auto bg-slate-900 md:bg-transparent"
            :class="[
                activeTab === 'editor' ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 md:translate-x-0 md:opacity-100 pointer-events-none md:pointer-events-auto'
            ]"
        >
            <div class="flex justify-between items-center px-1 shrink-0">
                <label class="text-xs font-bold text-slate-400 tracking-wider">SOURCE CODE</label>
                <span class="text-xs text-slate-600 font-mono">{{ lineCount }} LOC</span>
            </div>
            
            <CodeEditor 
                v-model="sourceCode" 
                :settings="settings"
                :errorLine="errorLine"
                :errorMsg="errorMsg"
                @change="runAssemble"
            />
        </div>

        <!-- Output / Status Section -->
        <div 
            class="flex-1 md:w-5/12 flex flex-col gap-3 min-h-0 absolute inset-0 md:relative z-10 md:z-auto bg-slate-900 md:bg-transparent transition-all duration-300"
             :class="[
                activeTab === 'output' ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 md:translate-x-0 md:opacity-100 pointer-events-none md:pointer-events-auto'
            ]"
        >
            <OutputViewer 
                :machineCodes="machineCodes" 
                :assembledLines="assembledLines"
                :settings="settings" 
            />
            
            <!-- Status Box -->
            <div class="h-1/3 flex flex-col min-h-[120px] gap-1 shrink-0">
                 <div class="flex justify-between items-center px-1">
                    <label class="text-xs font-bold text-slate-400 tracking-wider">STATUS</label>
                    <span class="text-xs font-mono" :class="errorMsg ? 'text-red-400' : 'text-emerald-400'">
                        {{ errorMsg ? 'ERROR' : 'READY' }}
                    </span>
                 </div>
                 <div class="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-3 overflow-y-auto font-mono text-xs shadow-inner" :style="{ fontFamily: settings.fontFamily }">
                    <div v-if="errorMsg" class="text-red-400">
                        <div class="flex items-center gap-2 mb-1 text-red-300 font-bold">
                            <span>⚠</span> Line {{ errorLine }}
                        </div>
                        <p class="pl-5 border-l-2 border-red-900/50 leading-relaxed">{{ errorMsg }}</p>
                    </div>
                    <div v-else class="text-slate-300">
                        <div class="flex items-center gap-2 mb-2 text-emerald-400 font-bold">
                            <span>✓</span> Build Successful
                        </div>
                        <div class="grid grid-cols-2 gap-2 text-slate-400 pl-5 border-l-2 border-slate-700">
                            <div>Size:</div>
                            <div class="text-slate-200">{{ machineCodes.length * 3 }} <span class="text-slate-500">Bytes</span></div>
                            <div>Count:</div>
                            <div class="text-slate-200">{{ machineCodes.length }} <span class="text-slate-500">Insts</span></div>
                        </div>
                    </div>
                 </div>
            </div>
        </div>
    </main>
</div>
</template>
```

## File: src/components/CodeEditor.vue
```vue
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

```

## File: src/components/AppHeader.vue
```vue
<script setup>
defineProps({
  canDownload: Boolean
});

const emit = defineEmits(['openSettings', 'downloadBin', 'downloadSource', 'uploadSource']);
</script>

<template>
  <header class="flex-none flex justify-between items-center bg-slate-800 p-3 rounded-lg shadow border border-slate-700">
      <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-cyan-900 rounded flex items-center justify-center text-cyan-400 font-bold border border-cyan-700 select-none">V</div>
          <div>
              <h1 class="text-lg sm:text-xl font-bold text-cyan-400 tracking-tight leading-none">SRX FUSION</h1>
              <p class="text-[10px] text-slate-400 font-mono">24-BIT ASSEMBLER</p>
          </div>
      </div>
      <div class="flex items-center gap-2">
           <!-- Import (Upload) -->
          <button @click="emit('uploadSource')" class="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 rounded transition" title="Import .asm">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
          </button>

          <!-- Export Source (.asm) -->
          <button @click="emit('downloadSource')" class="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 rounded transition" title="Export .asm">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
          </button>

          <div class="w-px h-6 bg-slate-700 mx-1"></div>

          <!-- Settings -->
          <button @click="emit('openSettings')" class="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 rounded transition" title="Settings">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
          </button>

          <!-- Download Binary (.bin) -->
          <button @click="emit('downloadBin')" :disabled="!canDownload" :class="canDownload ? 'bg-cyan-700 hover:bg-cyan-600 border-cyan-600' : 'bg-slate-700 border-slate-600 text-slate-400 cursor-not-allowed'" class="text-white px-3 py-1.5 rounded text-xs sm:text-sm font-bold transition shadow border flex items-center gap-2" title="Export .bin">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              <span class="hidden sm:inline">.BIN</span>
          </button>
      </div>
  </header>
</template>
```

## File: src/components/SettingsModal.vue
```vue
<script setup>
defineProps({
  show: Boolean,
  settings: Object
});
defineEmits(['close']);

const fontOptions = ['JetBrains Mono', 'Fira Code', 'Roboto Mono', 'Source Code Pro', 'Courier New', 'monospace'];
</script>

<template>
  <div v-if="show" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" @click.self="$emit('close')">
      <div class="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md p-5 flex flex-col gap-4">
          <!-- Header -->
          <div class="flex justify-between items-center border-b border-slate-700 pb-3">
              <h2 class="text-lg font-bold text-cyan-400">Settings</h2>
              <button @click="$emit('close')" class="text-slate-400 hover:text-white">✕</button>
          </div>
          
          <div class="flex flex-col gap-5">
              <!-- Font Family -->
              <div class="flex flex-col gap-1">
                  <label class="text-sm text-slate-400 font-bold">Font Family</label>
                  <select v-model="settings.fontFamily" class="bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none">
                      <option v-for="font in fontOptions" :key="font" :value="font">{{ font }}</option>
                  </select>
              </div>

              <!-- Font Size -->
              <div class="flex flex-col gap-1">
                  <div class="flex justify-between">
                      <label class="text-sm text-slate-400 font-bold">Font Size</label>
                      <span class="text-xs text-cyan-400">{{ settings.fontSize }}px</span>
                  </div>
                  <input type="range" v-model.number="settings.fontSize" min="10" max="24" step="1" class="accent-cyan-500 w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer">
              </div>

              <!-- Line Height -->
               <div class="flex flex-col gap-1">
                  <div class="flex justify-between">
                      <label class="text-sm text-slate-400 font-bold">Line Height</label>
                      <span class="text-xs text-cyan-400">{{ settings.lineHeight }}</span>
                  </div>
                  <input type="range" v-model.number="settings.lineHeight" min="1.0" max="2.0" step="0.1" class="accent-cyan-500 w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer">
              </div>

              <!-- ★ Word Wrap Toggle ★ -->
              <div class="flex justify-between items-center pt-2 border-t border-slate-700/50">
                  <label class="text-sm text-slate-400 font-bold cursor-pointer" @click="settings.wordWrap = !settings.wordWrap">Word Wrap</label>
                  <button 
                      @click="settings.wordWrap = !settings.wordWrap" 
                      class="w-11 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out relative focus:outline-none"
                      :class="settings.wordWrap ? 'bg-cyan-700' : 'bg-slate-600'"
                  >
                      <div 
                          class="w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200"
                          :class="settings.wordWrap ? 'translate-x-5' : 'translate-x-0'"
                      ></div>
                  </button>
              </div>
          </div>

          <div class="mt-2 text-center">
              <button @click="$emit('close')" class="bg-cyan-700 hover:bg-cyan-600 text-white w-full py-2 rounded-lg font-bold text-sm transition">Close</button>
          </div>
      </div>
  </div>
</template>
```

## File: src/components/OutputViewer.vue
```vue
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
```

## File: src/main.js
```js
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

createApp(App).mount('#app')

```

## File: src/style.css
```css
@import "tailwindcss";

/* 複数の等幅フォントを読み込み */
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;700&family=JetBrains+Mono:wght@400;700&family=Roboto+Mono:wght@400;700&family=Source+Code+Pro:wght@400;700&display=swap');

body {
  margin: 0;
  background-color: #0f172a;
  color: #e2e8f0;
  font-family: 'Segoe UI', sans-serif;
  overflow: hidden;
}

.cmt-typeName {
  color: #98c379 !important;
}


/* 以下、スクロールバー設定などはそのまま */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: #1e293b; }
::-webkit-scrollbar-thumb { background: #475569; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #64748b; }
```

## File: src/core/isa.js
```js
/**
 * SRX FUSION V Instruction Set Architecture
 */

// --- 1. Argument Formats ---
// 命令がどのような引数を取るかの定義
export const ARG_TYPES = {
    NO_ARGS:      'NO_ARGS',      // NOP
    SETTINGS:     'SETTINGS',     // SSS
    ADDR:         'ADDR',         // JMP
    COND_ADDR:    'COND_ADDR',    // BRT
    REG_IMM:      'REG_IMM',      // LIM
    COND_REG_IMM: 'COND_REG_IMM', // LCO
    MEM_STORE:    'MEM_STORE',    // MST, PST
    MEM_LOAD:     'MEM_LOAD',     // MLD, PLD
    STACK_PUSH:   'STACK_PUSH',   // PSH
    STACK_POP:    'STACK_POP',    // POP
    ALU:          'ALU',          // ADD, SUB, BIT
    SHIFT:        'SHIFT',        // SHF
    TWO_REG:      'TWO_REG'       // PCT
};

// --- 2. Instruction Set ---
// 命令名、Opcode、引数タイプのマッピング
export const INSTRUCTIONS = {
    'NOP': { opcode: 0,  type: ARG_TYPES.NO_ARGS },
    'HLT': { opcode: 1,  type: ARG_TYPES.NO_ARGS },
    'SSS': { opcode: 2,  type: ARG_TYPES.SETTINGS },
    'JMP': { opcode: 3,  type: ARG_TYPES.ADDR },
    'BRT': { opcode: 4,  type: ARG_TYPES.COND_ADDR },
    'BRF': { opcode: 5,  type: ARG_TYPES.COND_ADDR },
    'CAL': { opcode: 6,  type: ARG_TYPES.ADDR },
    'RET': { opcode: 7,  type: ARG_TYPES.NO_ARGS },
    'LIM': { opcode: 8,  type: ARG_TYPES.REG_IMM },
    'LCO': { opcode: 9,  type: ARG_TYPES.COND_REG_IMM },
    'MST': { opcode: 10, type: ARG_TYPES.MEM_STORE },
    'MLD': { opcode: 11, type: ARG_TYPES.MEM_LOAD },
    'PST': { opcode: 12, type: ARG_TYPES.MEM_STORE },
    'PLD': { opcode: 13, type: ARG_TYPES.MEM_LOAD },
    'PSH': { opcode: 14, type: ARG_TYPES.STACK_PUSH },
    'POP': { opcode: 15, type: ARG_TYPES.STACK_POP },
    'ADD': { opcode: 16, type: ARG_TYPES.ALU },
    'SUB': { opcode: 17, type: ARG_TYPES.ALU },
    'BIT': { opcode: 18, type: ARG_TYPES.ALU },
    'SHF': { opcode: 19, type: ARG_TYPES.SHIFT },
    'PCT': { opcode: 20, type: ARG_TYPES.TWO_REG },
    'UDI': { opcode: 21, type: ARG_TYPES.NO_ARGS },
};

// --- 3. Constants ---
// 条件コードやALUタイプの定数定義
export const CONDITIONS = { 
    'AL': 0, 'Z': 1, 'C': 2, 'N': 3 
};

export const ALU_TYPES = { 
    'ADD': 0, 'CARRY': 1, 'WRAP': 2, 'BOTH': 3,
    'SUB': 0, 'BORROW': 1, 'WRAP': 2, 'BOTH': 3,
    'XOR': 0, 'AND': 1, 'OR': 2, 'NOR': 3,
    'LSH': 0, 'RSH': 1, 'LRO': 2, 'RRO': 3
};

// --- 4. Macro Names ---
// マクロとして認識させる名前のリスト (実装は macros.js に分離)
export const MACRO_NAMES = ['MOV', 'CLR', 'INC', 'DEC', 'NOT'];
```

## File: src/core/assembler.js
```js
import { INSTRUCTIONS, ARG_TYPES, CONDITIONS, ALU_TYPES } from './isa';
import { MACRO_OPS } from './macros'; // マクロ実装をインポート

// --- Helper Functions ---
const parseNum = (str, labelMap) => {
    // ... (変更なし)
    str = str.trim();
    if (labelMap && labelMap.has(str)) return labelMap.get(str);
    
    let val = NaN;
    if (str.startsWith('0x') || str.startsWith('0X')) val = parseInt(str, 16);
    else if (str.startsWith('0b') || str.startsWith('0B')) val = parseInt(str.substring(2), 2);
    else val = parseInt(str, 10);
    
    if (isNaN(val)) throw new Error(`Invalid number or label: ${str}`);
    if (val < -128 || val > 255) throw new Error(`Value out of 8-bit range: ${val}`);
    return val & 0xFF;
};

const parseReg = (str) => {
    // ... (変更なし)
    str = str.trim().toUpperCase();
    if (!/^R\d+$/.test(str)) throw new Error(`Invalid register: ${str}`);
    const num = parseInt(str.substring(1), 10);
    if (num < 0 || num > 15) throw new Error(`Register out of range: ${str}`);
    return num;
};

const parseCond = (str) => {
    const key = str.trim().toUpperCase();
    if (CONDITIONS[key] === undefined) throw new Error(`Unknown condition: ${str}`);
    return CONDITIONS[key];
};

const parseType = (str) => {
    const key = str.trim().toUpperCase();
    if (ALU_TYPES[key] === undefined) throw new Error(`Unknown type: ${str}`);
    return ALU_TYPES[key];
};

const tokenize = (line) => {
    // ... (変更なし)
    const clean = line.split(';')[0].trim();
    if (!clean) return { label: null, mnemonic: null, args: [] };

    let label = null;
    let remain = clean;
    const labelMatch = remain.match(/^(\w+):/);
    if (labelMatch) {
        label = labelMatch[1];
        remain = remain.substring(labelMatch[0].length).trim();
    }

    if (!remain) return { label, mnemonic: null, args: [] };
    const tokens = remain.split(/[\s,]+/).filter(t => t.length > 0);
    return { label, mnemonic: tokens[0].toUpperCase(), args: tokens.slice(1) };
};

const fmtHex = (val) => '0x' + val.toString(16).toUpperCase().padStart(2, '0');

const formatAsm = (mnemonic, argsStr) => {
    return argsStr ? `${mnemonic} ${argsStr}` : mnemonic;
};

export function assembleSource(sourceCode) {
    const rawLines = sourceCode.split('\n');
    const machineCodes = [];
    const assembledLines = [];
    let error = null;
    let errorLine = 0;

    try {
        // --- Phase 1: Expansion & Label Collection ---
        const expandedLines = [];
        const sourceMap = []; 
        const labelMap = new Map();
        let currentAddress = 0;

        rawLines.forEach((line, origIdx) => {
            const { label, mnemonic, args } = tokenize(line);
            if (label) {
                if (labelMap.has(label)) throw new Error(`Duplicate label: ${label}`);
                labelMap.set(label, currentAddress);
            }
            if (!mnemonic) return;

            // ★ 修正: MACRO_OPS を使用
            if (MACRO_OPS[mnemonic]) {
                try {
                    MACRO_OPS[mnemonic](args).forEach((exLine) => {
                        expandedLines.push(exLine);
                        sourceMap.push(origIdx + 1);
                        currentAddress++;
                    });
                } catch (e) {
                    errorLine = origIdx + 1;
                    throw new Error(`Macro Error [${mnemonic}]: ${e.message}`);
                }
            } else {
                expandedLines.push(`${mnemonic} ${args.join(', ')}`);
                sourceMap.push(origIdx + 1);
                currentAddress++;
            }
        });

        // --- Phase 2: Assembly & Address Resolution ---
        expandedLines.forEach((line, idx) => {
            const { mnemonic, args } = tokenize(line);
            if (!mnemonic) return;

            const currentSourceLine = sourceMap[idx];
            errorLine = currentSourceLine;

            const def = INSTRUCTIONS[mnemonic];
            if (!def) throw new Error(`Unknown instruction: ${mnemonic}`);

            let operands = 0;
            let fmtAsmLine = "";

            try {
                // ★ 修正: FORMATS -> ARG_TYPES
                switch (def.type) {
                    case ARG_TYPES.NO_ARGS:
                        operands = 0;
                        fmtAsmLine = formatAsm(mnemonic, "");
                        break;
                    case ARG_TYPES.SETTINGS: {
                        const set = parseNum(args[0], labelMap) & 0xF;
                        const imm = parseNum(args[1], labelMap);
                        operands = (set << 12) | imm;
                        fmtAsmLine = formatAsm(mnemonic, `${set}, ${fmtHex(imm)}`);
                        break;
                    }
                    case ARG_TYPES.ADDR: {
                        const addr = parseNum(args[0], labelMap);
                        operands = addr;
                        fmtAsmLine = formatAsm(mnemonic, `${fmtHex(addr)}`);
                        break;
                    }
                    case ARG_TYPES.COND_ADDR: {
                        const cond = args[0].toUpperCase(); parseCond(cond); 
                        const addr = parseNum(args[1], labelMap);
                        operands = (parseCond(cond) << 12) | addr;
                        fmtAsmLine = formatAsm(mnemonic, `${cond}, ${fmtHex(addr)}`);
                        break;
                    }
                    case ARG_TYPES.REG_IMM: {
                        const r = parseReg(args[0]);
                        const imm = parseNum(args[1], labelMap);
                        operands = (r << 12) | imm;
                        fmtAsmLine = formatAsm(mnemonic, `R${r}, ${fmtHex(imm)}`);
                        break;
                    }
                    case ARG_TYPES.COND_REG_IMM: {
                        const cond = args[0].toUpperCase(); parseCond(cond);
                        const r = parseReg(args[1]);
                        const imm = parseNum(args[2], labelMap);
                        operands = (parseCond(cond) << 12) | (r << 8) | imm;
                        fmtAsmLine = formatAsm(mnemonic, `${cond}, R${r}, ${fmtHex(imm)}`);
                        break;
                    }
                    case ARG_TYPES.MEM_STORE: { 
                        const base = parseReg(args[0]);
                        const data = parseReg(args[1]);
                        const off = parseNum(args[2], labelMap);
                        operands = (data << 12) | (base << 8) | off;
                        fmtAsmLine = formatAsm(mnemonic, `R${base}, R${data}, ${fmtHex(off)}`);
                        break;
                    }
                    case ARG_TYPES.MEM_LOAD: { 
                        const dest = parseReg(args[0]);
                        const base = parseReg(args[1]);
                        const off = parseNum(args[2], labelMap);
                        operands = (dest << 12) | (base << 8) | off;
                        fmtAsmLine = formatAsm(mnemonic, `R${dest}, R${base}, ${fmtHex(off)}`);
                        break;
                    }
                    case ARG_TYPES.STACK_PUSH: {
                        const r = parseReg(args[0]);
                        operands = (r << 8);
                        fmtAsmLine = formatAsm(mnemonic, `R${r}`);
                        break;
                    }
                    case ARG_TYPES.STACK_POP: {
                        const r = parseReg(args[0]);
                        operands = (r << 12);
                        fmtAsmLine = formatAsm(mnemonic, `R${r}`);
                        break;
                    }
                    case ARG_TYPES.ALU: {
                        const dest = parseReg(args[0]);
                        const srcA = parseReg(args[1]);
                        const type = args[2].toUpperCase(); parseType(type);
                        const srcB = parseReg(args[3]);
                        operands = (dest << 12) | (srcA << 8) | (parseType(type) << 4) | srcB;
                        fmtAsmLine = formatAsm(mnemonic, `R${dest}, R${srcA}, ${type}, R${srcB}`);
                        break;
                    }
                    case ARG_TYPES.SHIFT: {
                        const dest = parseReg(args[0]);
                        const srcA = parseReg(args[1]);
                        const type = args[2].toUpperCase(); parseType(type);
                        const imm3 = parseNum(args[3], labelMap) & 0x7;
                        operands = (dest << 12) | (srcA << 8) | (parseType(type) << 4) | imm3;
                        fmtAsmLine = formatAsm(mnemonic, `R${dest}, R${srcA}, ${type}, ${imm3}`);
                        break;
                    }
                    case ARG_TYPES.TWO_REG: {
                        const dest = parseReg(args[0]);
                        const srcA = parseReg(args[1]);
                        operands = (dest << 12) | (srcA << 8);
                        fmtAsmLine = formatAsm(mnemonic, `R${dest}, R${srcA}`);
                        break;
                    }
                }
            } catch (e) {
                throw e;
            }

            const machineCode = ((def.opcode & 0x1F) << 16) | (operands & 0xFFFF);
            machineCodes.push(machineCode);
            assembledLines.push(fmtAsmLine);
        });

    } catch (e) {
        error = e.message;
    }

    return { machineCodes, assembledLines, error, errorLine };
}
```

## File: src/core/macros.js
```js
/**
 * Macro Definitions (Syntactic Sugar Logic)
 */

export const MACRO_OPS = {
    // MOV Dest, Src -> LIM R0, 0 + ADD Dest, Src, ADD, R0
    'MOV': (args) => {
        if(args.length !== 2) throw new Error("MOV requires 2 args: Dest, Src");
        const [dest, src] = args;
        return [
            `LIM R0, 0`,
            `ADD ${dest}, ${src}, ADD, R0`
        ];
    },

    // CLR Reg -> LIM Reg, 0
    'CLR': (args) => {
        if(args.length !== 1) throw new Error("CLR requires 1 arg: Reg");
        return [`LIM ${args[0]}, 0`];
    },

    // INC Reg -> LIM R0, 1 + ADD Reg, Reg, ADD, R0
    'INC': (args) => {
        if(args.length !== 1) throw new Error("INC requires 1 arg: Reg");
        const reg = args[0];
        return [
            `LIM R0, 1`,
            `ADD ${reg}, ${reg}, ADD, R0`
        ];
    },

    // DEC Reg -> LIM R0, 1 + SUB Reg, Reg, SUB, R0
    'DEC': (args) => {
        if(args.length !== 1) throw new Error("DEC requires 1 arg: Reg");
        const reg = args[0];
        return [
            `LIM R0, 1`,
            `SUB ${reg}, ${reg}, SUB, R0`
        ];
    },
    
    // NOT Reg -> BIT Reg, Reg, NOR, Reg
    'NOT': (args) => {
        if(args.length !== 1) throw new Error("NOT requires 1 arg: Reg");
        const reg = args[0];
        return [`BIT ${reg}, ${reg}, NOR, ${reg}`];
    }
};
```

## File: src/core/srx-language.js
```js
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
    expectTypeAt: -1,   // Typeフィールドが期待される位置（-1=なし）
    afterLabel: false   // ラベル定義の直後か
  }),

  token: (stream, state) => {
    // 空白スキップ
    if (stream.eatSpace()) {
      return null;
    }

    // コメント - 状態をリセット
    if (stream.peek() === ';') {
      stream.skipToEnd();
      state.inArgs = false;
      state.argCount = 0;
      state.expectTypeAt = -1;
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

      // ニーモニック（行の先頭、またはラベル定義の直後の最初の単語）
      if (!state.inArgs && instructions.includes(word)) {
        state.inArgs = true;
        state.argCount = 0;
        // ALU/SHIFT命令の場合、4番目の引数（インデックス3）がTypeフィールド
        state.expectTypeAt = hasTypeField(word) ? 3 : -1;
        return 'keyword';
      }

      // 引数解析中
      if (state.inArgs) {
        // Typeフィールドの位置で、かtypesに含まれる単語
        if (state.argCount === state.expectTypeAt && types.includes(word)) {
          state.argCount++;
          return 'typeName';
        }

        // 条件コード（BRT/BRF/LCOなどの最初の引数）
        if (state.argCount === 0 && conditions.includes(word)) {
          state.argCount++;
          return 'className';
        }

        // その他の識別子（ラベル参照など）
        state.argCount++;
        return 'variable';
      }

      // その他（ラベル参照など）
      return 'variable';
    }

    // カンマやその他の文字はスキップ
    stream.next();
    return null;
  }
};

export const srxLanguage = StreamLanguage.define(srxLanguageDef);

```

## File: src/composables/useSettings.js
```js
import { reactive, watch, onMounted } from 'vue';

const SETTINGS_KEY = 'srx-settings';

const defaultSettings = {
    fontFamily: 'JetBrains Mono',
    fontSize: 14,
    lineHeight: 1.5,
    wordWrap: true
};

export function useSettings() {
    const settings = reactive({ ...defaultSettings });

    onMounted(() => {
        const saved = localStorage.getItem(SETTINGS_KEY);
        if (saved) {
            try {
                Object.assign(settings, JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load settings', e);
            }
        }
    });

    watch(settings, (newVal) => {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(newVal));
    });

    return { settings };
}
```

## File: vite.config.js
```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  // ★ここを追加★
  server: {
    watch: {
      usePolling: true, // ポーリングモードを有効化
    }
  }
})
```

## File: package.json
```json
{
  "name": "srx-fusion-assembler",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@babel/runtime": "^7.28.6",
    "@codemirror/commands": "^6.10.1",
    "@codemirror/language": "^6.12.1",
    "@codemirror/lint": "^6.9.3",
    "@codemirror/state": "^6.5.4",
    "@codemirror/theme-one-dark": "^6.1.3",
    "@codemirror/view": "^6.39.11",
    "@heroicons/vue": "^2.2.0",
    "@lezer/highlight": "^1.2.3",
    "@replit/codemirror-indentation-markers": "^6.5.3",
    "@uiw/codemirror-theme-dracula": "^4.25.4",
    "vue": "^3.5.24",
    "vue-codemirror": "^6.1.1"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.1.18",
    "@vitejs/plugin-vue": "^6.0.1",
    "autoprefixer": "^10.4.23",
    "postcss": "^8.5.6",
    "tailwindcss": "^4.1.18",
    "vite": "^7.2.4"
  }
}

```

