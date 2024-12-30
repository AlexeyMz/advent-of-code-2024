## Build notes

### Z3

The project depend on [Z3](https://github.com/Z3Prover/z3) in some modules.
See the documentation on how to compile the necessary [z3-sys](https://github.com/prove-rs/z3.rs/tree/master/z3-sys) crate.

Z3 dependencies and dependent sub-modules are only built when `z3` feature is enabled.
The feature can be enabled by passing `--features=z3` to `cargo` when building from CLI, setting `rust-analyzer.cargo.features` to `["z3"]` from VSCode workspace settings to enable language services for these modules.

#### Building on Windows

On Windows, the easiest way is to download a pre-built binaries from [here](https://github.com/z3prover/z3/releases) and provide `Z3_SYS_Z3_HEADER` and `Z3_LIB_PATH` environment variables to the `z3.h` header by putting this options in `%USERPROFILE%\.cargo\config.toml`:
```toml
[env]
Z3_SYS_Z3_HEADER="C:/projects/tools/z3-4.13.3-x64-win/include/z3.h"
Z3_LIB_PATH="C:/projects/tools/z3-4.13.3-x64-win/bin"
```

It is also necessary to install [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022), then download and install the following components through it:
  - C++ build tools
  - CMake C++ Tools for Windows
  - MSBuild support for LLVM (clang-cl)
  - C++ Clang Compiler for Windows

When the C++ build tools are installed, set `LIBCLANG_PATH` environment variable to something like `C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Tools\Llvm\x64\bin` (Clang location can be discovered by opening "x64 Native Tools Command Prompt for VS 2019" and running `which clang`).

Finally, either `<z3-binaries-folder>/bin` folder needs to be added to `PATH` environment variable or
the DLL files (in particular `libz3.dll` and `libz3.pdb`) should be copied to the compiled binary folder.
