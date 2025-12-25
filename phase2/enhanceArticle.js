require('dotenv').config();
const mysql = require('mysql2/promise');
const OpenAI = require('openai');

async function run() {
  // 1. Connect to MySQL
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  // 2. Fetch one base article (from Phase 1)
  const [rows] = await connection.execute(
    'SELECT id, title, content FROM articles WHERE is_generated = false LIMIT 1'
  );

  if (rows.length === 0) {
    console.log('No base article found');
    await connection.end();
    return;
  }

  const article = rows[0];

  console.log('\nBase article title:\n', article.title);
  console.log('Base article content length:', article.content.length);

  // 3. Simulated top Google-ranking reference articles
  const referenceArticles = [
    {
      title: 'How Chatbots Are Transforming Customer Support',
      content: `
Modern chatbot implementations focus on conversational flow, contextual understanding,
and seamless escalation to human agents. Well-ranked articles use clear headings,
short paragraphs, bullet points, and real-world examples to explain benefits and challenges.
`
    },
    {
      title: 'A Practical Guide to Using AI Chatbots in Business',
      content: `
High-performing chatbot articles today emphasize clarity, structured sections,
practical use cases, and concise explanations. Good formatting and logical flow
help improve readability and engagement.
`
    }
  ];

  // 4. Initialize OpenAI
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // 5. Build enhancement prompt
  const prompt = `
You are a professional content editor.

ORIGINAL ARTICLE:
Title: ${article.title}

${article.content}

REFERENCE ARTICLE 1:
${referenceArticles[0].content}

REFERENCE ARTICLE 2:
${referenceArticles[1].content}

TASK:
Rewrite and enhance the ORIGINAL ARTICLE so that:
- The structure is clearer and more readable
- Formatting is improved with headings and logical sections
- Tone is modern and professional
- Meaning remains the same
- Content is original (do not copy sentences)

Return only the enhanced article content.
`;

  // 6. Call LLM
let enhancedContent;

try {
  const aiResponse = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.4,
  });

  enhancedContent = aiResponse.choices[0].message.content;

} catch (error) {
  console.log('\n⚠️ LLM call failed due to quota limits.');
  console.log('Using simulated enhanced content for demonstration.\n');

  enhancedContent = `
${article.title}

Introduction
Chatbots have become an essential part of modern digital experiences.
This enhanced version improves clarity, structure, and readability
while preserving the original intent of the article.

Key Benefits of Chatbots
- Improved customer response time
- Consistent user experience
- Scalability for growing businesses

Best Practices
Well-structured chatbot implementations focus on clear conversational flow,
context awareness, and seamless human handoff when needed.

Conclusion
By adopting a structured approach and modern formatting, chatbot-related
content becomes easier to understand and more valuable for readers.
`;
}
    // 7. Output enhanced article preview

  console.log('\n--- Enhanced Article Preview ---\n');
  console.log(enhancedContent.substring(0, 1200));

  await connection.end();
}

run().catch(console.error);
