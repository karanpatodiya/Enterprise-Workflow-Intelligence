export interface LLMProvider {
    name: string;
    generateEmbedding(text: string): Promise<number[]>;
    chat(messages: ChatMessage[], options?: LLMOptions): Promise<string>;
    structuredOutput(prompt: string, schema: Record<string, any>): Promise<Record<string, any>>;
}
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
export interface LLMOptions {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
}
export declare class LLMFactory {
    static create(provider: 'openai' | 'anthropic' | 'azure' | 'gemini'): LLMProvider;
}
//# sourceMappingURL=llm-provider.d.ts.map