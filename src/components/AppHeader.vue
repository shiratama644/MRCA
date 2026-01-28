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