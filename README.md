# LaTeX Compiler

This Obsidian plugin allows you to compile LaTeX code directly within Obsidian (from LaTeX code blocks within `.md` files).
It bridges the gap between note-taking and (academic) wiriting by keeping everything in one place.

## Example

In a regular markdown file, you can think through concepts, reference [[other notes]], develop some math ideas ($a+b=c$), ... 

```latex
Only text within the latex codeblock will be exported to the .pdf document using LaTeX.
This means I can use LaTeX commands such as \cite{} and separate thinking from writing while having everything in one place.
```

## How to Use

For the plugin to work, you need to have **LaTeX** and **BibTeX** installed on your Windows device.
- Mobile is not supported.
- macOS support is planned.
- Biber support is also planned.

The plugin requires a specific folder setup: 
- Create a top-level folder in your vault named `Projects`.
- Inside `Projects`, create one subfolder for each project using the naming convention `[project number]_[project name]`, for example:
- 01_YourFirstProject
- 02_YourSecondProject
Within each project folder, you can structure your project however you like **but** you must include a `compile` subfolder containing a `[project number]_main.md` file.
This file defines the output name and lists (comma-separated) the `.md` files with LaTeX code to be compiled, in the correct order.
A `[project number]_preface.md` file can also be included to hold all LaTeX content up to `\begin{document}`.

## Settings

In the plugin settings, you can 
- Change the name of the `Projects` folder.
- Choose between two compilation modes:
    - **Simple**: runs `pdflatex.exe` once.
    - **Advanced**: `pdflatex.exe → bibtex → pdflatex.exe → pdflatex.exe`.

## Contribute
Contributions are welcome!
Feel free to reach out if you would like to contribute; suggestions and feedback are always appreciated.

## Credits
I used the button functionality from https://github.com/Taitava/obsidian-shellcommands/