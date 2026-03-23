import { LLMProvider } from '../integration/llm-provider';
import { VectorStoreProvider } from '../integration/vector-store';
import { CompanyKnowledgeDocument } from '../domain';
import { KnowledgeDocumentRepository } from '../repositories/knowledge-document.repository';
export declare class KnowledgeIngestionService {
    private llmProvider;
    private vectorStore;
    private documentRepository;
    constructor(llmProvider: LLMProvider, vectorStore: VectorStoreProvider, documentRepository: KnowledgeDocumentRepository);
    ingestDocument(document: CompanyKnowledgeDocument, filePath: string): Promise<void>;
    reindexDocument(documentId: string, tenantId: string, filePath: string): Promise<void>;
    private extractContent;
    private extractFromPDF;
    private extractFromDOCX;
    private extractFromMarkdown;
    private chunkDocument;
    private createChunk;
    private generateEmbeddings;
}
//# sourceMappingURL=knowledge-ingestion.service.d.ts.map