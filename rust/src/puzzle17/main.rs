use core::get_data_path;
use regex::Regex;
use std::fs::read_to_string;

fn main() {
    use std::time::Instant;
    let before = Instant::now();
    basic();
    println!("Elapsed time: {:.2?}", before.elapsed());
}

fn basic() {
    let input = read_to_string(get_data_path("input/puzzle17_test.txt")).unwrap();
    let description = ComputerDescription::parse(&input).unwrap();

    let mut state = ComputerState::new();
    let mut output = Vec::new();
    description.run(&mut state, |n| output.push(n));

    let joined_output = output.iter().map(|n| n.to_string()).collect::<Vec<String>>().join(",");
    println!("Program output (basic): {}", joined_output);
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
        let program = program.split(",").flat_map(|v| v.parse::<u8>()).collect();

        return Ok(ComputerDescription { register_a, register_b, register_c, program });
    }

    fn run(&self, state: &mut ComputerState, mut handle_output: impl FnMut(u64) -> ()) {
        state.register_a = self.register_a;
        state.register_b = self.register_b;
        state.register_c = self.register_c;
        state.instruction = 0;

        while state.instruction < self.program.len() {
            let index: usize = state.instruction;
            let opcode_value = self.program[index];
            let opcode: Opcode = opcode_value.try_into()
                .expect(&format!("Unexpected opcode #{index} value: {opcode_value}"));
            let operand = self.program[index + 1];
            match opcode {
                Opcode::Adv => {
                    state.register_a >>= combo_operand(operand, state);
                }
                Opcode::Bxl => {
                    state.register_b ^= literal_operand(operand);
                }
                Opcode::Bst => {
                    state.register_b = combo_operand(operand, state) % 8;
                }
                Opcode::Jnz => {
                    if state.register_a != 0 {
                        state.instruction = literal_operand(operand).try_into().unwrap();
                        continue;
                    }
                }
                Opcode::Bxc => {
                    state.register_b ^= state.register_c;
                }
                Opcode::Out => {
                    handle_output(combo_operand(operand, state));
                }
                Opcode::Bdv => {
                    state.register_b = state.register_a >> combo_operand(operand, state);
                }
                Opcode::Cdv => {
                    state.register_c = state.register_a >> combo_operand(operand, state);
                }
            }
            state.instruction += 2;
        }
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
}

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

impl TryFrom<u8> for Opcode {
    type Error = ();

    fn try_from(value: u8) -> Result<Self, Self::Error> {
        match value {
            0 => Ok(Opcode::Adv),
            1 => Ok(Opcode::Bxl),
            2 => Ok(Opcode::Bst),
            3 => Ok(Opcode::Jnz),
            4 => Ok(Opcode::Bxc),
            5 => Ok(Opcode::Out),
            6 => Ok(Opcode::Bdv),
            7 => Ok(Opcode::Cdv),
            _ => Err(()),
        }
    }
}

fn literal_operand(value: u8) -> u64 {
    return value.into();
}

fn combo_operand(value: u8, state: &ComputerState) -> u64 {
    match value {
        0..=3 => value.into(),
        4 => state.register_a,
        5 => state.register_b,
        6 => state.register_c,
        _ => panic!("Unexpected combo operand {value}")
    }
}
