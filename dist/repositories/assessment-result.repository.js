"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentResultRepository = void 0;
const database_1 = require("../config/database");
class AssessmentResultRepository {
    async findById(resultId, tenantId) {
        const result = await database_1.db.query('SELECT * FROM employee_assessment_results WHERE id = $1 AND tenant_id = $2', [resultId, tenantId]);
        return result.rows.length > 0 ? this.mapToAssessmentResult(result.rows[0]) : null;
    }
    async findByEmployee(employeeId, tenantId) {
        const result = await database_1.db.query('SELECT * FROM employee_assessment_results WHERE employee_id = $1 AND tenant_id = $2 ORDER BY created_at DESC', [employeeId, tenantId]);
        return result.rows.map((row) => this.mapToAssessmentResult(row));
    }
    async findByAssessment(assessmentId) {
        const result = await database_1.db.query('SELECT * FROM employee_assessment_results WHERE assessment_id = $1 ORDER BY created_at DESC', [assessmentId]);
        return result.rows.map((row) => this.mapToAssessmentResult(row));
    }
    async findInProgress(employeeId) {
        const result = await database_1.db.query('SELECT * FROM employee_assessment_results WHERE employee_id = $1 AND status = $2 LIMIT 1', [employeeId, 'in-progress']);
        return result.rows.length > 0 ? this.mapToAssessmentResult(result.rows[0]) : null;
    }
    async findCompletedBySkill(employeeId, skillId) {
        const result = await database_1.db.query(`SELECT ear.* FROM employee_assessment_results ear
       JOIN assessments a ON ear.assessment_id = a.id
       WHERE ear.employee_id = $1 AND a.skill_id = $2 AND ear.status = $3
       ORDER BY ear.completed_at DESC`, [employeeId, skillId, 'completed']);
        return result.rows.map((row) => this.mapToAssessmentResult(row));
    }
    async create(result) {
        const dbResult = await database_1.db.query(`INSERT INTO employee_assessment_results
       (employee_id, assessment_id, tenant_id, started_at, completed_at, score, max_score, percentage_score,
        passed, completion_time_seconds, retry_count, answers, feedback_ai_generated, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`, [
            result.employeeId,
            result.assessmentId,
            result.tenantId,
            result.startedAt,
            result.completedAt,
            result.score,
            result.maxScore,
            result.percentageScore,
            result.passed,
            result.completionTimeSeconds,
            result.retryCount,
            JSON.stringify(result.answers),
            result.feedbackAIGenerated,
            result.status,
        ]);
        return this.mapToAssessmentResult(dbResult.rows[0]);
    }
    async update(resultId, tenantId, updates) {
        const fields = [];
        const values = [];
        let paramIndex = 1;
        if (updates.completedAt) {
            fields.push(`completed_at = $${paramIndex++}`);
            values.push(updates.completedAt);
        }
        if (updates.score !== undefined) {
            fields.push(`score = $${paramIndex++}`);
            values.push(updates.score);
        }
        if (updates.percentageScore !== undefined) {
            fields.push(`percentage_score = $${paramIndex++}`);
            values.push(updates.percentageScore);
        }
        if (updates.passed !== undefined) {
            fields.push(`passed = $${paramIndex++}`);
            values.push(updates.passed);
        }
        if (updates.completionTimeSeconds !== undefined) {
            fields.push(`completion_time_seconds = $${paramIndex++}`);
            values.push(updates.completionTimeSeconds);
        }
        if (updates.answers) {
            fields.push(`answers = $${paramIndex++}`);
            values.push(JSON.stringify(updates.answers));
        }
        if (updates.feedbackAIGenerated) {
            fields.push(`feedback_ai_generated = $${paramIndex++}`);
            values.push(updates.feedbackAIGenerated);
        }
        if (updates.status) {
            fields.push(`status = $${paramIndex++}`);
            values.push(updates.status);
        }
        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(resultId, tenantId);
        const result = await database_1.db.query(`UPDATE employee_assessment_results SET ${fields.join(', ')}
       WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex}
       RETURNING *`, values);
        return this.mapToAssessmentResult(result.rows[0]);
    }
    async getAggregateStats(skillId, tenantId) {
        const result = await database_1.db.query(`SELECT
        COUNT(*) as total_attempts,
        SUM(CASE WHEN passed = true THEN 1 ELSE 0 END) as passed_count,
        SUM(CASE WHEN passed = false THEN 1 ELSE 0 END) as failed_count,
        AVG(percentage_score) as avg_score,
        MAX(percentage_score) as max_score,
        MIN(percentage_score) as min_score
       FROM employee_assessment_results ear
       JOIN assessments a ON ear.assessment_id = a.id
       WHERE a.skill_id = $1 AND ear.tenant_id = $2`, [skillId, tenantId]);
        return result.rows[0];
    }
    mapToAssessmentResult(row) {
        return {
            id: row.id,
            employeeId: row.employee_id,
            assessmentId: row.assessment_id,
            tenantId: row.tenant_id,
            startedAt: row.started_at,
            completedAt: row.completed_at,
            score: row.score,
            maxScore: row.max_score,
            percentageScore: row.percentage_score,
            passed: row.passed,
            completionTimeSeconds: row.completion_time_seconds,
            retryCount: row.retry_count,
            answers: JSON.parse(row.answers || '[]'),
            feedbackAIGenerated: row.feedback_ai_generated,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
}
exports.AssessmentResultRepository = AssessmentResultRepository;
//# sourceMappingURL=assessment-result.repository.js.map