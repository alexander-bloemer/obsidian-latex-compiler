import {
	App,
	FileSystemAdapter,
	Notice,
	setIcon,
} from 'obsidian';
import { exec }  from 'child_process';
import type { LatexCompilerSettings } from './main';

/**
 * Compile the extracted latex document of the current project.
 *
 * @param outputName The name of the output file ({outputName}.tex).
 * @param projectName The name of the project in the format {projectNumber}_{projectName}.
 * @param settings The plugin settings object (needed for name of the projects folder).
 */
export async function compileLatex(outputName: string, projectName: string, settings: LatexCompilerSettings) {
	const vaultPath: string|null = getVaultPath()
	if (vaultPath == null) {
		throw new Error('The plugin does not work on the mobile version (yet). Sorry!')
	}
	const pluginPath = `${vaultPath}/.obsidian/plugins/obsidian-latex`
	const compilePath = `${vaultPath}/${settings.projectsFolder}/${projectName}/compile`

	const cd = `cd ${compilePath}`
	const cmdLatex = `pdflatex.exe -synctex=1 -interaction=nonstopmode ${outputName}.tex`
	const cmdBibtex = `bibtex ${outputName}`
	const cmdSimple = cmdLatex
	const cmdExtended = cmdLatex + " & " + cmdBibtex + " & " + cmdLatex + " & " + cmdLatex
	const cmdCompile = (settings.compileExtended == 'extended') ? cmdExtended : cmdSimple
	const cmdPDF = `start ${outputName}.pdf`

	const command = cd + " & " + cmdCompile + " & " + cmdPDF

	const childProcess = await exec(command, (error, stdout, stderr) => {
		if (error) {
			new Notice(`There was an error when executing the system command.`)
			return
		}
		//TODO: log the output
	})

	// kill the process if the terminating button is pressed
	const processTerminator = () => {
		childProcess.kill("SIGTERM")
		new Notice("Compiling manually interrupted!")
	}
	const processNotification = new Notice(`Compiling project ${projectName}`, 0)
	createRequestTerminatingButton(processNotification, processTerminator)

	childProcess.on("exit", () => {
		processNotification.hide()
	})
}

/**
 * Get the absolute path of the vault in the "/"-format.
 *
 * @return The vault path if it can be found (desktop version), null else.
 */
function getVaultPath(): string|null {
	if (this.app.vault.adapter instanceof FileSystemAdapter) {
		return this.app.vault.adapter.getBasePath().replaceAll("\\", "/")
	}
	return null;
}

/**
 * Given the notice shown during compiling, create a small button to terminate the compile process.
 * This function is taken from https://github.com/Taitava/obsidian-shellcommands/blob/main/src/ShellCommandExecutor.ts
 * Thanks!
 *
 * @param notice The notice that signals ongoing compiling.
 * @param processTerminator The callback function to kill the process.
 * @return
 */
function createRequestTerminatingButton(notice: Notice, processTerminator: any) {
	// @ts-ignore Notice.noticeEl belongs to Obsidian's PRIVATE API, and it may change without a prior notice. Only
	// create the button if noticeEl exists and is an HTMLElement.
	const noticeEl = notice.noticeEl;
	if (undefined !== noticeEl && noticeEl instanceof HTMLElement) {
		const button = noticeEl.createEl('a', {
			prepend: true,
				attr: {
					"aria-label": "Request to terminate the compiling process",
					class: "SC-icon-terminate-process",
				},
			})
			setIcon(button, "power")
			button.onclick = (event) => {
				processTerminator()
				event.preventDefault()
				event.stopPropagation()
		}
	}
}
