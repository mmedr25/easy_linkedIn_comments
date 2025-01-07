import type { PrePrompts, Prompt } from "../types/api";

console.log("Comming soon");




const generatePrePromptString = (prePrompts: PrePrompts) => {
    if (!prePrompts.length) return "";

    const newPrePrompts = prePrompts.map((item) => {
        return item.trim().replace(/\.$/, "");
    });

    return newPrePrompts.join(".") + ".";
}

const generatePromptString = (prompt: Prompt, prePrompts: PrePrompts) => {
    return `${generatePrePromptString(prePrompts)} ${prompt}`;
}

const apiUrl = "https://api.openai.com/v1";

interface ChatGPTResponseError {
    error: {
        message: string;
        type: string,
        param: unknown | null,
        code: string,
    },
}

type ChatGPTResponse = ChatGPTResponseError



const singleResponse = async () => {
    const url = `${apiUrl}/chat/completions`;
    const prompt = "je commence un nouveau projet";
    const prePrompts = ["You are a helpful assistant.", "you are a developper", "You will reply to a linkedIn comment in a way that is friendly, helpful and funny."];
    const OPENAI_API_KEY = '';
    

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                prompt: generatePromptString(prompt, prePrompts),
                model: "gpt-4o-mini",
                stream: false,
                max_tokens: 150,
                temperature: 0.7,
                top_p: 0.9,
            }),
        });
        const data: ChatGPTResponse = await response.json();
        
        console.log(data)
        if (data?.error) {
            throw new Error(data?.error?.message);
        }
        return data;
        
    } catch (error) {
        console.error("error response", error);
    }
}


const multiResponse = async () => {
    const responses = []
    
    for (let i = 0; i < 10; i++) {
        const response = singleResponse();
        responses.push(response);
    }

    return await Promise.allSettled(responses);
}

await multiResponse();
