require("dotenv").config();
const mysql = require("mysql2/promise");
const OpenAI = require("openai");

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const [rows] = await connection.execute(`
    SELECT * FROM articles a
    WHERE a.is_generated = 0
    AND NOT EXISTS (
      SELECT 1 FROM articles b
      WHERE b.is_generated = 1
      AND b.title = a.title
    )
    LIMIT 1
  `);

  if (!rows.length) {
    console.log("No article left to enhance");
    await connection.end();
    return;
  }

  const article = rows[0];
  console.log("Enhancing with LLM:", article.title);

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
  });

  const prompt = `
You are a senior content editor and SEO writer.

Your task is to STRONGLY enhance the article below.

Rules:
- You MUST restructure the article
- You MUST add clear section headings
- You MUST break long paragraphs into shorter ones
- You MUST use bullet points where helpful
- You MUST improve flow and readability
- You MUST NOT keep the same paragraph structure
- Do NOT copy sentences verbatim
- Do NOT shorten the article drastically

Return ONLY the rewritten article content.
Do NOT explain what you changed.

ORIGINAL ARTICLE:
${article.content}
`;


  let enhancedContent;

  try {
    const response = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
    });

    enhancedContent = response.choices[0].message.content;
  } catch (err) {
    console.error("LLM failed:", err.message);
    enhancedContent = article.content;
  }

  await connection.execute(
    `
    INSERT INTO articles (title, content, source_url, is_generated, created_at, updated_at)
    VALUES (?, ?, NULL, 1, NOW(), NOW())
    `,
    [article.title, enhancedContent]
  );

  console.log("Enhanced article saved");
  await connection.end();
}

run().catch(console.error);
