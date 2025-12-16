import {
	getFrontMatterInfo,
	FileSystemAdapter,
	TFile,
} from 'obsidian';
import type { LatexCompilerSettings } from './main';

/**
 * Encapsulates the meta-data of the output to be compiled:
 * the name of the output file and the list of files to be included.
 */
interface OutputSpecification {
	outputName: string
	outputFiles: string[]
}

/**
 * Extract the latex code from the project files and write to a .tex file to be compiled.
 *
 * @param projectName The name of the project in the format {projectNumber}_{projectName}.
 * @param projectNumber The number of the project.
 * @param settings The plugin settings object (needed for name of the projects folder).
 * @return The name of the output file.
 */
export async function extractLatex(projectName: string, projectNumber: string, settings: LatexCompilerSettings): Promise<string> {
	const mainPath: string = 'compile/'+projectNumber+'_main'
	const outputSpecification: OutputSpecification = await getFilesFromMain(mainPath, projectName, settings)
	const outputName = outputSpecification.outputName
	const outputFiles = outputSpecification.outputFiles
	const filesContents = await readFiles(outputFiles, projectName, settings)
	const latexContent = processLatexFromFiles(filesContents)
	await writeToTexFile(outputName, projectName, latexContent, settings)
	return outputName
}

/**
 * Within the text, assume that you're in a latex block and recursively collect all rows until
 * - the end is reached or
 * - the specifier for the end of a latex block is detected.
 *
 * @param text The entire text of the current .md file, separated by rows.
 * @param pos The current position within the text (i.e., which row).
 * @param res The result text collected so far.
 * @return The final text.
 */
function collectLatex(text: string[], pos: number, res: string): string {
	if (pos < 0 || text.length == 0) {
		throw new Error(`Invalid parameter for collectLatex(): pos = ${pos} , text.length = ${text.length}`)
	}
	if (pos >= text.length-1) {
		return res
	}
	if (text[pos] == "```") {
		return findLatexBlocks(text, pos+1, res)
	}
	return collectLatex(text, pos+1, [res, text[pos]].join("\n"))
}

/**
 * Within the text, assume that you're outside of a latex block and recursively search for the next latex block.
 * Then collect the latex code within the block using collectLatex() and continue.
 *
 * @param text The entire text of the current .md file, separated by rows.
 * @param pos The current position within the text (i.e., which row).
 * @param res The result text collected so far.
 * @return The final text.
 */
function findLatexBlocks(text: string[], pos: number, res: string): string {
	if (pos < 0 || text.length == 0) {
		throw new Error(`Invalid parameter for findLatexBlocks(): pos = ${pos} , text.length = ${text.length}`)
	}
	if (pos >= text.length-1) {
		return res
	}
	if (text[pos] == "```latex") {
		return collectLatex(text, pos+1, res)
	}
	return findLatexBlocks(text, pos+1, res)
}

/**
 * Goes through the content of all .md files, extracts the latex code, and stitches it together.
 *
 * @param filesContents The content of all .md files.
 * @return The latex code.
 */
function processLatexFromFiles(filesContents: string[]): string {
	if (filesContents.length == 0) {
		throw new Error("No file contents to extract Latex from.")
	}
	return filesContents.map(
		content => findLatexBlocks(content.split("\n"), 0, "")
	).join("\n")
}

/**
 * In a given project, loads the content of a given file.
 *
 * @param fileName The name of the .md file in the format {projectNumber}_{fileName}
 * @param projectName The name of the current project in the format {projectNumber}_{projectName}
 * @param settings The plugin settings object (needed for name of the projects folder)
 * @return The loaded content of the file.
 */
function readFile(fileName: string, projectName: string, settings: LatexCompilerSettings): Promise<string> {
	if (fileName == "" || projectName == "") {
		throw new Error("No file name or project name given to read the file.")
	}
	const loadedFile: TFile|null = this.app.vault.getFileByPath(`${settings.projectsFolder}/${projectName}/${fileName}.md`)
	if (loadedFile == null) {
		throw new Error(`The document ${fileName} cannot be found!`)
	}
	return this.app.vault.cachedRead(loadedFile)
}

/**
 * In a given project, loads the content of a set of files.
 *
 * @param fileNames The names of the .md files in the format {projectNumber}_{fileName}
 * @param projectName The name of the current project in the format {projectNumber}_{projectName}
 * @param settings The plugin settings object (needed for name of the projects folder)
 * @return The loaded contents of the files.
 */
function readFiles(filesNames: string[], projectName: string, settings: LatexCompilerSettings): Promise<string[]> {
	if (projectName == "") {
		throw new Error(`No project name given.`)
	}
	if (filesNames.length == 0) {
		throw new Error(`No files to open.`)
	}
	const readFiles: Promise<string>[] = filesNames.map(
		(fileName) => readFile(fileName, projectName, settings)
	)
	return Promise.all(readFiles)
}

/**
 * Read the main file of the project, extract the output name and the files to be included in the latex compiling in the frontmatter.
 *
 * @param mainName The name of the main file.
 * @param projectName The name of the project in the format {projectNumber}_{projectName}.
 * @param settings The plugin settings object (needed for name of the projects folder).
 * @return The output name and the names of the files to be included.
 */
async function getFilesFromMain(mainName: string, projectName: string, settings: LatexCompilerSettings): Promise<OutputSpecification> {
	if (projectName == "") {
		throw new Error(`No project name given.`)
	}
	if (mainName == "" ) {
		throw new Error(`No main name given.`)
	}
	const mainContent = await readFile(mainName, projectName, settings)
	try {
		const frontmatterText: string = getFrontMatterInfo(mainContent).frontmatter
		const outputFiles: string[] = frontmatterText.split('\n')
		// there is always one empty property, so length is 2 if there is one specified output
		if (outputFiles.length > 2) {
			throw new Error()
		}
		const outputProcessing: string[] = outputFiles[0].split(': ')
		const outputSpecification: OutputSpecification = {
			outputName: outputProcessing[0],
			outputFiles: outputProcessing[1].split(', ')
		}
		return outputSpecification
	} catch (error) {
		throw new Error(`Reading the frontmatter of the main document was not possible: "${error}". Note that the plugin can only handle one specified output.`)
	}
}

/**
 * Write the collected latex code to a .tex file.
 *
 * @param outputName Name of the output file.
 * @param projectName The name of the project in the format {projectNumber}_{projectName}.
 * @param latexContent The latex code to be written.
 * @param settings The plugin settings object (needed for name of the projects folder).
 * @return
 */
async function writeToTexFile(outputName: string, projectName: string, latexContent: string, settings: LatexCompilerSettings) {
	if (!(this.app.vault.adapter instanceof FileSystemAdapter)) {
	  	throw new Error(`The plugin does not work on the mobile version (yet). Sorry!`)
	}
	const filePath: string = `${settings.projectsFolder}/${projectName}/compile/`
	const existCheck: boolean = await this.app.vault.adapter.exists(filePath)
	if (!existCheck) {
		await this.app.vault.adapter.mkdir(filePath)
	}
	await this.app.vault.adapter.write(filePath+outputName+".tex", latexContent)
}
