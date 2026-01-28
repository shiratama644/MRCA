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