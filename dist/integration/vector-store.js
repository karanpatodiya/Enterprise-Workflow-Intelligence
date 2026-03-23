"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorStoreFactory = void 0;
class VectorStoreFactory {
    static create(provider) {
        switch (provider) {
            case 'pinecone':
                return new PineconeVectorStore();
            case 'weaviate':
                return new WeaviateVectorStore();
            case 'milvus':
                return new MilvusVectorStore();
            default:
                throw new Error(`Unknown vector store provider: ${provider}`);
        }
    }
}
exports.VectorStoreFactory = VectorStoreFactory;
// Pinecone Implementation
class PineconeVectorStore {
    constructor() {
        this.name = 'pinecone';
        this.apiKey = process.env.PINECONE_API_KEY || '';
        this.indexName = process.env.PINECONE_INDEX_NAME || 'workforce-intelligence';
        this.environment = process.env.PINECONE_ENVIRONMENT || 'production';
        this.baseUrl = `https://${this.indexName}-${this.environment}.pinecone.io`;
    }
    async initialize() {
        // Pinecone index should be pre-created
        await this.healthCheck();
    }
    async upsertEmbeddings(request) {
        const vectors = request.embeddings.map((emb) => ({
            id: emb.id,
            values: emb.vector,
            metadata: emb.metadata,
        }));
        const url = `${this.baseUrl}/vectors/upsert`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Api-Key': this.apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                vectors,
                namespace: request.namespace || 'default',
            }),
        });
        if (!response.ok) {
            throw new Error(`Pinecone upsert failed: ${response.statusText}`);
        }
    }
    async query(request) {
        const url = `${this.baseUrl}/query`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Api-Key': this.apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                vector: request.vector,
                topK: request.topK,
                includeMetadata: true,
                filter: request.filter,
            }),
        });
        if (!response.ok) {
            throw new Error(`Pinecone query failed: ${response.statusText}`);
        }
        const data = await response.json();
        return data.matches.map((match) => ({
            id: match.id,
            score: match.score,
            metadata: match.metadata,
        }));
    }
    async delete(ids) {
        const url = `${this.baseUrl}/vectors/delete`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Api-Key': this.apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ids }),
        });
        if (!response.ok) {
            throw new Error(`Pinecone delete failed: ${response.statusText}`);
        }
    }
    async deleteByFilter(filter) {
        const url = `${this.baseUrl}/vectors/delete`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Api-Key': this.apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ deleteRequest: { filter } }),
        });
        if (!response.ok) {
            throw new Error(`Pinecone deleteByFilter failed: ${response.statusText}`);
        }
    }
    async healthCheck() {
        try {
            const url = `${this.baseUrl}/describe_index_stats`;
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Api-Key': this.apiKey },
            });
            return response.ok;
        }
        catch {
            return false;
        }
    }
}
// Weaviate Implementation
class WeaviateVectorStore {
    constructor() {
        this.name = 'weaviate';
        this.className = 'WorkforceIntelligence';
        this.apiKey = process.env.WEAVIATE_API_KEY || '';
        this.baseUrl = process.env.WEAVIATE_BASE_URL || 'http://localhost:8080';
    }
    async initialize() {
        // Create class if not exists
        await this.healthCheck();
    }
    async upsertEmbeddings(request) {
        const url = `${this.baseUrl}/v1/batch/objects`;
        const objects = request.embeddings.map((emb) => ({
            class: this.className,
            id: emb.id,
            properties: emb.metadata,
            vector: emb.vector,
        }));
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
            },
            body: JSON.stringify(objects),
        });
        if (!response.ok) {
            throw new Error(`Weaviate upsert failed: ${response.statusText}`);
        }
    }
    async query(request) {
        const graphQL = `
      {
        Get {
          ${this.className}(
            nearVector: { vector: [${request.vector.join(', ')}] }
            limit: ${request.topK}
            ${request.filter ? `where: ${JSON.stringify(request.filter)}` : ''}
          ) {
            _additional {
              distance
              id
            }
            __typename
          }
        }
      }
    `;
        const response = await fetch(`${this.baseUrl}/v1/graphql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
            },
            body: JSON.stringify({ query: graphQL }),
        });
        if (!response.ok) {
            throw new Error(`Weaviate query failed: ${response.statusText}`);
        }
        const data = await response.json();
        const results = data.data.Get[this.className] || [];
        return results.map((item) => ({
            id: item._additional.id,
            score: 1 - item._additional.distance, // Convert distance to similarity
            metadata: {},
        }));
    }
    async delete(ids) {
        for (const id of ids) {
            const response = await fetch(`${this.baseUrl}/v1/objects/${this.className}/${id}`, {
                method: 'DELETE',
                headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
            });
            if (!response.ok) {
                throw new Error(`Weaviate delete failed for ${id}`);
            }
        }
    }
    async deleteByFilter(filter) {
        const response = await fetch(`${this.baseUrl}/v1/objects?class=${this.className}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
            },
            body: JSON.stringify({ where: filter }),
        });
        if (!response.ok) {
            throw new Error(`Weaviate deleteByFilter failed`);
        }
    }
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseUrl}/v1/.well-known/ready`, {
                method: 'GET',
            });
            return response.ok;
        }
        catch {
            return false;
        }
    }
}
// Milvus Implementation
class MilvusVectorStore {
    constructor() {
        this.name = 'milvus';
        this.collectionName = 'workforce_intelligence';
        this.apiKey = process.env.MILVUS_API_KEY || '';
        this.baseUrl = process.env.MILVUS_BASE_URL || 'http://localhost:19530';
    }
    async initialize() {
        await this.healthCheck();
    }
    async upsertEmbeddings(request) {
        const url = `${this.baseUrl}/v1/vector/upsert`;
        const vectors = request.embeddings.map((emb) => ({
            id: emb.id,
            vector: emb.vector,
            metadata: emb.metadata,
        }));
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
            },
            body: JSON.stringify({
                collectionName: this.collectionName,
                vectors,
            }),
        });
        if (!response.ok) {
            throw new Error(`Milvus upsert failed: ${response.statusText}`);
        }
    }
    async query(request) {
        const url = `${this.baseUrl}/v1/vector/search`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
            },
            body: JSON.stringify({
                collectionName: this.collectionName,
                vector: request.vector,
                limit: request.topK,
                filter: request.filter,
            }),
        });
        if (!response.ok) {
            throw new Error(`Milvus query failed: ${response.statusText}`);
        }
        const data = await response.json();
        return data.results.map((result) => ({
            id: result.id,
            score: result.score,
            metadata: {},
        }));
    }
    async delete(ids) {
        const url = `${this.baseUrl}/v1/vector/delete`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
            },
            body: JSON.stringify({
                collectionName: this.collectionName,
                ids,
            }),
        });
        if (!response.ok) {
            throw new Error(`Milvus delete failed`);
        }
    }
    async deleteByFilter(filter) {
        const url = `${this.baseUrl}/v1/vector/delete`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
            },
            body: JSON.stringify({
                collectionName: this.collectionName,
                filter,
            }),
        });
        if (!response.ok) {
            throw new Error(`Milvus deleteByFilter failed`);
        }
    }
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseUrl}/v1/health`, {
                method: 'GET',
            });
            return response.ok;
        }
        catch {
            return false;
        }
    }
}
//# sourceMappingURL=vector-store.js.map