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