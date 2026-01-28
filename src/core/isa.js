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