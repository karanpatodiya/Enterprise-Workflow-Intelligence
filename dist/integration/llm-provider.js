"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMFactory = void 0;
const axios_1 = __importDefault(require("axios"));
const generative_ai_1 = require("@google/generative-ai");
const config_1 = require("../config");
const logger_1 = require("../config/logger");
class LLMFactory {
    static create(provider) {
        switch (provider) {
            case 'gemini':
                return new GeminiProvider();
            case 'openai':
                return new OpenAIProvider();
            case 'anthropic':
                return new AnthropicProvider();
            case 'azure':
                return new AzureOpenAIProvider();
            default:
                throw new Error(`Unknown LLM provider: ${provider}`);
        }
    }
}
exports.LLMFactory = LLMFactory;
// OpenAI Implementation
class OpenAIProvider {
    constructor() {
        this.name = 'openai';
        this.apiKey = config_1.config.llm.openai?.apiKey || '';
        this.model = config_1.config.llm.openai?.model || 'gpt-4-turbo-preview';
        this.embeddingModel = config_1.config.llm.openai?.embeddingModel || 'text-embedding-3-large';
        this.client = axios_1.default.create({
            baseURL: 'https://api.openai.com/v1',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
        });
    }
    async generateEmbedding(text) {
        try {
            const response = await this.client.post('/embeddings', {
                model: this.embeddingModel,
                input: text,
                encoding_format: 'float',
            });
            return response.data.data[0].embedding;
        }
        catch (error) {
            logger_1.logger.error('OpenAI embedding generation failed', error);
            throw error;
        }
    }
    async chat(messages, options) {
        try {
            const response = await this.client.post('/chat/completions', {
                model: this.model,
                messages,
                temperature: options?.temperature ?? 0.7,
                max_tokens: options?.maxTokens ?? 2000,
                top_p: options?.topP ?? 1,
                frequency_penalty: options?.frequencyPenalty ?? 0,
            });
            const content = response.data.choices[0].message.content;
            return content;
        }
        catch (error) {
            logger_1.logger.error('OpenAI chat failed', error);
            throw error;
        }
    }
    async structuredOutput(prompt, schema) {
        try {
            const systemPrompt = `You are a helpful assistant that always responds with valid JSON matching the provided schema.
Schema: ${JSON.stringify(schema, null, 2)}

Always respond only with valid JSON, no additional text.`;
            const response = await this.client.post('/chat/completions', {
                model: this.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.1,
                max_tokens: 2000,
                response_format: { type: 'json_object' },
            });
            const content = response.data.choices[0].message.content;
            return JSON.parse(content);
        }
        catch (error) {
            logger_1.logger.error('OpenAI structured output failed', error);
            throw error;
        }
    }
}
// Anthropic Implementation
class AnthropicProvider {
    constructor() {
        this.name = 'anthropic';
        this.model = 'claude-3-5-sonnet-20241022';
        this.apiKey = process.env.ANTHROPIC_API_KEY || '';
        this.client = axios_1.default.create({
            baseURL: 'https://api.anthropic.com/v1',
            headers: {
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json',
            },
        });
    }
    async generateEmbedding(text) {
        // Anthropic doesn't provide embeddings natively
        // Fallback to OpenAI or custom embedding service
        logger_1.logger.warn('Anthropic provider does not support embeddings natively, using fallback');
        throw new Error('Embeddings not supported by Anthropic provider');
    }
    async chat(messages, options) {
        try {
            const response = await this.client.post('/messages', {
                model: this.model,
                max_tokens: options?.maxTokens ?? 2048,
                temperature: options?.temperature ?? 0.7,
                messages: messages.map((m) => ({
                    role: m.role === 'assistant' ? 'assistant' : 'user',
                    content: m.content,
                })),
            });
            return response.data.content[0].text;
        }
        catch (error) {
            logger_1.logger.error('Anthropic chat failed', error);
            throw error;
        }
    }
    async structuredOutput(prompt, schema) {
        try {
            const systemPrompt = `You are a helpful assistant that always responds with valid JSON matching the provided schema.
Schema: ${JSON.stringify(schema, null, 2)}

Always respond only with valid JSON, no additional text.`;
            const response = await this.client.post('/messages', {
                model: this.model,
                max_tokens: 2048,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                system: systemPrompt,
            });
            const content = response.data.content[0].text;
            return JSON.parse(content);
        }
        catch (error) {
            logger_1.logger.error('Anthropic structured output failed', error);
            throw error;
        }
    }
}
// Azure OpenAI Implementation
class AzureOpenAIProvider {
    constructor() {
        this.name = 'azure';
        this.apiKey = process.env.AZURE_OPENAI_API_KEY || '';
        this.endpoint = process.env.AZURE_OPENAI_ENDPOINT || '';
        this.deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4';
        this.client = axios_1.default.create({
            baseURL: this.endpoint,
            headers: {
                'api-key': this.apiKey,
                'Content-Type': 'application/json',
            },
        });
    }
    async generateEmbedding(text) {
        try {
            const response = await this.client.post(`/openai/deployments/text-embedding-3-large/embeddings?api-version=2024-02-15-preview`, {
                input: text,
            });
            return response.data.data[0].embedding;
        }
        catch (error) {
            logger_1.logger.error('Azure OpenAI embedding generation failed', error);
            throw error;
        }
    }
    async chat(messages, options) {
        try {
            const response = await this.client.post(`/openai/deployments/${this.deploymentName}/chat/completions?api-version=2024-02-15-preview`, {
                messages,
                temperature: options?.temperature ?? 0.7,
                max_tokens: options?.maxTokens ?? 2000,
                top_p: options?.topP ?? 1,
                frequency_penalty: options?.frequencyPenalty ?? 0,
            });
            return response.data.choices[0].message.content;
        }
        catch (error) {
            logger_1.logger.error('Azure OpenAI chat failed', error);
            throw error;
        }
    }
    async structuredOutput(prompt, schema) {
        try {
            const systemPrompt = `You are a helpful assistant that always responds with valid JSON matching the provided schema.
Schema: ${JSON.stringify(schema, null, 2)}

Always respond only with valid JSON, no additional text.`;
            const response = await this.client.post(`/openai/deployments/${this.deploymentName}/chat/completions?api-version=2024-02-15-preview`, {
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.1,
                max_tokens: 2000,
            });
            const content = response.data.choices[0].message.content;
            return JSON.parse(content);
        }
        catch (error) {
            logger_1.logger.error('Azure OpenAI structured output failed', error);
            throw error;
        }
    }
}
// Gemini Implementation
class GeminiProvider {
    constructor() {
        this.name = 'gemini';
        const apiKey = process.env.GEMINI_API_KEY || '';
        this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    }
    async generateEmbedding(text) {
        try {
            const model = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
            const result = await model.embedContent(text);
            return result.embedding.values;
        }
        catch (error) {
            logger_1.logger.error('Gemini embedding generation failed', error);
            throw error;
        }
    }
    async chat(messages, options) {
        try {
            const history = messages.slice(0, -1).map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            }));
            const lastMessage = messages[messages.length - 1].content;
            const chat = this.model.startChat({
                history,
                generationConfig: {
                    temperature: options?.temperature ?? 0.7,
                    maxOutputTokens: options?.maxTokens ?? 2000,
                },
            });
            const result = await chat.sendMessage(lastMessage);
            const response = await result.response;
            return response.text();
        }
        catch (error) {
            logger_1.logger.error('Gemini chat failed', error);
            throw error;
        }
    }
    async structuredOutput(prompt, schema) {
        try {
            const systemPrompt = `You are a helpful assistant that always responds with valid JSON matching the provided schema.
Always respond only with valid JSON, no additional text.`;
            const fullPrompt = `${systemPrompt}\n\nSchema: ${JSON.stringify(schema, null, 2)}\n\nQuery: ${prompt}`;
            const result = await this.model.generateContent(fullPrompt);
            const response = await result.response;
            const text = response.text();
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            return JSON.parse(jsonMatch ? jsonMatch[0] : text);
        }
        catch (error) {
            logger_1.logger.error('Gemini structured output failed', error);
            throw error;
        }
    }
}
//# sourceMappingURL=llm-provider.js.map