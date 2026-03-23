"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RAGError = exports.TenantIsolationError = exports.ValidationError = void 0;
// Errors & Validation
class ValidationError extends Error {
    constructor(code, message, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class TenantIsolationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'TenantIsolationError';
    }
}
exports.TenantIsolationError = TenantIsolationError;
class RAGError extends Error {
    constructor(code, message, retryable = false) {
        super(message);
        this.code = code;
        this.retryable = retryable;
        this.name = 'RAGError';
    }
}
exports.RAGError = RAGError;
//# sourceMappingURL=index.js.map