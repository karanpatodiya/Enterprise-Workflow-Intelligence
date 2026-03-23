import { CompanyKnowledgeDocument, DocumentType } from '../domain';
export declare class KnowledgeDocumentRepository {
    findById(documentId: string, tenantId: string): Promise<CompanyKnowledgeDocument | null>;
    findByTenant(tenantId: string): Promise<CompanyKnowledgeDocument[]>;
    findByType(tenantId: string, type: DocumentType): Promise<CompanyKnowledgeDocument[]>;
    findIndexed(tenantId: string): Promise<CompanyKnowledgeDocument[]>;
    findByDepartment(departmentId: string): Promise<CompanyKnowledgeDocument[]>;
    create(document: Omit<CompanyKnowledgeDocument, 'id' | 'createdAt' | 'updatedAt'>): Promise<CompanyKnowledgeDocument>;
    update(documentId: string, tenantId: string, updates: Partial<CompanyKnowledgeDocument>): Promise<CompanyKnowledgeDocument>;
    delete(documentId: string, tenantId: string): Promise<void>;
    private mapToDocument;
}
//# sourceMappingURL=knowledge-document.repository.d.ts.map