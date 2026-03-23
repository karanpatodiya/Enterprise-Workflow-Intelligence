import { LLMProvider } from './llm-provider';
import { VectorStoreProvider } from './vector-store';
import { RAGQuery, RAGResult } from '../domain';
export declare class RAGOrchestrationService {
    private llmProvider;
    private vectorStore;
    constructor(llmProvider: LLMProvider, vectorStore: VectorStoreProvider);
    executeRAGQuery(query: RAGQuery): Promise<RAGResult>;
    private buildVectorFilter;
    private enrichSourceChunks;
    private buildRAGContext;
    private buildRAGPrompt;
    private getContextTypeGuidance;
    private calculateConfidenceScore;
    private checkHallucinationMitigation;
}
//# sourceMappingURL=rag-orchestration.d.ts.map