import {
	App,
	TFolder,
	TFile,
	TAbstractFile
} from 'obsidian';
import type { LatexCompilerSettings } from './main';

/**
 * Given the currently selected file, determine the corresponding project number and project name.
 *
 * @param settings The plugin settings object (needed for name of the projects folder).
 * @return The project number and the project name.
 */
export function getProjectNameAndNumber(settings: LatexCompilerSettings, app: App): string[] {
	const projectNumber: string = getProjectNumberFromCurrentFile(app)
	const projectName: string = getProjectNameFromProjectNumber(projectNumber, settings, app.vault)
	return [projectNumber, projectName]
}

/**
 * Extract the project number from the title of the currently selected .md file.
 *
 * @return The project number as text.
 */
function getProjectNumberFromCurrentFile(app: App): string {
	const currentNote: TFile | null = app.workspace.getActiveFile()
	if(!currentNote) {
		throw new Error("No file currently opened.")
	}
	try{
		const nameParts: string[] = currentNote.basename.split('_')
		return nameParts[0]
	} catch (error) {
		throw new Error("Extracting the project number from current file was not possible:" + error)
	}
}

/**
 * Given a project number, search for the corresponding project name.
 *
 * @param projectNumber The number of the project.
 * @param settings The plugin settings object (needed for name of the projects folder).
 * @return
 */
function getProjectNameFromProjectNumber(projectNumber: string, settings: LatexCompilerSettings, vault: App['vault']): string {
	if (projectNumber == "") {
		throw new Error(`No project number given.`)
	}

	const projectsFolder: TFolder = getProjectsFolder(settings.projectsFolder, vault)

	const projects: TAbstractFile[] = getProjectsInFolder(projectsFolder)

	const matchingProjects: TAbstractFile[] = projects.filter(project => project.name.startsWith(projectNumber+"_"))

	const matchingProjectName: string = getMatchingProjectName(matchingProjects, projectNumber)

	return matchingProjectName
}

/**
 * Get the projects folder as a TFolder.
 */
function getProjectsFolder(folderPath: string, vault: App['vault']): TFolder {
    const folder = vault.getAbstractFileByPath(folderPath);
    if (!folder) {
        throw new Error("Cannot find the projects folder.");
    }
    if (!(folder instanceof TFolder)) {
        throw new Error("The projects folder is not a folder.");
    }
    return folder;
}

/**
 * Get all projects (children) in the given folder.
 */
function getProjectsInFolder(folder: TFolder): TAbstractFile[] {
    if (folder.children.length === 0) {
        throw new Error("There are no projects in the projects folder.");
    }
    return folder.children;
}

/**
 * Get the project name from the list of matching projects.
 * If there are no or multiple matching projects, throw an error.
 */
function getMatchingProjectName(projects: TAbstractFile[], projectNumber: string): string {
	const matchingProjects = projects.filter(project => project.name.startsWith(projectNumber + "_"))
	if (matchingProjects.length == 0) {
		throw new Error(`The project folder for the project with the number ${projectNumber} cannot be found.`)
	}
	if (matchingProjects.length > 1) {
		throw new Error(`There are multiple project folders for the project with the number ${projectNumber}.`)
	}
	return matchingProjects[0].name
}
