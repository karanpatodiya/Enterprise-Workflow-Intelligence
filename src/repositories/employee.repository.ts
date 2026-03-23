import { db } from '../config/database';
import { Employee, EmployeeStatus, RoleLevel } from '../domain';

export class EmployeeRepository {
  async findById(employeeId: string, tenantId: string): Promise<Employee | null> {
    const result = await db.query(
      'SELECT * FROM employees WHERE id = $1 AND tenant_id = $2',
      [employeeId, tenantId]
    );
    return result.rows.length > 0 ? this.mapToEmployee(result.rows[0]) : null;
  }

  async findByEmail(email: string, tenantId: string): Promise<Employee | null> {
    const result = await db.query(
      'SELECT * FROM employees WHERE email = $1 AND tenant_id = $2',
      [email, tenantId]
    );
    return result.rows.length > 0 ? this.mapToEmployee(result.rows[0]) : null;
  }

  async findByDepartment(departmentId: string): Promise<Employee[]> {
    const result = await db.query(
      'SELECT * FROM employees WHERE department_id = $1 AND status = $2',
      [departmentId, 'active']
    );
    return result.rows.map((row) => this.mapToEmployee(row));
  }

  async findByTenant(tenantId: string, status?: EmployeeStatus): Promise<Employee[]> {
    let query = 'SELECT * FROM employees WHERE tenant_id = $1';
    const params: any[] = [tenantId];

    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }

    const result = await db.query(query, params);
    return result.rows.map((row) => this.mapToEmployee(row));
  }

  async findByRoleLevel(tenantId: string, roleLevel: RoleLevel): Promise<Employee[]> {
    const result = await db.query(
      'SELECT * FROM employees WHERE tenant_id = $1 AND role_level = $2 AND status = $3',
      [tenantId, roleLevel, 'active']
    );
    return result.rows.map((row) => this.mapToEmployee(row));
  }

  async findDirectReports(employeeId: string, tenantId: string): Promise<Employee[]> {
    const result = await db.query(
      'SELECT * FROM employees WHERE manager_employee_id = $1 AND tenant_id = $2 AND status = $3',
      [employeeId, tenantId, 'active']
    );
    return result.rows.map((row) => this.mapToEmployee(row));
  }

  async create(employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> {
    const result = await db.query(
      `INSERT INTO employees
       (tenant_id, department_id, email, first_name, last_name, current_role, role_level, manager_employee_id, status, hire_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        employee.tenantId,
        employee.departmentId,
        employee.email,
        employee.firstName,
        employee.lastName,
        employee.currentRole,
        employee.roleLevel,
        employee.managerEmployeeId,
        employee.status,
        employee.hireDate,
      ]
    );

    return this.mapToEmployee(result.rows[0]);
  }

  async update(employeeId: string, tenantId: string, updates: Partial<Employee>): Promise<Employee> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.currentRole) {
      fields.push(`current_role = $${paramIndex++}`);
      values.push(updates.currentRole);
    }
    if (updates.roleLevel) {
      fields.push(`role_level = $${paramIndex++}`);
      values.push(updates.roleLevel);
    }
    if (updates.status) {
      fields.push(`status = $${paramIndex++}`);
      values.push(updates.status);
    }
    if (updates.managerEmployeeId) {
      fields.push(`manager_employee_id = $${paramIndex++}`);
      values.push(updates.managerEmployeeId);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(employeeId, tenantId);

    const result = await db.query(
      `UPDATE employees SET ${fields.join(', ')}
       WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex}
       RETURNING *`,
      values
    );

    return this.mapToEmployee(result.rows[0]);
  }

  async delete(employeeId: string, tenantId: string): Promise<void> {
    await db.query(
      'UPDATE employees SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND tenant_id = $3',
      ['departed', employeeId, tenantId]
    );
  }

  private mapToEmployee(row: any): Employee {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      departmentId: row.department_id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      currentRole: row.current_role,
      roleLevel: row.role_level,
      managerEmployeeId: row.manager_employee_id,
      status: row.status,
      hireDate: row.hire_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
