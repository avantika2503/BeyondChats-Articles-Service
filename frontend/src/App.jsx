import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

function App() {
  const [articles, setArticles] = useState([]);
  const [generatedArticles, setGeneratedArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/articles")
      .then((res) => res.json())
      .then((data) => {
        const originals = data.filter((a) => a.is_generated === 0);

        const enhancedMap = {};
        data
          .filter((a) => a.is_generated === 1)
          .forEach((a) => {
            enhancedMap[a.title] = a;
          });

        setArticles(originals);
        setGeneratedArticles(enhancedMap);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p style={{ padding: 20 }}>Loading articles...</p>;
  }

  return (
    <div
      style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "40px 24px",
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      <h1
        style={{
          fontSize: "40px",
          marginBottom: "32px",
        }}
      >
        BeyondChats Articles
      </h1>

      <Section
        title="Articles"
        articles={articles}
        enhancedMap={generatedArticles}
      />
    </div>
  );
}

function Section({ title, articles, enhancedMap }) {
  return (
    <section style={{ marginTop: "40px" }}>
      <h2>{title}</h2>

      {articles.length === 0 && <p>No articles found.</p>}

      {articles.map((article) => (
        <ArticleCard
          key={article.id}
          article={article}
          enhanced={enhancedMap[article.title]}
        />
      ))}
    </section>
  );
}

function ArticleCard({ article, enhanced }) {
  const [showFull, setShowFull] = useState(false);
  const [showEnhanced, setShowEnhanced] = useState(false);

  const activeContent =
    showEnhanced && enhanced ? enhanced.content : article.content;

  const displayText = showFull
    ? activeContent
    : activeContent.substring(0, 300);

  return (
    <div style={cardStyle}>
      <h3
        style={{
          fontSize: "22px",
          marginBottom: "12px",
        }}
      >
        {article.title}
      </h3>

      <div
        style={{
          lineHeight: "1.7",
          fontSize: "15px",
          color: "#374151",
        }}
      >
        <ReactMarkdown>{displayText}</ReactMarkdown>

        <span onClick={() => setShowFull(!showFull)} style={readMoreStyle}>
          {showFull ? " View less" : " Read more.."}
        </span>
      </div>

      {enhanced && (
        <button
          style={enhanceBtnStyle}
          onClick={() => {
            setShowEnhanced(!showEnhanced);
            setShowFull(true);
          }}
        >
          {showEnhanced ? "View original" : "View enhanced"}
        </button>
      )}
    </div>
  );
}

const readMoreStyle = {
  fontSize: "13px",
  color: "#1d4ed8",
  cursor: "pointer",
  fontWeight: "500",
};

const cardFooterStyle = {
  marginTop: "16px",
  display: "flex",
  justifyContent: "flex-start",
};

const enhanceBtnStyle = {
  padding: "8px 16px",
  borderRadius: "6px",
  border: "none",
  background: "#070d1cff",
  color: "#fff",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "500",
  marginTop: "8px",
  transition: "background 0.2s ease",
};

const cardStyle = {
  border: "1px solid #e5e7eb",
  padding: "24px",
  borderRadius: "12px",
  marginBottom: "24px",
  background: "#ffffff",
  color: "#111827",
  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
};

const btnStyle = {
  padding: "6px 12px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  background: "#f5f5f5",
  cursor: "pointer",
  fontSize: "14px",
};

export default App;
