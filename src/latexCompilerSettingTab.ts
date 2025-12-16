import LatexCompiler from "src/main";
import { App, PluginSettingTab, Setting } from "obsidian";

export class LatexCompilerSettingTab extends PluginSettingTab {
	plugin: LatexCompiler;

	constructor(app: App, plugin: LatexCompiler) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		// add setting tab for name of project folder
		new Setting(containerEl)
			.setName('Name of projects folder')
			.setDesc('The name of the folder where all projects are stored in.')
			.addText(text => text
				.setPlaceholder('Name of projects folder')
				.setValue(this.plugin.settings.projectsFolder)
				.onChange(async (value) => {
					this.plugin.settings.projectsFolder = value
					await this.plugin.saveSettings()
				}))

		// add setting tab for simple vs. extended compiling
		new Setting(containerEl)
			.setName('Simple or extended compiling?')
			.setDesc('With extended compiling, the compiler follows the extended (latex, bibtex, latex, latex) instead of the simple (latex) compiling procedure. Extended is recommended.')
			.addDropdown(dropDown => {
				dropDown.addOption('simple', 'Simple')
				dropDown.addOption('extended', 'Extended')
				.setValue(this.plugin.settings.compileExtended)
				dropDown.onChange(async (value) =>	{
					this.plugin.settings.compileExtended = value
					await this.plugin.saveSettings()
				})
			})

	}
}
