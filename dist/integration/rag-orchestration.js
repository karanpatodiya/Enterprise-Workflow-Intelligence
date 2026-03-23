"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RAGOrchestrationService = void 0;
const logger_1 = require("../config/logger");
const config_1 = require("../config");
class RAGOrchestrationService {
    constructor(llmProvider, vectorStore) {
        this.llmProvider = llmProvider;
        this.vectorStore = vectorStore;
    }
    async executeRAGQuery(query) {
        const startTime = Date.now();
        try {
            logger_1.logger.info('Executing RAG query', {
                employeeId: query.employeeId,
                contextType: query.contextType,
            });
            // Step 1: Generate embedding for the query
            const queryEmbedding = await this.llmProvider.generateEmbedding(query.query);
            // Step 2: Build vector search filter based on tenant and filters
            const vectorFilter = this.buildVectorFilter(query);
            // Step 3: Hybrid retrieval from vector store
            const retrievedChunks = await this.vectorStore.query({
                vector: queryEmbedding,
                topK: config_1.config.rag.topKResults,
                filter: vectorFilter,
            });
            // Step 4: Rank and filter by confidence
            const filteredChunks = retrievedChunks.filter((chunk) => chunk.score >= config_1.config.rag.confidenceThreshold);
            logger_1.logger.debug('Retrieved chunks', {
                total: retrievedChunks.length,
                filtered: filteredChunks.length,
                threshold: config_1.config.rag.confidenceThreshold,
            });
            // Step 5: Convert vector results to source chunks with metadata
            const sourceChunks = await this.enrichSourceChunks(filteredChunks, query.tenantId);
            // Step 6: Generate context from retrieved documents
            const context = this.buildRAGContext(sourceChunks);
            // Step 7: Build prompt with hallucination mitigation
            const prompt = this.buildRAGPrompt(query.query, context, query.contextType, sourceChunks);
            // Step 8: Generate answer with LLM
            const answer = await this.llmProvider.chat([
                {
                    role: 'system',
                    content: `You are an expert Enterprise Workforce Intelligence assistant.
            You have access to company-specific knowledge and must ground your responses in the provided documents.
            If you don't have information to answer a question, say "I don't have sufficient information to answer this question."
            Always cite your sources by referencing the document titles.`,
                },
                { role: 'user', content: prompt },
            ], { temperature: 0.3, maxTokens: 1500 });
            // Step 9: Calculate confidence score
            const confidenceScore = this.calculateConfidenceScore(sourceChunks, filteredChunks.length);
            // Step 10: Determine if hallucination mitigation was applied
            const halluccinationMitigationApplied = this.checkHallucinationMitigation(answer, sourceChunks);
            const executionTimeMs = Date.now() - startTime;
            logger_1.logger.info('RAG query executed successfully', {
                executionTimeMs,
                sourceChunkCount: sourceChunks.length,
                confidenceScore,
            });
            return {
                query: query.query,
                answer,
                sourceChunks,
                confidenceScore,
                halluccinationMitigationApplied,
                executionTimeMs,
            };
        }
        catch (error) {
            logger_1.logger.error('RAG query execution failed', error);
            throw error;
        }
    }
    buildVectorFilter(query) {
        const filter = {
            company_id: query.tenantId,
        };
        if (query.filters?.departmentId) {
            filter.department = query.filters.departmentId;
        }
        if (query.filters?.roleLevel) {
            filter.role_level = query.filters.roleLevel;
        }
        if (query.filters?.documentTypes && query.filters.documentTypes.length > 0) {
            filter.document_type = { $in: query.filters.documentTypes };
        }
        if (query.filters?.skillIds && query.filters.skillIds.length > 0) {
            filter.relevant_skill_ids = { $in: query.filters.skillIds };
        }
        return filter;
    }
    async enrichSourceChunks(vectorResults, tenantId) {
        // In production, this would fetch metadata from PostgreSQL
        return vectorResults.map((result) => ({
            documentId: result.metadata.document_id,
            documentTitle: result.metadata.document_title || 'Unknown',
            chunkIndex: result.metadata.chunk_index,
            content: result.text || result.metadata.content || '',
            relevanceScore: result.score,
            metadata: result.metadata,
        }));
    }
    buildRAGContext(sourceChunks) {
        if (sourceChunks.length === 0) {
            return '';
        }
        return sourceChunks
            .map((chunk) => `[Document: ${chunk.documentTitle}, Section ${chunk.chunkIndex}]\n${chunk.content}`)
            .join('\n\n---\n\n');
    }
    buildRAGPrompt(userQuery, context, contextType, sourceChunks) {
        const contextTypeGuidance = this.getContextTypeGuidance(contextType);
        const prompt = `
Context and Reference Material:
${context}

Question: ${userQuery}

${contextTypeGuidance}

IMPORTANT INSTRUCTIONS:
1. Answer based ONLY on the provided documents
2. If information is not in the documents, explicitly say "This information is not available in my knowledge base"
3. Always cite the document source when providing information
4. For complex topics, break down your answer into clear sections
5. Be specific and factual - avoid generalizations`;
        return prompt;
    }
    getContextTypeGuidance(contextType) {
        const guidance = {
            promotion_analysis: `Provide specific skill gap analysis based on the role requirements and assessment data provided.
        Focus on concrete gaps and recommendations for skill development.`,
            incident_simulation: `Provide guidance on how to handle the incident scenario based on company policies and procedures.
        Focus on best practices and decision-making criteria.`,
            skill_explanation: `Provide a comprehensive explanation of the skill, including:
        - Definition and importance
        - Key competencies
        - Development path
        - Real-world applications`,
            general_knowledge: `Provide helpful information about workforce topics while staying true to company documentation.`,
        };
        return guidance[contextType] || '';
    }
    calculateConfidenceScore(sourceChunks, retrievalCount) {
        if (sourceChunks.length === 0)
            return 0;
        const relevanceAverage = sourceChunks.reduce((sum, chunk) => sum + chunk.relevanceScore, 0) /
            sourceChunks.length;
        const retrievalScore = Math.min(retrievalCount / config_1.config.rag.topKResults, 1);
        // Weighted confidence score
        const confidenceScore = relevanceAverage * 0.7 + retrievalScore * 0.3;
        return Math.min(1, Math.max(0, confidenceScore));
    }
    checkHallucinationMitigation(answer, sourceChunks) {
        // Check for phrases indicating source grounding
        const groundingPhrases = [
            "according to",
            "based on",
            "as mentioned in",
            "the documents state",
            "from the knowledge base",
            "information is not available",
            "this is not covered",
        ];
        const answerLower = answer.toLowerCase();
        const hasGrounding = groundingPhrases.some((phrase) => answerLower.includes(phrase));
        // Check if answer appropriately handles missing information
        const acknowledgesMissingInfo = sourceChunks.length === 0 || hasGrounding;
        return acknowledgesMissingInfo;
    }
}
exports.RAGOrchestrationService = RAGOrchestrationService;
//# sourceMappingURL=rag-orchestration.js.map