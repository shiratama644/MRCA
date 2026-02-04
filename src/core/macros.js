/**
 * Macro Definitions (Syntactic Sugar Logic)
 */

export const MACRO_OPS = {
  // MOV Dest, Src -> LIM R0, 0 + ADD Dest, Src, ADD, R0
  MOV: (args) => {
    if (args.length !== 2) throw new Error("MOV requires 2 args: Dest, Src");
    const [dest, src] = args;
    return [`LIM R0, 0`, `ADD ${dest}, ${src}, ADD, R0`];
  },

  // CLR Reg -> LIM Reg, 0
  CLR: (args) => {
    if (args.length !== 1) throw new Error("CLR requires 1 arg: Reg");
    return [`LIM ${args[0]}, 0`];
  },

  // INC Reg -> LIM R0, 1 + ADD Reg, Reg, ADD, R0
  INC: (args) => {
    if (args.length !== 1) throw new Error("INC requires 1 arg: Reg");
    const reg = args[0];
    return [`LIM R0, 1`, `ADD ${reg}, ${reg}, ADD, R0`];
  },

  // DEC Reg -> LIM R0, 1 + SUB Reg, Reg, SUB, R0
  DEC: (args) => {
    if (args.length !== 1) throw new Error("DEC requires 1 arg: Reg");
    const reg = args[0];
    return [`LIM R0, 1`, `SUB ${reg}, ${reg}, SUB, R0`];
  },

  // NOT Reg -> BIT Reg, Reg, NOR, Reg
  NOT: (args) => {
    if (args.length !== 1) throw new Error("NOT requires 1 arg: Reg");
    const reg = args[0];
    return [`BIT ${reg}, ${reg}, NOR, ${reg}`];
  },

  // PSH.x r1, r2, ... -> PSH r1, PSH r2, ...
  PSH: (args) => {
    if (args.length === 0)
      throw new Error("PSH.x requires at least one register");
    const first = args[0];
    const match = first.match(/^\.?(\d+)$/);
    let count = 1;
    let regs = args;
    if (match) {
      count = parseInt(match[1], 10);
      regs = args.slice(1);
    }
    if (count !== regs.length)
      throw new Error(`PSH.${count} requires exactly ${count} registers`);
    if (count > 16)
      throw new Error("Stack overflow: PSH.x supports up to 16 registers");
    return regs.map((reg) => `PSH ${reg}`);
  },

  // POP.x r1, r2, ... -> POP rN, ..., POP r1（逆順）
  POP: (args) => {
    if (args.length === 0)
      throw new Error("POP.x requires at least one register");
    const first = args[0];
    const match = first.match(/^\.?(\d+)$/);
    let count = 1;
    let regs = args;
    if (match) {
      count = parseInt(match[1], 10);
      regs = args.slice(1);
    }
    if (count !== regs.length)
      throw new Error(`POP.${count} requires exactly ${count} registers`);
    if (count > 16)
      throw new Error("Stack overflow: POP.x supports up to 16 registers");
    return regs
      .slice()
      .reverse()
      .map((reg) => `POP ${reg}`);
  },
};
