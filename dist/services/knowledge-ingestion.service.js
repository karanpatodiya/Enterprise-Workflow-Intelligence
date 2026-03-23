"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeIngestionService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const config_1 = require("../config");
const logger_1 = require("../config/logger");
const uuid_1 = require("uuid");
class KnowledgeIngestionService {
    constructor(llmProvider, vectorStore, documentRepository) {
        this.llmProvider = llmProvider;
        this.vectorStore = vectorStore;
        this.documentRepository = documentRepository;
    }
    async ingestDocument(document, filePath) {
        try {
            logger_1.logger.info('Starting document ingestion', {
                documentId: document.id,
                filePath,
            });
            // Step 1: Extract content based on file type
            const content = await this.extractContent(filePath, document.fileType);
            // Step 2: Chunk the content intelligently
            const chunks = await this.chunkDocument(content, document);
            logger_1.logger.info('Document chunked', {
                documentId: document.id,
                chunkCount: chunks.length,
            });
            // Step 3: Generate embeddings for each chunk
            const embeddings = await this.generateEmbeddings(chunks, document);
            // Step 4: Store embeddings in vector store
            await this.vectorStore.upsertEmbeddings({
                embeddings: embeddings.map((emb, index) => ({
                    id: chunks[index].id,
                    vector: emb,
                    metadata: chunks[index].metadata,
                    text: chunks[index].content,
                })),
            });
            // Step 5: Update document status
            await this.documentRepository.update(document.id, document.tenantId, {
                isIndexed: true,
                version: (document.version || 1) + 1,
            });
            logger_1.logger.info('Document ingestion completed', {
                documentId: document.id,
            });
        }
        catch (error) {
            logger_1.logger.error('Document ingestion failed', error);
            throw error;
        }
    }
    async reindexDocument(documentId, tenantId, filePath) {
        try {
            logger_1.logger.info('Starting document reindexing', { documentId });
            const document = await this.documentRepository.findById(documentId, tenantId);
            if (!document) {
                throw new Error(`Document ${documentId} not found`);
            }
            // Delete old embeddings from vector store
            if (document.vectorStoreId) {
                await this.vectorStore.deleteByFilter({
                    vector_store_id: document.vectorStoreId,
                });
            }
            // Re-ingest
            await this.ingestDocument(document, filePath);
        }
        catch (error) {
            logger_1.logger.error('Document reindexing failed', error);
            throw error;
        }
    }
    async extractContent(filePath, fileType) {
        switch (fileType.toLowerCase()) {
            case 'pdf':
                return this.extractFromPDF(filePath);
            case 'docx':
                return this.extractFromDOCX(filePath);
            case 'md':
                return this.extractFromMarkdown(filePath);
            default:
                throw new Error(`Unsupported file type: ${fileType}`);
        }
    }
    async extractFromPDF(filePath) {
        try {
            const dataBuffer = fs_1.default.readFileSync(filePath);
            const data = await (0, pdf_parse_1.default)(dataBuffer);
            return {
                title: path_1.default.basename(filePath),
                text: data.text,
            };
        }
        catch (error) {
            logger_1.logger.error('PDF extraction failed', error);
            throw error;
        }
    }
    async extractFromDOCX(filePath) {
        try {
            // For DOCX files, just return a placeholder extraction
            // Full DOCX parsing requires a proper library like docx2txt
            const buffer = fs_1.default.readFileSync(filePath);
            return {
                title: path_1.default.basename(filePath),
                text: `[DOCX Document: ${path_1.default.basename(filePath)}]\n\nNote: Full DOCX parsing requires additional dependencies. This is a placeholder implementation.`,
            };
        }
        catch (error) {
            logger_1.logger.error('DOCX extraction failed', error);
            throw error;
        }
    }
    async extractFromMarkdown(filePath) {
        try {
            const text = fs_1.default.readFileSync(filePath, 'utf-8');
            return {
                title: path_1.default.basename(filePath),
                text,
            };
        }
        catch (error) {
            logger_1.logger.error('Markdown extraction failed', error);
            throw error;
        }
    }
    async chunkDocument(content, document) {
        const chunks = [];
        const text = content.text;
        const chunkSize = config_1.config.rag.chunkSize;
        const chunkOverlap = config_1.config.rag.chunkOverlap;
        // Split by paragraphs first (semantic chunking)
        const paragraphs = text.split(/\n\n+/);
        let currentChunk = '';
        let chunkIndex = 0;
        for (const paragraph of paragraphs) {
            if ((currentChunk + paragraph).length > chunkSize) {
                if (currentChunk) {
                    chunks.push(this.createChunk(chunks.length, currentChunk, document, content.title));
                    chunkIndex++;
                }
                // Add overlap
                currentChunk = currentChunk.slice(-chunkOverlap) + paragraph;
            }
            else {
                currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
            }
        }
        // Add remaining chunk
        if (currentChunk) {
            chunks.push(this.createChunk(chunks.length, currentChunk, document, content.title));
        }
        logger_1.logger.debug('Document chunked with semantic splitting', {
            originalSize: text.length,
            chunkCount: chunks.length,
            avgChunkSize: Math.round(text.length / chunks.length),
        });
        return chunks;
    }
    createChunk(index, content, document, documentTitle) {
        const metadata = {
            ...document.metadata,
            chunk_index: index,
        };
        return {
            id: (0, uuid_1.v4)(),
            documentId: document.id,
            tenantId: document.tenantId,
            chunkIndex: index,
            content,
            metadata,
            createdAt: new Date(),
        };
    }
    async generateEmbeddings(chunks, document) {
        const embeddings = [];
        logger_1.logger.info('Generating embeddings for chunks', {
            chunkCount: chunks.length,
            documentId: document.id,
        });
        for (let i = 0; i < chunks.length; i++) {
            try {
                const embedding = await this.llmProvider.generateEmbedding(chunks[i].content);
                embeddings.push(embedding);
                if ((i + 1) % 10 === 0) {
                    logger_1.logger.debug(`Processed ${i + 1}/${chunks.length} embeddings`);
                }
            }
            catch (error) {
                logger_1.logger.warn(`Embedding generation failed for chunk ${i}`, error);
                // Use zero vector as fallback
                embeddings.push(new Array(1536).fill(0));
            }
        }
        return embeddings;
    }
}
exports.KnowledgeIngestionService = KnowledgeIngestionService;
//# sourceMappingURL=knowledge-ingestion.service.js.map