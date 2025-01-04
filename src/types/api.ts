
export interface Api<ResponseType> {
    // generatePrePrompts(prePrompts: PrePrompts): string;
    setPrompt(prompt: Prompt): void;
    setPreprompts(prePrompts: PrePrompts): void;
    getPrompt(): Prompt;
    getPreprompts(): PrePrompts;
    generatePromptString(): string;
    singleResponse(): Promise<ResponseType>;
    multipleResponse(): Promise<PromiseSettledResult<ResponseType>[]>;
}

export type OllamaApiResponse = {
    model: string;
    created_at: string;
    response: string;
    done: boolean;
    done_reason: string;
    context: number[];
    total_duration: number;
    load_duration: number;
    prompt_eval_count: number;
    prompt_eval_duration: number;
    eval_count: number;
    eval_duration: number;
};

export type PrePrompts = string[];

export type Prompt = string;