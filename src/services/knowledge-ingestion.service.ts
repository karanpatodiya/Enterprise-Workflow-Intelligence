import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import { Document } from 'docx';
import markdownIt from 'markdown-it';
import { LLMProvider } from '../integration/llm-provider';
import { VectorStoreProvider } from '../integration/vector-store';
import { config } from '../config';
import { logger } from '../config/logger';
import { CompanyKnowledgeDocument, DocumentChunk, DocumentMetadata, ChunkMetadata } from '../domain';
import { KnowledgeDocumentRepository } from '../repositories/knowledge-document.repository';
import { v4 as uuidv4 } from 'uuid';

interface DocumentContent {
  title: string;
  text: string;
}

export class KnowledgeIngestionService {
  constructor(
    private llmProvider: LLMProvider,
    private vectorStore: VectorStoreProvider,
    private documentRepository: KnowledgeDocumentRepository
  ) {}

  async ingestDocument(
    document: CompanyKnowledgeDocument,
    filePath: string
  ): Promise<void> {
    try {
      logger.info('Starting document ingestion', {
        documentId: document.id,
        filePath,
      });

      // Step 1: Extract content based on file type
      const content = await this.extractContent(filePath, document.fileType);

      // Step 2: Chunk the content intelligently
      const chunks = await this.chunkDocument(content, document);

      logger.info('Document chunked', {
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

      logger.info('Document ingestion completed', {
        documentId: document.id,
      });
    } catch (error) {
      logger.error('Document ingestion failed', error as Error);
      throw error;
    }
  }

  async reindexDocument(documentId: string, tenantId: string, filePath: string): Promise<void> {
    try {
      logger.info('Starting document reindexing', { documentId });

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
    } catch (error) {
      logger.error('Document reindexing failed', error as Error);
      throw error;
    }
  }

  private async extractContent(
    filePath: string,
    fileType: string
  ): Promise<DocumentContent> {
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

  private async extractFromPDF(filePath: string): Promise<DocumentContent> {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);

      return {
        title: path.basename(filePath),
        text: data.text,
      };
    } catch (error) {
      logger.error('PDF extraction failed', error as Error);
      throw error;
    }
  }

  private async extractFromDOCX(filePath: string): Promise<DocumentContent> {
    try {
      // For DOCX files, just return a placeholder extraction
      // Full DOCX parsing requires a proper library like docx2txt
      const buffer = fs.readFileSync(filePath);

      return {
        title: path.basename(filePath),
        text: `[DOCX Document: ${path.basename(filePath)}]\n\nNote: Full DOCX parsing requires additional dependencies. This is a placeholder implementation.`,
      };
    } catch (error) {
      logger.error('DOCX extraction failed', error as Error);
      throw error;
    }
  }

  private async extractFromMarkdown(filePath: string): Promise<DocumentContent> {
    try {
      const text = fs.readFileSync(filePath, 'utf-8');

      return {
        title: path.basename(filePath),
        text,
      };
    } catch (error) {
      logger.error('Markdown extraction failed', error as Error);
      throw error;
    }
  }

  private async chunkDocument(
    content: DocumentContent,
    document: CompanyKnowledgeDocument
  ): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];
    const text = content.text;
    const chunkSize = config.rag.chunkSize;
    const chunkOverlap = config.rag.chunkOverlap;

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
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }

    // Add remaining chunk
    if (currentChunk) {
      chunks.push(
        this.createChunk(chunks.length, currentChunk, document, content.title)
      );
    }

    logger.debug('Document chunked with semantic splitting', {
      originalSize: text.length,
      chunkCount: chunks.length,
      avgChunkSize: Math.round(text.length / chunks.length),
    });

    return chunks;
  }

  private createChunk(
    index: number,
    content: string,
    document: CompanyKnowledgeDocument,
    documentTitle: string
  ): DocumentChunk {
    const metadata: ChunkMetadata = {
      ...document.metadata,
      chunk_index: index,
    };

    return {
      id: uuidv4(),
      documentId: document.id,
      tenantId: document.tenantId,
      chunkIndex: index,
      content,
      metadata,
      createdAt: new Date(),
    };
  }

  private async generateEmbeddings(
    chunks: DocumentChunk[],
    document: CompanyKnowledgeDocument
  ): Promise<number[][]> {
    const embeddings: number[][] = [];

    logger.info('Generating embeddings for chunks', {
      chunkCount: chunks.length,
      documentId: document.id,
    });

    for (let i = 0; i < chunks.length; i++) {
      try {
        const embedding = await this.llmProvider.generateEmbedding(chunks[i].content);
        embeddings.push(embedding);

        if ((i + 1) % 10 === 0) {
          logger.debug(`Processed ${i + 1}/${chunks.length} embeddings`);
        }
      } catch (error) {
        logger.warn(`Embedding generation failed for chunk ${i}`, error as Error);
        // Use zero vector as fallback
        embeddings.push(new Array(1536).fill(0));
      }
    }

    return embeddings;
  }
}
