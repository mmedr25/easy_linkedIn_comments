console.log("Hello via Bun!");


type OllamaApiResponse = {
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

type PrePrompts = string[];

type Prompt = string;

export const generatePrePromptString = (prePrompts: PrePrompts) => {
    if (!prePrompts.length) {
        return "";
    }

    const newPrePrompts = prePrompts.map((item) => {
        return item.trim().replace(/\.$/, "");
    });

    return newPrePrompts.join(".");
}

export const generatePrompt = (prompt: Prompt, prePrompts: PrePrompts) => {
    const prePromptsString = generatePrePromptString(prePrompts);

    return `System:${prePromptsString}\n User:${prompt}`;
}

const apiUrl = "http://localhost:11434"; // config

export const singleResponse = async () => {
    const url = `${apiUrl}/api/generate`;
    const prompt = "je commence un nouveau projet";
    const prePrompts = ["You are a helpful assistant.", "you are a developper", "You will reply to a linkedIn comment in a way that is friendly, helpful and funny."];

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            prompt: generatePrompt(prompt, prePrompts),
            model: "llama3.2-vision", // config
            stream: false,
            options: {
                max_tokens: 100,
                temperature: 0.7,
                top_p: 0.9,
            }
        }),
    });
    const data: OllamaApiResponse = await response.json();
    console.log(data);
    return data;
}


export const multiResponse = async () => {
    const responses = []
    
    for (let i = 0; i < 10; i++) {
        const response = singleResponse();
        responses.push(response);
    }

    return await Promise.allSettled(responses);
}
