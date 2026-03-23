"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRandomMCQs = exports.getCategoryById = exports.getAllCategories = exports.skillCategories = void 0;
exports.skillCategories = {
    'sql-databases': {
        id: 'sql-databases',
        name: 'SQL & Databases',
        description: 'Relational database design, query optimization, and advanced SQL techniques.',
        questions: [
            {
                id: 'sql-1',
                subskill: 'Query Optimization',
                question_text: 'You have a query performing a sequential scan on a 50GB table because of a sequential scan on an unindexed column used in the WHERE clause. Adding a standard B-tree index reduces the query time completely. Why might you still reconsider adding this index?',
                options: {
                    A: 'B-tree indexes cannot handle equality comparisons.',
                    B: 'The index will significantly slow down INSERT, UPDATE, and DELETE operations, taking up additional storage space.',
                    C: 'B-tree indexes only work for partial matches.',
                    D: 'The table is too small to justify an index.'
                },
                correct_answer: 'B',
                explanation: 'Indexes trade write performance and storage space for read performance. They must be updated during write operations, impacting DML performance.'
            },
            {
                id: 'sql-2',
                subskill: 'Advanced SQL',
                question_text: 'What is the primary purpose of a SQL Window Function?',
                options: {
                    A: 'To group rows together and return a single aggregated result per group, hiding the individual rows.',
                    B: 'To execute calculations across a set of table rows that are somehow related to the current row, without grouping them into a single output row.',
                    C: 'To dynamically create new tables during runtime.',
                    D: 'To pivot table columns into rows.'
                },
                correct_answer: 'B',
                explanation: 'Window functions perform calculations across a set of rows related to the current row without collapsing the result set.'
            },
            {
                id: 'sql-3',
                subskill: 'Joins & Aggregations',
                question_text: 'In PostgreSQL, which join will keep all rows from the left table and the right table, filling in NULLs where no match exists on either side?',
                options: {
                    A: 'LEFT OUTER JOIN',
                    B: 'RIGHT OUTER JOIN',
                    C: 'FULL OUTER JOIN',
                    D: 'CROSS JOIN'
                },
                correct_answer: 'C',
                explanation: 'A FULL OUTER JOIN returns all rows from both tables, joining them where they match, and filling gaps with NULLs.'
            },
            {
                id: 'sql-4',
                subskill: 'Database Design',
                question_text: 'A scenario requires storing JSON payloads that have unpredictable keys, but you need to efficiently query specific internal JSON attributes. Which PostgreSQL concept is best suited?',
                options: {
                    A: 'Storing it as TEXT and using LIKE operators.',
                    B: 'Using the JSONB data type and creating a GIN index on the column.',
                    C: 'Normalizing every possible JSON key into its own relational column.',
                    D: 'Using a BLOB type.'
                },
                correct_answer: 'B',
                explanation: 'JSONB allows efficient storage of unstructured JSON data natively in PostgreSQL, and GIN indexes provide rapid query performance on its attributes.'
            }
        ],
        resources: {
            'Query Optimization': [
                { title: 'PostgreSQL Indexes', url: 'https://www.postgresql.org/docs/current/indexes.html', type: 'documentation', time: '1 hour' },
                { title: 'Use The Index, Luke!', url: 'https://use-the-index-luke.com/', type: 'tutorial', time: '3 hours' }
            ],
            'Advanced SQL': [
                { title: 'Window Functions Tutorial', url: 'https://mode.com/sql-tutorial/sql-window-functions/', type: 'tutorial', time: '2 hours' },
                { title: 'PostgreSQL Window Functions', url: 'https://www.postgresql.org/docs/current/tutorial-window.html', type: 'documentation', time: '30 mins' }
            ],
            'Joins & Aggregations': [
                { title: 'SQL Joins Explained', url: 'https://www.freecodecamp.org/news/sql-joins-tutorial/', type: 'tutorial', time: '1 hour' }
            ],
            'Database Design': [
                { title: 'JSONB in PostgreSQL', url: 'https://www.postgresql.org/docs/current/datatype-json.html', type: 'documentation', time: '45 mins' }
            ]
        }
    },
    'python': {
        id: 'python',
        name: 'Python',
        description: 'Advanced Python programming, data structures, and idiomatic practices.',
        questions: [
            {
                id: 'py-1',
                subskill: 'Concurrency & Async',
                question_text: 'When is it more appropriate to use `asyncio` instead of `multiprocessing` in Python?',
                options: {
                    A: 'When the application is bound by heavy CPU calculations (e.g., matrix math).',
                    B: 'When the application is purely I/O-bound (e.g., making hundreds of network requests).',
                    C: 'When you need to bypass the Global Interpreter Lock (GIL) for parallel CPU execution.',
                    D: 'When memory availability is completely unrestricted.'
                },
                correct_answer: 'B',
                explanation: 'Asyncio is ideal for I/O bound tasks because it handles concurrency asynchronously without the heavy overhead of multiprocessing. The GIL prevents threading/asyncio from achieving true parallel CPU execution.'
            },
            {
                id: 'py-2',
                subskill: 'Memory Management',
                question_text: 'What happens when you use a mutable default argument in a Python function, like `def add_item(item, lst=[]):`?',
                options: {
                    A: 'The list is newly instantiated every time the function is called.',
                    B: 'A syntax error occurs during interpretation.',
                    C: 'The same list object is shared across all function calls, leading to cumulative additions.',
                    D: 'The list is garbage collected immediately upon function exit.'
                },
                correct_answer: 'C',
                explanation: 'Default arguments are evaluated only once when the function is defined. A mutable default like a list will retain its state across subsequent calls.'
            },
            {
                id: 'py-3',
                subskill: 'Data Structures',
                question_text: 'Which Python collection provides O(1) average time complexity for both lookups and insertions?',
                options: {
                    A: 'list',
                    B: 'tuple',
                    C: 'dict',
                    D: 'collections.deque'
                },
                correct_answer: 'C',
                explanation: 'Dictionaries (and sets) in Python are implemented as hash tables, providing O(1) average time complexity for lookups, insertions, and deletions.'
            },
            {
                id: 'py-4',
                subskill: 'Design Patterns',
                question_text: 'What is the main purpose of a Python decorator?',
                options: {
                    A: 'To transform XML into a Python object.',
                    B: 'To dynamically modify or extend the behavior of a function or class without permanently modifying it.',
                    C: 'To style the terminal output using ANSI escape codes.',
                    D: 'To forcefully override the garbage collector.'
                },
                correct_answer: 'B',
                explanation: 'Decorators wrap a function, modifying its behavior before or after execution (e.g., logging, caching) without altering its source code.'
            }
        ],
        resources: {
            'Concurrency & Async': [
                { title: 'Async IO in Python', url: 'https://realpython.com/async-io-python/', type: 'tutorial', time: '2 hours' },
                { title: 'Python multiprocessing docs', url: 'https://docs.python.org/3/library/multiprocessing.html', type: 'documentation', time: '1 hour' }
            ],
            'Memory Management': [
                { title: 'Python Memory Management', url: 'https://realpython.com/python-memory-management/', type: 'tutorial', time: '1 hour' }
            ],
            'Data Structures': [
                { title: 'Time Complexity of Python Collections', url: 'https://wiki.python.org/moin/TimeComplexity', type: 'documentation', time: '30 mins' }
            ],
            'Design Patterns': [
                { title: 'Primer on Python Decorators', url: 'https://realpython.com/primer-on-python-decorators/', type: 'tutorial', time: '2 hours' }
            ]
        }
    },
    'system-design': {
        id: 'system-design',
        name: 'System Design',
        description: 'Architecting scalable, highly-available, and performant backend systems.',
        questions: [
            {
                id: 'sd-1',
                subskill: 'Scalability',
                question_text: 'A monolithic web application is starting to fail during daily traffic spikes. Which of the following is an example of horizontal scaling?',
                options: {
                    A: 'Upgrading the server from 16GB RAM to 64GB RAM.',
                    B: 'Migrating the database from MySQL to PostgreSQL.',
                    C: 'Adding more server instances behind a load balancer.',
                    D: 'Optimizing the frontend JavaScript bundle.'
                },
                correct_answer: 'C',
                explanation: 'Horizontal scaling (scaling out) involves adding more machines to the resource pool, whereas vertical scaling (scaling up) involves adding more power to an existing machine.'
            },
            {
                id: 'sd-2',
                subskill: 'Data Management',
                question_text: 'You are designing a system that requires extremely fast read access to frequently requested, mostly static data (like user profiles). What is the best pattern?',
                options: {
                    A: 'Implement an in-memory caching layer (like Redis or Memcached).',
                    B: 'Query the primary relational database but increase the connection pool.',
                    C: 'Store the data directly in the application server filesystem.',
                    D: 'Use an event streaming platform (like Kafka).'
                },
                correct_answer: 'A',
                explanation: 'In-memory caches securely store key-value data in RAM, offering sub-millisecond read latencies ideal for frequently accessed data.'
            },
            {
                id: 'sd-3',
                subskill: 'Microservices',
                question_text: 'In a microservice architecture, how do you handle a scenario where Service A calls Service B, but Service B is completely unresponsive, to prevent Service A from crashing?',
                options: {
                    A: 'Use a reverse proxy.',
                    B: 'Implement the Circuit Breaker pattern.',
                    C: 'Increase the timeout length to 5 minutes.',
                    D: 'Use a single shared monolithic database.'
                },
                correct_answer: 'B',
                explanation: 'The Circuit Breaker pattern temporarily halts calls to a failing service, allowing it to recover and preventing cascading failures across the system.'
            },
            {
                id: 'sd-4',
                subskill: 'Database Sharding',
                question_text: 'What is the primary trade-off of using a sharded database architecture?',
                options: {
                    A: 'It makes all read queries infinitely faster with no downsides.',
                    B: 'It reduces storage costs by compressing data.',
                    C: 'It increases complexity, especially for queries that need to join data across multiple shards.',
                    D: 'It requires migrating entirely to NoSQL solutions.'
                },
                correct_answer: 'C',
                explanation: 'Sharding distributes data horizontally. While it scales writes and storage, performing cross-shard joins or aggregations is heavily penalized or impossible natively.'
            }
        ],
        resources: {
            'Scalability': [
                { title: 'System Design Primer: Scalability', url: 'https://github.com/donnemartin/system-design-primer', type: 'course', time: '10 hours' }
            ],
            'Data Management': [
                { title: 'Caching Strategies', url: 'https://aws.amazon.com/caching/best-practices/', type: 'tutorial', time: '1 hour' }
            ],
            'Microservices': [
                { title: 'Circuit Breaker Pattern', url: 'https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker', type: 'documentation', time: '45 mins' }
            ],
            'Database Sharding': [
                { title: 'Understanding Database Sharding', url: 'https://www.digitalocean.com/community/tutorials/understanding-database-sharding', type: 'tutorial', time: '1 hour' }
            ]
        }
    },
    'frontend-development': {
        id: 'frontend-development',
        name: 'Frontend Development',
        description: 'Building responsive, accessible, and performant user interfaces.',
        questions: [
            {
                id: 'fe-1',
                subskill: 'Performance',
                question_text: 'If a React application renders a large list and causes massive frame drops, what is the standard strategy to fix this?',
                options: {
                    A: 'Use CSS `display: hidden` for list items not in view.',
                    B: 'Implement list virtualization (windowing) to only render visible items to the DOM.',
                    C: 'Convert the entire application to Vanilla JS.',
                    D: 'Use `setTimeout` to delay rendering every element.'
                },
                correct_answer: 'B',
                explanation: 'Virtualization massively reduces the DOM node count by only rendering rows currently visible in the viewport, solving memory and layout thrashing issues.'
            },
            {
                id: 'fe-2',
                subskill: 'State Management',
                question_text: 'Which hook should be used in React to preserve a value across renders WITHOUT triggering a re-render when the value changes?',
                options: {
                    A: 'useState',
                    B: 'useEffect',
                    C: 'useMemo',
                    D: 'useRef'
                },
                correct_answer: 'D',
                explanation: 'useRef returns a mutable ref object whose .current property is initialized to the passed argument. Mutating it does not trigger a re-render.'
            },
            {
                id: 'fe-3',
                subskill: 'CSS & Layout',
                question_text: 'How does CSS Grid differ primarily from Flexbox?',
                options: {
                    A: 'Grid is meant for one-dimensional layouts, Flexbox is for two-dimensional layouts.',
                    B: 'Grid is exclusively for text, Flexbox is for images.',
                    C: 'Grid is meant for two-dimensional layouts (rows and columns), whereas Flexbox excels primarily in one-dimensional layouts.',
                    D: 'Grid requires JavaScript to calculate columns, Flexbox is native.'
                },
                correct_answer: 'C',
                explanation: 'Flexbox aligns items along a single axis (row or column), while CSS grid allows explicit alignment on both axes simultaneously.'
            },
            {
                id: 'fe-4',
                subskill: 'Browser APIs',
                question_text: 'Which Web API is used to persistently store key-value string data that does not expire when the browser is closed?',
                options: {
                    A: 'sessionStorage',
                    B: 'localStorage',
                    C: 'Cookies',
                    D: 'Service Workers'
                },
                correct_answer: 'B',
                explanation: 'localStorage persists data indefinitely across browser sessions, unlike sessionStorage which clears when the tab/window is closed.'
            }
        ],
        resources: {
            'Performance': [
                { title: 'React Windowing/Virtualization', url: 'https://react.dev/learn/rendering-lists', type: 'documentation', time: '1 hour' }
            ],
            'State Management': [
                { title: 'React Hooks API Reference', url: 'https://react.dev/reference/react/useRef', type: 'documentation', time: '30 mins' }
            ],
            'CSS & Layout': [
                { title: 'A Complete Guide to Grid', url: 'https://css-tricks.com/snippets/css/complete-guide-grid/', type: 'tutorial', time: '1 hour' }
            ],
            'Browser APIs': [
                { title: 'Web Storage API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API', type: 'documentation', time: '30 mins' }
            ]
        }
    }
};
const getAllCategories = () => Object.values(exports.skillCategories);
exports.getAllCategories = getAllCategories;
const getCategoryById = (id) => exports.skillCategories[id];
exports.getCategoryById = getCategoryById;
const getRandomMCQs = (categoryId, count = 3) => {
    const category = exports.skillCategories[categoryId];
    if (!category)
        return [];
    const shuffled = [...category.questions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};
exports.getRandomMCQs = getRandomMCQs;
//# sourceMappingURL=skill-content.js.map