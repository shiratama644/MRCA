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