import {
	Notice,
	Plugin,
} from 'obsidian';
import { extractLatex } from 'src/latexExtraction';
import { getProjectNameAndNumber } from 'src/projectIdentification';
import { compileLatex } from 'src/latexCompiling';
import { LatexCompilerSettingTab}  from 'src/latexCompilerSettingTab';

export interface LatexCompilerSettings {
	projectsFolder: string,
	compileExtended: string
}

const DEFAULT_SETTINGS: LatexCompilerSettings = {
	projectsFolder: 'Projects',
	compileExtended: 'extended'
}

export default class LatexCompiler extends Plugin {
	settings: LatexCompilerSettings

	async onload() {
		await this.loadSettings()

		this.addCommand({
			id: 'latex-compile',
			name: 'Compile this project',
			callback: () => runCompiler(this.settings)
		})

		this.addSettingTab(new LatexCompilerSettingTab(this.app, this))

	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

/**
 * Main function that manages the workflow:
 * - extracting the project name and number
 * - extracting the latex code and saving it as a .tex file
 * - compiling this .tex file
 *
 * @param settings The plugin settings object.
 */
async function runCompiler(settings: LatexCompilerSettings) {
	try {
		const [projectNumber, projectName] = await getProjectNameAndNumber(settings, this.app)
		const outputName: string = await extractLatex(projectName, projectNumber, settings)
		await compileLatex(outputName, projectName, settings)
	}
	catch (error) {
		new Notice(error)
	}
}
