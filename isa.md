## 1. Architecture Overview
*   **Instruction Width:** 24 bits (Fixed length)
*   **Data Width:** 8 bits (Octet)
*   **Memory:** 256 Bytes (Address range: `0x00` - `0xFF`)
*   **ROM:** 256 Word (768 Byte)
*   **Registers:** 16 General Purpose Registers (GPR `R0` - `R15` (R0: `Zero Register`(Writes to R0 are ignored)))
*   **I/O Ports:** 16 / 16 Ports (Address range: `0x0` - `0xF`)
*   **Stacks(If these overflow, the CPU is stopped immediately (HLT)):**
    *   **CallStack:** 16-depth (Hardware managed, PC storage)
    *   **GpStack:** 16-depth (Hardware managed, Data storage)

## 2. Operand & Definitions

### Data Types
*   **Imm (Immediate):** Unsigned 8-bit data.
*   **S-Offset (Signed Offset):** Signed 8-bit data (`-128` to `+127`).
*   **Addr (Address):** Unsigned 8-bit ROM address
*   **Reg (Register):** 4-bit Register Index (`0` to `15`).
*   **BitField:**
  　  ```
     [23:21] Reserved (0)
     [20:16] Opcode (5bits)
     [15:00] Operands
     ```

### Condition Codes (Cond) - 4 bits
|     Value     | Mnemonic | Description                     |
| :-----------: | :------- | :------------------------------ |
|    `0000`     | **AL**   | Always                          |
|    `0001`     | **Z**    | Zero flag is set                |
|    `0010`     | **C**    | Carry flag is set               |
|    `0011`     | **N**    | Negative flag (MSB is 1) is set |
| `0100`~`1111` | -        | *Reserved (Undefined)*          |

---

## 3. Instruction Set Details

### 3.1 System & Control Flow

#### `NOP`
*   **No Operation**
*   **Opcode:** 0
*   **Update Flags ?:** No
*   **PseudoCode:** `No-operation`
*   **BitField:**
```
[20:16] Opcode (00000)
[15:00] Reserved (0)
```

#### `HLT`
*   **Halt CPU**
*   **Opcode:** 1
*   **Update Flags ?:** No
*   **PseudoCode:** `Halt CPU`
*   **BitField:**
```
[20:16] Opcode (00001)
[15:00] Reserved (0)
```

#### `SSS`
*   **Set System Settings**
*   **Opcode:** 2
*   **Update Flags ?:** No
*   **Operands:** `Settings`, `Imm`
*   **PseudoCode:** `Settings <- Imm`
*   **Settings:**
```
0000: Undefined
0001: Force flags to not update
    ; Enable if Imm LSB=1
    
0010: Clear memory-cache
    ; Trigger if Imm LSB=1
    
0011 ~ 1111: Undefined
```
*   **BitField:**
```
[20:16] Opcode (00010)
[15:12] Settings
[11:08] Reserved (0)
[07:00] Imm
```

#### `JMP`
*   **Jump Unconditional**
*   **Opcode:** 3
*   **Update Flags ?:** No
*   **Operands:** `Addr`
*   **PseudoCode:** `PC <- Addr`
*   **BitField:**
```
[20:16] Opcode (00011)
[15:08] Reserved (0)
[07:00] Addr
```

#### `BRT`
*   **Branch True**
*   **Opcode:** 4
*   **Update Flags ?:** No
*   **Operands:** `Cond`, `Addr`
*   **PseudoCode:** `PC <- EvalCond(Cond, FLAGS) ? Addr : PC + 1`
*   **Cond:**
```
0000: AL (Always)
0001: Z  (Zero)
0010: C  (Carry)
0011: N  (Negative)
```
*   **BitField:**
```
[20:16] Opcode (00100)
[15:12] Cond
[11:08] Reserved (0)
[07:00] Addr
```

#### `BRF`
*   **Branch False**
*   **Opcode:** 5
*   **Update Flags ?:** No
*   **Operands:** `Cond`, `Addr`
*   **PseudoCode:** `PC <- !(EvalCond(Cond, FLAGS)) ? Addr : PC + 1`
*   **Cond:**
```
0000: AL (Always)
0001: Z  (Zero)
0010: C  (Carry)
0011: N  (Negative)
```
*   **BitField:**
```
[20:16] Opcode (00101)
[15:12] Cond
[11:08] Reserved (0)
[07:00] Addr
```

#### `CAL`
*   **Call Subroutine**
*   **Opcode:** 6
*   **Update Flags ?:** No
*   **Operands:** `Addr`
*   **PseudoCode:** `PC <- Addr (and Push(CallStack, PC + 1))`
*   **BitField:**
```
[20:16] Opcode (00110)
[15:08] Reserved (0)
[07:00] Addr
```

#### `RET`
*   **Return from Subroutine**
*   **Opcode:** 7
*   **Update Flags ?:** No
*   **PseudoCode:** `PC <- Pop(CallStack)`
*   **BitField:**
```
[20:16] Opcode (00111)
[15:00] Reserved (0)
```

---

### 3.2 Data Transfer & Stack

#### `LIM`
*   **Load Immediate**
*   **Opcode:** 8
*   **Update Flags ?:** No
*   **Operands:** `Dest`, `Imm`
*   **PseudoCode:** `(Dest == R0 ? ImmLatch : Dest) <- Imm` 
*   **BitField:**
```
[20:16] Opcode (01000)
[15:12] Dest
[11:08] Reserved (0)
[07:00] Imm
```
*   **Description:**
```
If Dest is not R0, Imm is written directly to Dest.

If Dest is R0, Imm is stored in an internal immediate latch instead of
being written to a register.

The latched immediate is valid only for the immediately following
instruction. If the next instruction is MST, PST, ADD, SUB, or BIT, the value in
the immediate latch replaces SrcB of that instruction, regardless of the
SrcB field encoded in the instruction.

If the next instruction is not MST, PST, ADD, SUB, or BIT, or after the latched immediate is consumed, the immediate latch is cleared and not used.
```

#### `LCO`
*   **Load Conditional**
*   **Opcode:** 9
*   **Update Flags ?:** No
*   **Operands:** `Cond`, `Dest`, `Imm`
*   **PseudoCode:** `(EvalCond(Cond, FLAGS) ? (Dest == R0 ? ImmLatch : Dest) : NoWrite) <- Imm`
*   **Cond:**
```
0000: AL (Always)
0001: Z  (Zero)
0010: C  (Carry)
0011: N  (Negative)
```
*   **BitField:**
```
[20:16] Opcode (01001)
[15:12] Cond
[11:08] Dest
[07:00] Imm
```
*   **Description:**
```
LCO conditionally loads an immediate value based on the specified condition.

If the condition evaluates to true, the immediate value Imm is handled in the same manner as LIM: Imm is written to Dest if Dest is not R0, or stored in the internal immediate latch if Dest is R0.

If the immediate latch is written, the latched value is valid only for the immediately following instruction. If that instruction is MST, PST, ADD, SUB, or BIT, the latched immediate replaces SrcB regardless of the encoded SrcB operand.

If the condition evaluates to false, or if the following instruction is not MST, PST, ADD, SUB, or BIT, no write is performed and the immediate latch is cleared.
```
#### `MST`
*   **Memory Store**
*   **Opcode:** 10
*   **Update Flags ?:** No
*   **Operands:** `SrcA` (Base), `SrcB` (Data), `S-Offset`
*   **PseudoCode:** `Mem[(SrcA + S-Offset) & 0xFF] <- SrcB`
*   **BitField:**
```
[20:16] Opcode (01010)
[15:12] SrcB
[11:08] SrcA
[07:00] S-Offset
```

#### `MLD`
*   **Memory Load**
*   **Opcode:** 11
*   **Update Flags ?:** No
*   **Operands:** `Dest`, `SrcA` (Base), `S-Offset`
*   **PseudoCode:** `Dest <- Mem[(SrcA + S-Offset) & 0xFF]`
*   **BitField:**
```
[20:16] Opcode (01011)
[15:12] Dest
[11:08] SrcA
[07:00] S-Offset
```

#### `PST`
*   **Port Store**
*   **Opcode:** 12
*   **Update Flags ?:** No
*   **Operands:** `SrcA` (Base), `SrcB` (Data), `S-Offset`
*   **PseudoCode:** `Port[(SrcA + S-Offset) & 0x0F] <- SrcB`
*   **BitField:**
```
[20:16] Opcode (01100)
[15:12] SrcB
[11:08] SrcA
[07:00] S-Offset
```

#### `PLD`
*   **Port Load**
*   **Opcode:** 13
*   **Update Flags ?:** No
*   **Operands:** `Dest`, `SrcA` (Base), `S-Offset`
*   **PseudoCode:** `Dest <- Port[(SrcA + S-Offset) & 0x0F]`
*   **BitField:**
```
[20:16] Opcode (01101)
[15:12] Dest
[11:08] SrcA
[07:00] S-Offset
```

#### `PSH`
*   **Push to GpStack**
*   **Opcode:** 14
*   **Update Flags ?:** No
*   **Operands:** `SrcA`
*   **PseudoCode:** `Push SrcA to GpStack`
*   **BitField:**
```
[20:16] Opcode (01110)
[15:12] Reserved (0)
[11:08] SrcA
[07:00] Reserved (0)
```

#### `POP`
*   **Pop from GpStack**
*   **Opcode:** 15
*   **Update Flags ?:** No
*   **Operands:** `Dest`
*   **PseudoCode:** `Dest <- Top of GpStack`
*   **BitField:**
```
[20:16] Opcode (01111)
[15:12] Dest
[11:00] Reserved (0)
```

---

### 3.3 Arithmetic & Logic (ALU)

#### `ADD`
*   **Add Registers**
*   **Opcode:** 16
*   **Update Flags ?:** Yes
*   **Operands:** `Dest`, `SrcA`, `Type`, `SrcB`
*   **PseudoCode:** `Dest <- Add(SrcA, SrcB, Type)`
*   **Type:**
```
0000: ADD (Regular Addition)
    ; Dest <- SrcA + SrcB
    
0001: CARRY (Use previous carry)
    ; Dest <- SrcA + SrcB + Carry
    
0010: WRAP (Wrap-around Addition)
    ; Dest <- 0xFF & (SrcA + SrcB)
    ; FLAGS.C <- 0
    
0011: BOTH (BORROW, VEC)
    ; Dest <- 0xFF & (SrcA + SrcB + Carry)
    ; FLAGS.C <- 0
    
0100 ~ 1111: Undefined
```
*   **BitField:**
```
[20:16] Opcode (10000)
[15:12] Dest
[11:08] SrcA
[07:04] Type
[03:00] SrcB
```

#### `SUB`
*   **Subtract Registers**
*   **Opcode:** 17
*   **Update Flags ?:** Yes
*   **Operands:** `Dest`, `SrcA`, `Type`, `SrcB`
*   **PseudoCode:** `Dest <- Sub(SrcA, SrcB, Type)`
*   **Type:**
```
0000: SUB (Regular Subtraction)
    ; Dest <- SrcA - SrcB
    
0001: BORROW (Use previous carry)
    ; Dest <- SrcA - SrcB - !Carry
    
0010: WRAP (Wrap-around Subtraction)
    ; Dest <- 0xFF & (SrcA - SrcB)
    ; FLAGS.C <- 0
    
0011: BOTH (BORROW, VEC)
    ; Dest <- 0xFF & (SrcA - SrcB - !Carry)
    ; FLAGS.C <- 0
    
0100 ~ 1111: Undefined
```
*   **BitField:**
```
[20:16] Opcode (10001)
[15:12] Dest
[11:08] SrcA
[07:04] Type
[03:00] SrcB
```

#### `BIT`
*   **Logical Bitwise Operations**
*   **Opcode:** 18
*   **Update Flags ?:** Yes
*   **Operands:** `Dest`, `SrcA`, `Type`, `SrcB`
*   **PseudoCode:** `Dest <- BitWise(SrcA, SrcB, Type)`
*   **Type:**
```
0000: XOR
    ; Dest <- SrcA ^ SrcB
    
0001: AND
    ; Dest <- SrcA & SrcB
    
0010: OR
    ; Dest <- SrcA | SrcB
    
0011: NOR
    ; Dest <- !(SrcA | SrcB)
    
0100 ~ 1111: Undefined
```
*   **BitField:**
```
[20:16] Opcode (10010)
[15:12] Dest
[11:08] SrcA
[07:04] Type
[03:00] SrcB
```

#### `SHF`
*   **Logical Shift / Rotate**
*   **Opcode:** 19
*   **Update Flags ?:** Yes
*   **Operands:** `Dest`, `SrcA(data)`, `Type`, `Imm3`
*   **PseudoCode:** `Dest <- Shift(SrcA, Imm3)`
*   **Type:**
```
0000: LSH (Left Shift)
    ; Dest <- SrcA << Imm3
    
0001: RSH (Right Shift)
    ; Dest <- SrcA >> Imm3
    
0010: LRO (Left Rotate)
    ; Dest <- Rotate(SrcA << Imm3)
    
0011: RRO (Right Rotate)
    ; Dest <- Rotate(SrcA >> Imm3)
    
0100 ~ 1111: Undefined
```
*   **BitField:**
```
[20:16] Opcode (10011)
[15:12] Dest
[11:08] SrcA
[07:04] Type
[03:03] Reserved (0)
[02:00] Imm3
```

#### `PCT`
*   **PopCount**
*   **Opcode:** 20
*   **Update Flags ?:** No
*   **Operands:** `Dest`, `SrcA`
*   **PseudoCode:** `Dest <- PopCount(SrcA)`
*   **BitField:**
```
[20:16] Opcode (10100)
[15:12] Dest
[11:08] SrcA
[07:00] Reserved (0)
```

#### `UDI`
*   **Undefined Instruction**
*   **Opcode:** 21 ~ 31
*   **Update Flags ?:** No
*   **PseudoCode:** `No operation (Behaves as NOP)`
*   **BitField:**
```
[20:16] Opcode (10101 - 11111)
[15:00] Ignored
```
