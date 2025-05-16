//evals.ts

import { EvalConfig } from 'mcp-evals';
import { openai } from "@ai-sdk/openai";
import { grade, EvalFunction } from "mcp-evals";

const releaseActionsToolEval: EvalFunction = {
    name: 'Release Actions Tool Evaluation',
    description: 'Evaluates the release actions tool for creating and managing releases',
    run: async () => {
        const result = await grade(openai("gpt-4"), "Create a new major release with version 2.0.0 and add release notes highlighting the critical improvements.");
        return JSON.parse(result);
    }
};

const listReleasesToolEvaluation: EvalFunction = {
    name: 'listReleasesToolEvaluation',
    description: 'Evaluates the listReleasesTool by verifying it lists repository releases from the past month',
    run: async () => {
        const result = await grade(openai("gpt-4"), "List all the releases for the GitHub repository 'microsoft/vscode' created in the past month");
        return JSON.parse(result);
    }
};

const editReleaseToolEval: EvalFunction = {
    name: 'editReleaseToolEval',
    description: 'Evaluates the edit release tool functionality',
    run: async () => {
        const result = await grade(openai("gpt-4"), "Please edit the release with ID 123 to change its version to 2.3.4 and add the note: 'Minor bug fixes and improvements.'");
        return JSON.parse(result);
    }
};

const list_releasesEval: EvalFunction = {
    name: 'list_releases Evaluation',
    description: 'Evaluates the list_releases tool',
    run: async () => {
        const result = await grade(openai("gpt-4"), "Show me the scheduled content releases available in Sanity");
        return JSON.parse(result);
    }
};

const create_releaseEval: EvalFunction = {
    name: 'create_release',
    description: 'Evaluates the creation of a new content release in Sanity with an automatically generated ID',
    run: async () => {
        const result = await grade(openai("gpt-4"), "Create a new content release named 'Summer Release' in Sanity with an automatically generated ID.");
        return JSON.parse(result);
    }
};

const config: EvalConfig = {
    model: openai("gpt-4"),
    evals: [releaseActionsToolEval, listReleasesToolEvaluation, editReleaseToolEval, list_releasesEval, create_releaseEval]
};
  
export default config;
  
export const evals = [releaseActionsToolEval, listReleasesToolEvaluation, editReleaseToolEval, list_releasesEval, create_releaseEval];