export interface VectorStoreProvider {
    name: string;
    initialize(): Promise<void>;
    upsertEmbeddings(request: UpsertEmbeddingsRequest): Promise<void>;
    query(request: QueryRequest): Promise<QueryResult[]>;
    delete(ids: string[]): Promise<void>;
    deleteByFilter(filter: Record<string, any>): Promise<void>;
    healthCheck(): Promise<boolean>;
}
export interface Embedding {
    id: string;
    vector: number[];
    metadata: Record<string, any>;
    text?: string;
}
export interface UpsertEmbeddingsRequest {
    embeddings: Embedding[];
    namespace?: string;
}
export interface QueryRequest {
    vector: number[];
    topK: number;
    filter?: Record<string, any>;
}
export interface QueryResult {
    id: string;
    score: number;
    metadata: Record<string, any>;
    text?: string;
}
export declare class VectorStoreFactory {
    static create(provider: 'pinecone' | 'weaviate' | 'milvus'): VectorStoreProvider;
}
//# sourceMappingURL=vector-store.d.ts.map