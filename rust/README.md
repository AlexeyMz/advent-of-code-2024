## Build notes

### Z3

The project depend on [Z3](https://github.com/Z3Prover/z3) in some modules.
See the documentation on how to compile the necessary [z3-sys](https://github.com/prove-rs/z3.rs/tree/master/z3-sys) crate.

On Windows, the easiest way is to download a pre-built binaries from [here]() and provide `Z3_SYS_Z3_HEADER`
environment variable to the `z3.h` header by putting this options in `%USERPROFILE%\.cargo\config.toml`:
```toml
[env]
Z3_SYS_Z3_HEADER="C:/projects/tools/z3-4.13.3-x64-win/include/z3.h"
```

Additionally, either `<z3-binaries-folder>/bin` folder needs to be added to `PATH` environment variable or
the DLL files (in particular `libz3.dll` and `libz3.pdb`) should be copied to the compiled binary folder.
