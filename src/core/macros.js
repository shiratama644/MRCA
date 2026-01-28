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