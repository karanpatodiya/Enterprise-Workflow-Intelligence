import { Tenant } from '../domain';
export declare class TenantRepository {
    findById(tenantId: string): Promise<Tenant | null>;
    findBySlug(slug: string): Promise<Tenant | null>;
    findAll(isActive?: boolean): Promise<Tenant[]>;
    create(tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tenant>;
    update(id: string, updates: Partial<Tenant>): Promise<Tenant>;
    private mapToTenant;
}
//# sourceMappingURL=tenant.repository.d.ts.map