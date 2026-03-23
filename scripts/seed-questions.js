/**
 * seed-questions.js
 * Populates the question_bank table with high-quality, multi-format professional questions.
 * Supports: MCQ, Scenario, Debug, ShortAnswer, CaseStudy, Ranking.
 * Run with: node scripts/seed-questions.js
 */
const { Client } = require('pg');

const DB = 'postgresql://workforce:securepassword@localhost:5432/workforce_intelligence';

// ─── Question Definitions ────────────────────────────────────────────────────
const QUESTIONS_BY_ROLE = {
  'fe-junior': [
    { 
      type: 'MCQ',
      skill:'HTML & Semantic Web', 
      difficulty:'beginner', 
      q:'Which HTML element is the most semantically appropriate for the main navigation menu of a website?', 
      options: { A: '<nav>', B: '<div id="menu">', C: '<ul class="nav">', D: '<header>' },
      correct:'A',
      exp:'The <nav> element specifically represents a section of navigation links per HTML5 semantics.' 
    },
    {
      type: 'Debug',
      skill: 'CSS Fundamentals',
      difficulty: 'intermediate',
      q: 'A developer reports that a child element with "position: absolute" is appearing at the top-left of the entire page instead of inside its parent container. Explain what is missing from the parent element and why.',
      guidance: 'Should mention that horizontal/vertical positioning is relative to the nearest "positioned" ancestor. The parent needs "position: relative" (or absolute/fixed) to become the containing block.'
    },
    {
      type: 'ShortAnswer',
      skill: 'JavaScript ES6+',
      difficulty: 'beginner',
      q: 'Explain the concept of "hoisting" in JavaScript and how "let" and "const" behave differently than "var" during this phase.',
      guidance: 'Should explain that hoisting moves declarations to the top. var is initialized as undefined, while let/const are in a Temporal Dead Zone and throw ReferenceError if accessed before declaration.'
    },
    {
      type: 'Scenario',
      skill: 'React Basics',
      difficulty: 'intermediate',
      q: 'You are building a search bar component that fetches results from an API as the user types. The current implementation triggers a network request on every single keystroke, causing lag. How do you optimize this?',
      guidance: 'Should suggest "debouncing" the input. Explain using a timer (setTimeout) within useEffect to delay the API call until the user stops typing for a few hundred milliseconds.'
    }
  ],
  'fe-senior': [
    {
      type: 'Debug',
      skill: 'React Architecture',
      difficulty: 'advanced',
      q: 'Your application has a deep component tree. A high-level state change is causing every single component in the tree to re-render, even those that don\'t use that state. Identify two React features you could use to prevent these unnecessary re-renders.',
      guidance: 'Should identify "React.memo" for components, "useMemo" for expensive values, "useCallback" for stable function props, or moving state closer to where it\'s used.'
    },
    {
      type: 'CaseStudy',
      skill: 'Frontend Performance',
      difficulty: 'advanced',
      q: 'A large e-commerce dashboard takes 6 seconds to become interactive. The main bundle is 2.5MB. Total blocking time is high due to a heavy data visualization library. Propose a phased performance optimization strategy.',
      guidance: 'Should include: Route-based code splitting, dynamic imports for the heavy viz library, image optimization/lazy loading, minimizing third-party scripts, and implement core web vitals monitoring.'
    },
    {
      type: 'Scenario',
      skill: 'Web Security',
      difficulty: 'advanced',
      q: 'You discover that a legacy parts of the application is vulnerable to Cross-Site Scripting (XSS) because it uses "dangerouslySetInnerHTML" with unsanitized user comments. Describe the immediate fix and a long-term architectural prevention measure.',
      guidance: 'Immediate: Sanitize HTML using a library like DOMPurify. Long-term: Implement a strict Content Security Policy (CSP) and move away from direct raw HTML rendering if possible.'
    }
  ],
  'be-senior': [
    {
      type: 'Scenario',
      skill: 'Distributed Systems',
      difficulty: 'advanced',
      q: 'Your microservices architecture is experiencing "cascading failures": when the Payment Service slows down, the Order Service and API Gateway eventually crash because all their worker threads are waiting for Payment responses. How do you implement resilience?',
      guidance: 'Should describe the "Circuit Breaker" pattern. Explain how it detects failures, opens to fail fast, and allows periodic half-open probes to recover. Mention setting sensible timeouts.'
    },
    {
      type: 'Debug',
      skill: 'Database Optimization',
      difficulty: 'advanced',
      q: 'A critical SQL query is taking 15 seconds to run on a 10M row table. The EXPLAIN plan indicates a Parallel Seq Scan is being used despite an index existing on the filter column. What could be the reason, and how would you fix it?',
      guidance: 'Should suggest checking selectivity (too many rows match), outdated statistics (need ANALYZE), or if a function is being applied to the column in the WHERE clause preventing index usage.'
    },
    {
      type: 'CaseStudy',
      skill: 'API Design',
      difficulty: 'advanced',
      q: 'You are designing a public webhook system for thousands of customers. How do you ensure it is reliable (doesn\'t lose messages), secure (prevents spoofing), and prevents overwhelming customer endpoints?',
      guidance: 'Reliability: Persist in Message Queue (Kafka/SQK) with retries/exponential backoff. Security: Signed payloads (HMAC). Concurrency: Rate limiting per customer and per-recipient circuit breaking.'
    }
  ],
  'sales-executive': [
    {
      type: 'Scenario',
      skill: 'Negotiation',
      difficulty: 'intermediate',
      q: 'A prospect loves your solution but insists on a 40% discount to sign by the end of the quarter. Your maximum approved discount is 15%. How do you handle this without losing the deal or devaluing the product?',
      guidance: 'Should focus on "value-based" negotiation. Ask what specific budget constraints they have. Propose trading scope (fewer seats/features) for the lower price, or extending the contract term for better terms.'
    },
    {
      type: 'Ranking',
      skill: 'Lead Qualification',
      difficulty: 'intermediate',
      q: 'Rank these leads in order of priority (1 = highest) based on the BANT framework:',
      options: {
        '1': 'Prospect has a failed current solution, $500k budget, but the CFO hasn\'t been involved yet.',
        '2': 'Low-level analyst researching for 2026, no budget allocated.',
        '3': 'VP has $200k ready, needs a solution in 30 days to meet compliance deadline.',
        '4': 'Director has high interest, but says "budget is tight this year, maybe next quarter".'
      },
      correct: '3,1,4,2',
      guidance: '1st is the VP with budget AND immediate timeline (30 days). 2nd is the $500k budget with immediate need but higher authority risk. 3rd is the "tight budget" Director. 4th is the research-only analyst with no budget/timeline.'
    }
  ],
  'hr-partner': [
    {
      type: 'CaseStudy',
      skill: 'Change Management',
      difficulty: 'advanced',
      q: 'The company is moving from "Remote-First" to a "Hybrid 3-days in office" model. A group of top-performing senior engineers is threatening to quit. Develop a communication and retention strategy for this transition.',
      guidance: 'Should emphasize transparency (the "why"), offering flexibility (choosing days), individual consultations with key talent, and potentially grandfathering in extreme cases for essential performers.'
    },
    {
      type: 'Scenario',
      skill: 'Employee Relations',
      difficulty: 'advanced',
      q: 'A manager reports that a high-performing employee has suddenly become withdrawn and performance has dropped. The manager wants to put them on a PIP immediately. What is your advice?',
      guidance: 'Should advise against an immediate PIP. Suggest a confidential "check-in" first to see if external factors (health/personal) are involved. Coaching/support should precede formal performance plans for high performers.'
    }
  ]
};

// ─── Seed Runner ─────────────────────────────────────────────────────────────
async function seed() {
  const client = new Client({ connectionString: DB });
  try {
    await client.connect();
    console.log('Connected to DB\n');

    let inserted = 0;
    let skipped = 0;

    for (const [roleSlug, questions] of Object.entries(QUESTIONS_BY_ROLE)) {
      // Look up the role UUID and name
      const roleRes = await client.query(
        'SELECT r.id, r.name, c.name as category_name FROM platform_roles r JOIN platform_categories c ON r.category_id = c.id WHERE r.slug = $1', [roleSlug]
      );
      
      if (roleRes.rowCount === 0) {
        console.warn(`  [SKIP] Role not found: ${roleSlug}`);
        continue;
      }
      
      const { id: roleId, name: roleName, category_name: categoryName } = roleRes.rows[0];
      console.log(`Seeding ${questions.length} questions for ${roleSlug} (${roleName})...`);

      for (const q of questions) {
        const existing = await client.query(
          'SELECT id FROM question_bank WHERE role_id = $1 AND question_text = $2',
          [roleId, q.q]
        );
        
        if (existing.rowCount > 0) {
          skipped++;
          continue;
        }

        await client.query(
          `INSERT INTO question_bank (
            role_id, 
            skill_tag, 
            experience_level, 
            question_text, 
            options, 
            correct_answer, 
            explanation, 
            question_type, 
            difficulty, 
            category, 
            role_name, 
            answer_guidance
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
          [
            roleId, 
            q.skill, 
            q.difficulty, 
            q.q,
            q.options ? JSON.stringify(q.options) : null,
            q.correct || null, 
            q.exp || null,
            q.type || 'MCQ',
            q.difficulty || 'intermediate',
            categoryName,
            roleName,
            q.guidance || null
          ]
        );
        inserted++;
      }
    }

    console.log(`\nDone! Inserted: ${inserted}, Skipped (already existed): ${skipped}`);
  } catch (error) {
    console.error('Seed error:', error.message);
  } finally {
    await client.end();
  }
}

seed().catch(e => { console.error(e.message); process.exit(1); });
