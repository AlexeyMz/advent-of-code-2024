use core::get_data_path;
use std::collections::{HashMap, HashSet};
use regex::Regex;
use std::{env, iter};
use std::error::Error;
use std::fs::{File, read_to_string};
use std::io::{stdout, LineWriter, Write};

fn main() {
    if env::args().nth(1).is_some_and(|arg| arg == "--disassemble") {
        if let Some(program) = env::args().nth(2) {
            match ComputerDescription::parse_program(&program) {
                Ok(parsed) => {
                    if let Err(err) = disassemble(&mut stdout(), &parsed) {
                        eprintln!("Error disassembling the program:\n{}", err);
                    }
                }
                Err(err) => {
                    eprintln!("Error parsing the program:\n{}", err)
                }
            }
        } else {
            eprintln!("Missing program to disassemble");
        }
    } else {
        use std::time::Instant;
        let before = Instant::now();
        // basic();
        advanced();
        println!("Elapsed time: {:.2?}", before.elapsed());
    }
}

fn _basic() {
    let input = read_to_string(get_data_path("input/puzzle17.txt")).unwrap();
    let description = ComputerDescription::parse(&input).unwrap();

    {
        let mut assembly_writer = LineWriter::new(
            File::create(get_data_path("output/puzzle17_program.txt")).unwrap()
        );
        disassemble(&mut assembly_writer, &description.program).unwrap();
    }

    let mut state = ComputerState::new();
    let mut output = Vec::new();
    description.initialize(&mut state);
    description.run(&mut state, |n| output.push(n)).unwrap();

    let joined_output = output.iter().map(|n| n.to_string()).collect::<Vec<String>>().join(",");
    println!("Program output (basic): {}", joined_output);
}

fn advanced() {
    let input = read_to_string(get_data_path("input/puzzle17_test.txt")).unwrap();
    let description = ComputerDescription::parse(&input).unwrap();

    let mut linear_program = description.program.clone();
    linear_program.splice((description.program.len() - 2).., iter::empty());
    let linear = ComputerDescription {
        program: linear_program,
        ..description
    };

    let mut out_to_a: HashMap<u8, HashSet<u64>> = HashMap::new();
    for a_bits in 0..1024 {
        let mut state = ComputerState {
            register_a: a_bits,
            register_b: 0,
            register_c: 0,
            instruction: 0,
        };
        let mut out: u8 = 0;
        linear.run(&mut state, |n| out = n.try_into().unwrap()).unwrap();
        if let Some(a_variants) = out_to_a.get_mut(&out) {
            a_variants.insert(a_bits);
        } else {
            out_to_a.insert(out, [a_bits].into());
        }
    }

    let mut step_variants: Vec<Vec<u64>> = Vec::new();
    for (i, byte) in description.program.iter().enumerate() {
        step_variants.push(out_to_a.get(byte).unwrap());
        for j in 0..4 {

        }
    }

    // for (out, a_variants) in out_to_a.iter() {
    //     println!("out={out} when a={a_variants:?}");
    // }

    println!("Register A for quine (advanced): {}", 0);
}

fn disassemble<W: Write>(writer: &mut W, program: &Vec<u8>) -> Result<(), Box<dyn Error>> {
    let instructions: Vec<_> = ComputerDescription::decode_program(program)?;
    let mut labels: HashSet<usize> = HashSet::new();
    for instruction in instructions.iter() {
        if let Instruction(Opcode::Jnz, Operand::Literal(label)) = instruction {
            labels.insert((*label).into());
        }
    }
    for (i, instruction) in instructions.iter().enumerate() {
        if labels.contains(&i) {
            writeln!(writer, "#{}: {}", i, instruction)?;
        } else {
            writeln!(writer, "    {}", instruction)?;
        }
    }
    return Ok(());
}

struct ComputerDescription {
    register_a: u64,
    register_b: u64,
    register_c: u64,
    program: Vec<u8>,
}

impl ComputerDescription {
    fn parse(content: &str) -> Result<ComputerDescription, String> {
        let re = Regex::new(concat!(
            r"^Register A: (\d+)\r?\n",
            r"Register B: (\d+)\r?\n",
            r"Register C: (\d+)\r?\n",
            r"\r?\n",
            r"Program: ([\d,]+)\r?\n"
        )).unwrap();

        let (_, [register_a, register_b, register_c, program]) = re
            .captures(content)
            .map(|c| c.extract())
            .ok_or(format!("Failed to parse computer: {}", content))?;

        let register_a = register_a.parse().map_err(|_| format!("Failed to parse register A: {}", register_a))?;
        let register_b = register_b.parse().map_err(|_| format!("Failed to parse register B: {}", register_b))?;
        let register_c = register_c.parse().map_err(|_| format!("Failed to parse register C: {}", register_c))?;
        let program = Self::parse_program(program)?;

        return Ok(ComputerDescription { register_a, register_b, register_c, program });
    }

    fn parse_program(program: &str) -> Result<Vec<u8>, String> {
        program.split(",")
            .enumerate()
            .map(|(i, v)| v.parse::<u8>()
                .map_err(|_| format!("Invalid instruction byte #{i}: {v}"))
            )
            .collect()
    }

    fn decode_program(program: &Vec<u8>) -> Result<Vec<Instruction>, String> {
        let chunks = program.chunks_exact(2);
        let decoded = chunks
            .clone()
            .enumerate()
            .map(|(i, pair)| Instruction::decode(pair[0], pair[1])
                .ok_or(format!("Invalid instruction #{i}: {},{}", pair[0], pair[1]))
            )
            .collect();
        if chunks.remainder().len() > 0 {
            return Err(format!("Unexpected trailing program bytes"));
        }
        return decoded;
    }

    fn initialize(&self, state: &mut ComputerState) {
        state.register_a = self.register_a;
        state.register_b = self.register_b;
        state.register_c = self.register_c;
        state.instruction = 0;
    }

    fn run(&self, state: &mut ComputerState, mut handle_output: impl FnMut(u64) -> ()) -> Result<(), String> {
        while state.instruction < self.program.len() {
            let index: usize = state.instruction;
            let raw_code = self.program[index];
            let raw_operand = self.program[index + 1];
            let Instruction(opcode, operand) = Instruction::decode(raw_code, raw_operand)
                .ok_or(format!("Invalid instruction #{index}: {raw_code},{raw_operand}"))?;
            match opcode {
                Opcode::Adv => {
                    state.register_a >>= state.read(&operand)?;
                }
                Opcode::Bxl => {
                    state.register_b ^= state.read(&operand)?;
                }
                Opcode::Bst => {
                    state.register_b = state.read(&operand)? % 8;
                }
                Opcode::Jnz => {
                    if state.register_a != 0 {
                        state.instruction = state.read(&operand)?
                            .try_into()
                            .map_err(|_| "Cannot convert value to pointer")?;
                        continue;
                    }
                }
                Opcode::Bxc => {
                    state.register_b ^= state.register_c;
                }
                Opcode::Out => {
                    handle_output(state.read(&operand)? % 8);
                }
                Opcode::Bdv => {
                    state.register_b = state.register_a >> state.read(&operand)?;
                }
                Opcode::Cdv => {
                    state.register_c = state.register_a >> state.read(&operand)?;
                }
            }
            state.instruction += 2;
        }
        return Ok(());
    }
}

struct ComputerState {
    register_a: u64,
    register_b: u64,
    register_c: u64,
    instruction: usize,
}

impl ComputerState {
    fn new() -> ComputerState {
        ComputerState {
            register_a: 0,
            register_b: 0,
            register_c: 0,
            instruction: 0,
        }
    }

    fn read(&self, operand: &Operand) -> Result<u64, String> {
        match operand {
            Operand::Literal(value) => Ok((*value).into()),
            Operand::Register(Register::A) => Ok(self.register_a),
            Operand::Register(Register::B) => Ok(self.register_b),
            Operand::Register(Register::C) => Ok(self.register_c),
            Operand::Unused(value) => Err(format!("Cannot read unsed operand with value {value}"))
        }
    }
}

struct Instruction(Opcode, Operand);

enum Opcode {
    Adv = 0,
    Bxl = 1,
    Bst = 2,
    Jnz = 3,
    Bxc = 4,
    Out = 5,
    Bdv = 6,
    Cdv = 7,
}

enum Operand {
    Literal(u8),
    Register(Register),
    Unused(u8),
}

enum Register { A, B, C }

impl Instruction {
    fn decode(opcode: u8, operand: u8) -> Option<Instruction> {
        match opcode {
            0 => Some(Instruction(Opcode::Adv, Self::decode_combo(operand))),
            1 => Some(Instruction(Opcode::Bxl, Self::decode_literal(operand))),
            2 => Some(Instruction(Opcode::Bst, Self::decode_combo(operand))),
            3 => Some(Instruction(Opcode::Jnz, Self::decode_literal(operand))),
            4 => Some(Instruction(Opcode::Bxc, Self::decode_literal(operand))),
            5 => Some(Instruction(Opcode::Out, Self::decode_combo(operand))),
            6 => Some(Instruction(Opcode::Bdv, Self::decode_combo(operand))),
            7 => Some(Instruction(Opcode::Cdv, Self::decode_combo(operand))),
            _ => None,
        }
    }

    fn decode_literal(operand: u8) -> Operand {
        Operand::Literal(operand)
    }

    fn decode_combo(operand: u8) -> Operand {
        match operand {
            0..=3 => Operand::Literal(operand),
            4 => Operand::Register(Register::A),
            5 => Operand::Register(Register::B),
            6 => Operand::Register(Register::C),
            _ => Operand::Unused(operand),
        }
    }
}

impl std::fmt::Display for Instruction {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self.0 {
            Opcode::Adv => {
                write!(f, "adv A >> {} -> A", self.1)
            }
            Opcode::Bxl => {
                write!(f, "bxl B ^ {} -> B", self.1)
            }
            Opcode::Bst => {
                write!(f, "bst {} % 8 -> B", self.1)
            }
            Opcode::Jnz => {
                write!(f, "jnz if A goto #{}", self.1)
            }
            Opcode::Bxc => {
                write!(f, "bxc B ^ C -> B : {}", self.1)
            }
            Opcode::Out => {
                write!(f, "out {} % 8", self.1)
            }
            Opcode::Bdv => {
                write!(f, "bdv A >> {} -> B", self.1)
            }
            Opcode::Cdv => {
                write!(f, "cdv A >> {} -> C", self.1)
            }
        }
    }
}

impl std::fmt::Display for Operand {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Operand::Literal(value) => write!(f, "{value}"),
            Operand::Register(register) => {
                let register = match register {
                    Register::A => "A",
                    Register::B => "B",
                    Register::C => "C",
                };
                write!(f, "{register}")
            },
            Operand::Unused(value) => write!(f, "unused({value})")
        }
    }
}
