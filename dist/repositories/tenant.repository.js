"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantRepository = void 0;
const database_1 = require("../config/database");
class TenantRepository {
    async findById(tenantId) {
        const result = await database_1.db.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
        return result.rows.length > 0 ? this.mapToTenant(result.rows[0]) : null;
    }
    async findBySlug(slug) {
        const result = await database_1.db.query('SELECT * FROM tenants WHERE slug = $1', [slug]);
        return result.rows.length > 0 ? this.mapToTenant(result.rows[0]) : null;
    }
    async findAll(isActive) {
        let query = 'SELECT * FROM tenants';
        const params = [];
        if (isActive !== undefined) {
            query += ' WHERE is_active = $1';
            params.push(isActive);
        }
        const result = await database_1.db.query(query, params);
        return result.rows.map((row) => this.mapToTenant(row));
    }
    async create(tenant) {
        const result = await database_1.db.query(`INSERT INTO tenants (name, slug, industry, size, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`, [tenant.name, tenant.slug, tenant.industry, tenant.size, tenant.isActive]);
        return this.mapToTenant(result.rows[0]);
    }
    async update(id, updates) {
        const fields = [];
        const values = [];
        let paramIndex = 1;
        if (updates.name) {
            fields.push(`name = $${paramIndex++}`);
            values.push(updates.name);
        }
        if (updates.industry) {
            fields.push(`industry = $${paramIndex++}`);
            values.push(updates.industry);
        }
        if (updates.size) {
            fields.push(`size = $${paramIndex++}`);
            values.push(updates.size);
        }
        if (updates.isActive !== undefined) {
            fields.push(`is_active = $${paramIndex++}`);
            values.push(updates.isActive);
        }
        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);
        const result = await database_1.db.query(`UPDATE tenants SET ${fields.join(', ')} WHERE id = $${paramIndex}
       RETURNING *`, values);
        return this.mapToTenant(result.rows[0]);
    }
    mapToTenant(row) {
        return {
            id: row.id,
            name: row.name,
            slug: row.slug,
            industry: row.industry,
            size: row.size,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            isActive: row.is_active,
        };
    }
}
exports.TenantRepository = TenantRepository;
//# sourceMappingURL=tenant.repository.js.map