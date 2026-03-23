"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENTERPRISE_MATRIX = void 0;
exports.ENTERPRISE_MATRIX = [
    {
        slug: 'frontend-engineering',
        name: 'Frontend Engineering',
        description: 'Building responsive, accessible, and high-performance user interfaces and architectures.',
        role_type: 'technical',
        roles: [
            {
                slug: 'fe-junior',
                name: 'Junior Frontend Developer',
                level: 'Junior',
                description: 'Entry-level developer focused on building UI components and basic interactive features.',
                skills: [
                    { name: 'HTML & Semantic Web', expected_proficiency: 3 },
                    { name: 'CSS Fundamentals', expected_proficiency: 3 },
                    { name: 'JavaScript ES6+', expected_proficiency: 2 },
                    { name: 'React Basics', expected_proficiency: 2 },
                    { name: 'Responsive Design', expected_proficiency: 3 }
                ]
            },
            {
                slug: 'fe-senior',
                name: 'Senior Frontend Developer',
                level: 'Senior',
                description: 'Advanced developer architecting large-scale applications and optimizing performance.',
                skills: [
                    { name: 'Advanced JavaScript (Closures, Prototype)', expected_proficiency: 5 },
                    { name: 'React Architecture & State Management', expected_proficiency: 5 },
                    { name: 'Frontend Performance Optimization', expected_proficiency: 4 },
                    { name: 'Web Security (XSS, CSRF)', expected_proficiency: 4 },
                    { name: 'CI/CD for Frontend', expected_proficiency: 3 }
                ]
            },
            {
                slug: 'fe-architect',
                name: 'Frontend Architect',
                level: 'Architect',
                description: 'High-level visionary defining the technology stack, system design, and organization-wide guidelines.',
                skills: [
                    { name: 'Frontend System Design', expected_proficiency: 5 },
                    { name: 'Micro-frontends', expected_proficiency: 4 },
                    { name: 'Web Performance at Scale', expected_proficiency: 5 },
                    { name: 'Cross-functional Leadership', expected_proficiency: 4 }
                ]
            }
        ]
    },
    {
        slug: 'backend-engineering',
        name: 'Backend Engineering',
        description: 'Designing robust APIs, distributed systems, and highly scalable data architectures.',
        role_type: 'technical',
        roles: [
            {
                slug: 'be-developer',
                name: 'Backend Developer',
                level: 'Mid',
                description: 'Core backend engineer building RESTful APIs and writing optimized database queries.',
                skills: [
                    { name: 'API Design (REST)', expected_proficiency: 4 },
                    { name: 'Relational Database Design', expected_proficiency: 3 },
                    { name: 'Backend Frameworks (Node.js/Python)', expected_proficiency: 4 },
                    { name: 'Unit Testing', expected_proficiency: 3 }
                ]
            },
            {
                slug: 'be-senior',
                name: 'Senior Backend Developer',
                level: 'Senior',
                description: 'Senior engineer dealing with complex data workflows, caching, and scalability constraints.',
                skills: [
                    { name: 'Advanced Database Optimization', expected_proficiency: 5 },
                    { name: 'Caching Strategies (Redis/Memcached)', expected_proficiency: 4 },
                    { name: 'Distributed Systems', expected_proficiency: 3 },
                    { name: 'Message Queues (Kafka/RabbitMQ)', expected_proficiency: 3 },
                    { name: 'System Security', expected_proficiency: 4 }
                ]
            },
            {
                slug: 'be-architect',
                name: 'System Architect',
                level: 'Architect',
                description: 'Defines the global architecture, database sharding strategies, and multi-region deployments.',
                skills: [
                    { name: 'Microservices Architecture', expected_proficiency: 5 },
                    { name: 'High Availability & Fault Tolerance', expected_proficiency: 5 },
                    { name: 'Database Sharding & Partitioning', expected_proficiency: 5 },
                    { name: 'Cloud Infrastructure Design', expected_proficiency: 4 }
                ]
            }
        ]
    },
    {
        slug: 'qa',
        name: 'Quality Assurance (QA)',
        description: 'Ensuring product quality, performance, and reliability through rigorous testing methodologies.',
        role_type: 'technical',
        roles: [
            {
                slug: 'qa-manual',
                name: 'Manual QA Tester',
                level: 'Junior',
                description: 'Executes test plans and identifies defects in the software before release.',
                skills: [
                    { name: 'Test Case Design', expected_proficiency: 4 },
                    { name: 'Defect Tracking (Jira)', expected_proficiency: 4 },
                    { name: 'Exploratory Testing', expected_proficiency: 3 },
                    { name: 'Agile Methodology', expected_proficiency: 3 }
                ]
            },
            {
                slug: 'qa-automation',
                name: 'Automation Engineer',
                level: 'Mid-Senior',
                description: 'Builds automated test suites to ensure continuous integration without manual regression testing.',
                skills: [
                    { name: 'Test Frameworks (Cypress/Playwright)', expected_proficiency: 4 },
                    { name: 'Selenium/Appium', expected_proficiency: 3 },
                    { name: 'API Testing (Postman/REST Assured)', expected_proficiency: 4 },
                    { name: 'CI/CD Pipeline Integration', expected_proficiency: 3 }
                ]
            },
            {
                slug: 'qa-performance',
                name: 'Performance Tester',
                level: 'Senior',
                description: 'Specializes in load testing, stress testing, and identifying system bottlenecks.',
                skills: [
                    { name: 'Load Testing (JMeter/K6)', expected_proficiency: 5 },
                    { name: 'Performance Bottleneck Identification', expected_proficiency: 4 },
                    { name: 'System Monitoring (Datadog/NewRelic)', expected_proficiency: 3 }
                ]
            }
        ]
    },
    {
        slug: 'business-analysis',
        name: 'Business Analysis (BA)',
        description: 'Bridging the gap between IT and business by using data analytics to assess processes, determine requirements, and deliver data-driven recommendations.',
        role_type: 'business',
        roles: [
            {
                slug: 'ba-junior',
                name: 'Junior Business Analyst',
                level: 'Junior',
                description: 'Assists in gathering requirements and documenting basic business processes.',
                skills: [
                    { name: 'Requirements Gathering', expected_proficiency: 3 },
                    { name: 'Process Mapping', expected_proficiency: 3 },
                    { name: 'Basic SQL/Data Querying', expected_proficiency: 2 }
                ]
            },
            {
                slug: 'ba-senior',
                name: 'Senior Business Analyst',
                level: 'Senior',
                description: 'Translates complex business needs into actionable technical specifications and leads data mapping.',
                skills: [
                    { name: 'Advanced Requirements Engineering', expected_proficiency: 5 },
                    { name: 'Data Mapping & Transformation Rules', expected_proficiency: 4 },
                    { name: 'Stakeholder Negotiation', expected_proficiency: 5 },
                    { name: 'Agile Product Ownership', expected_proficiency: 4 }
                ]
            }
        ]
    },
    {
        slug: 'sales',
        name: 'Sales',
        description: 'Driving revenue, prospecting new enterprise clients, and managing critical accounts.',
        role_type: 'business',
        roles: [
            {
                slug: 'sales-executive',
                name: 'Sales Executive',
                level: 'Mid',
                description: 'Front-line sales representative managing a pipeline to close new business.',
                skills: [
                    { name: 'Lead Qualification', expected_proficiency: 4 },
                    { name: 'Cold Outreach & Prospecting', expected_proficiency: 4 },
                    { name: 'Negotiation', expected_proficiency: 3 },
                    { name: 'CRM Usage (Salesforce/Hubspot)', expected_proficiency: 4 }
                ]
            },
            {
                slug: 'sales-enterprise',
                name: 'Enterprise Sales Manager',
                level: 'Senior',
                description: 'Handles 7-figure deals, complex multi-stakeholder negotiations, and enterprise contracts.',
                skills: [
                    { name: 'Enterprise Closing', expected_proficiency: 5 },
                    { name: 'Complex Stakeholder Management', expected_proficiency: 5 },
                    { name: 'Advanced Negotiation & Contracts', expected_proficiency: 5 },
                    { name: 'Pipeline Management & Forecasting', expected_proficiency: 4 }
                ]
            }
        ]
    },
    {
        slug: 'hr',
        name: 'Human Resources (HR)',
        description: 'Managing the employee lifecycle, organizational development, and talent acquisition strategies.',
        role_type: 'business',
        roles: [
            {
                slug: 'hr-talent',
                name: 'Talent Acquisition Specialist',
                level: 'Mid',
                description: 'Sources, screens, and manages candidate pipelines for key organizational roles.',
                skills: [
                    { name: 'Sourcing Strategies', expected_proficiency: 4 },
                    { name: 'Behavioral Interviewing', expected_proficiency: 4 },
                    { name: 'Offer Negotiation', expected_proficiency: 3 },
                    { name: 'Employer Branding', expected_proficiency: 3 }
                ]
            },
            {
                slug: 'hr-partner',
                name: 'HR Business Partner',
                level: 'Senior',
                description: 'Strategic partner working directly with business unit leaders on organizational challenges.',
                skills: [
                    { name: 'Employee Relations', expected_proficiency: 5 },
                    { name: 'Organizational Design', expected_proficiency: 4 },
                    { name: 'Performance Management', expected_proficiency: 5 },
                    { name: 'Change Management', expected_proficiency: 4 }
                ]
            }
        ]
    }
];
//# sourceMappingURL=enterprise-matrix.js.map