import type { Api, OllamaApiResponse, PrePrompts, Prompt } from "../types/api";

class OllamaApi implements Api<OllamaApiResponse> {
    prompt: Prompt;
    prePrompts: PrePrompts;
    private apiUrl: string;

    constructor(apiUrl: string) {
        this.apiUrl = apiUrl;
    }
    generatePromptString(): string {
        return `System:${this.generatePrePromptString()}\n User:${prompt}`;
    }
    generatePrePromptString(): string {
        if (!this.prePrompts.length) {
            return "";
        }
    
        const newPrePrompts = this.prePrompts.map((item) => {
            return item.trim().replace(/\.$/, "");
        });
    
        return newPrePrompts.join(".");
    }
    getPreprompts(): PrePrompts {
        return this.prePrompts;
    }
    getPrompt(): Prompt {
        return this.prompt
    }
    setPreprompts(prePrompts: PrePrompts): void {
        this.prePrompts = prePrompts;
    }
    setPrompt(prompt: Prompt): void {
        this.prompt = prompt;
    }
    singleResponse(): Promise<OllamaApiResponse> {
        
    }
    async multipleResponse(): Promise<PromiseSettledResult<OllamaApiResponse>[]> {
        const responses = []
    
        for (let i = 0; i < 10; i++) {
            const response = this.singleResponse();
            responses.push(response);
        }

        return await Promise.allSettled(responses);
    }
}