import { Employee, EmployeeStatus, RoleLevel } from '../domain';
export declare class EmployeeRepository {
    findById(employeeId: string, tenantId: string): Promise<Employee | null>;
    findByEmail(email: string, tenantId: string): Promise<Employee | null>;
    findByDepartment(departmentId: string): Promise<Employee[]>;
    findByTenant(tenantId: string, status?: EmployeeStatus): Promise<Employee[]>;
    findByRoleLevel(tenantId: string, roleLevel: RoleLevel): Promise<Employee[]>;
    findDirectReports(employeeId: string, tenantId: string): Promise<Employee[]>;
    create(employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee>;
    update(employeeId: string, tenantId: string, updates: Partial<Employee>): Promise<Employee>;
    delete(employeeId: string, tenantId: string): Promise<void>;
    private mapToEmployee;
}
//# sourceMappingURL=employee.repository.d.ts.map