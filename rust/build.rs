use std::env;

fn main() {
    if let Ok(z3_lib_path) = env::var("Z3_LIB_PATH") {
        println!(r"cargo:rustc-link-search={}", z3_lib_path);
    }
}
