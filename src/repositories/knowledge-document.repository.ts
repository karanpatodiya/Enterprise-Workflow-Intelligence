import { db } from '../config/database';
import { CompanyKnowledgeDocument, DocumentType } from '../domain';

export class KnowledgeDocumentRepository {
  async findById(documentId: string, tenantId: string): Promise<CompanyKnowledgeDocument | null> {
    const result = await db.query(
      'SELECT * FROM company_knowledge_documents WHERE id = $1 AND tenant_id = $2',
      [documentId, tenantId]
    );
    return result.rows.length > 0 ? this.mapToDocument(result.rows[0]) : null;
  }

  async findByTenant(tenantId: string): Promise<CompanyKnowledgeDocument[]> {
    const result = await db.query(
      'SELECT * FROM company_knowledge_documents WHERE tenant_id = $1 ORDER BY created_at DESC',
      [tenantId]
    );
    return result.rows.map((row) => this.mapToDocument(row));
  }

  async findByType(tenantId: string, type: DocumentType): Promise<CompanyKnowledgeDocument[]> {
    const result = await db.query(
      'SELECT * FROM company_knowledge_documents WHERE tenant_id = $1 AND type = $2 ORDER BY created_at DESC',
      [tenantId, type]
    );
    return result.rows.map((row) => this.mapToDocument(row));
  }

  async findIndexed(tenantId: string): Promise<CompanyKnowledgeDocument[]> {
    const result = await db.query(
      'SELECT * FROM company_knowledge_documents WHERE tenant_id = $1 AND is_indexed = true ORDER BY created_at DESC',
      [tenantId]
    );
    return result.rows.map((row) => this.mapToDocument(row));
  }

  async findByDepartment(departmentId: string): Promise<CompanyKnowledgeDocument[]> {
    const result = await db.query(
      'SELECT * FROM company_knowledge_documents WHERE department_id = $1 ORDER BY created_at DESC',
      [departmentId]
    );
    return result.rows.map((row) => this.mapToDocument(row));
  }

  async create(document: Omit<CompanyKnowledgeDocument, 'id' | 'createdAt' | 'updatedAt'>): Promise<CompanyKnowledgeDocument> {
    const dbResult = await db.query(
      `INSERT INTO company_knowledge_documents
       (tenant_id, department_id, title, description, type, original_file_path, file_type, file_size,
        uploaded_by, is_indexed, vector_store_id, version, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        document.tenantId,
        document.departmentId,
        document.title,
        document.description,
        document.type,
        document.originalFilePath,
        document.fileType,
        document.fileSize,
        document.uploadedBy,
        document.isIndexed,
        document.vectorStoreId,
        document.version,
        JSON.stringify(document.metadata),
      ]
    );

    return this.mapToDocument(dbResult.rows[0]);
  }

  async update(documentId: string, tenantId: string, updates: Partial<CompanyKnowledgeDocument>): Promise<CompanyKnowledgeDocument> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.title) {
      fields.push(`title = $${paramIndex++}`);
      values.push(updates.title);
    }
    if (updates.isIndexed !== undefined) {
      fields.push(`is_indexed = $${paramIndex++}`);
      values.push(updates.isIndexed);
    }
    if (updates.vectorStoreId) {
      fields.push(`vector_store_id = $${paramIndex++}`);
      values.push(updates.vectorStoreId);
    }
    if (updates.version) {
      fields.push(`version = $${paramIndex++}`);
      values.push(updates.version);
    }
    if (updates.metadata) {
      fields.push(`metadata = $${paramIndex++}`);
      values.push(JSON.stringify(updates.metadata));
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(documentId, tenantId);

    const result = await db.query(
      `UPDATE company_knowledge_documents SET ${fields.join(', ')}
       WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex}
       RETURNING *`,
      values
    );

    return this.mapToDocument(result.rows[0]);
  }

  async delete(documentId: string, tenantId: string): Promise<void> {
    await db.query(
      'DELETE FROM company_knowledge_documents WHERE id = $1 AND tenant_id = $2',
      [documentId, tenantId]
    );
  }

  private mapToDocument(row: any): CompanyKnowledgeDocument {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      departmentId: row.department_id,
      title: row.title,
      description: row.description,
      type: row.type,
      originalFilePath: row.original_file_path,
      fileType: row.file_type,
      fileSize: row.file_size,
      uploadedBy: row.uploaded_by,
      isIndexed: row.is_indexed,
      vectorStoreId: row.vector_store_id,
      version: row.version,
      metadata: JSON.parse(row.metadata || '{}'),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
