const fs = require('fs').promises;
const path = require('path');

const ARTICLES_FILE = path.join(__dirname, '../data/articles.json');

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.dirname(ARTICLES_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Load articles from JSON file
async function loadArticles() {
  try {
    await ensureDataDir();
    const data = await fs.readFile(ARTICLES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist or is empty, return empty array
    return [];
  }
}

// Save articles to JSON file
async function saveArticles(articles) {
  await ensureDataDir();
  await fs.writeFile(ARTICLES_FILE, JSON.stringify(articles, null, 2));
}

// Get all articles
async function getArticles() {
  return await loadArticles();
}

// Save a new article
async function saveArticle(article) {
  const articles = await loadArticles();
  article.id = Date.now().toString(); // Simple ID generation
  articles.unshift(article); // Add to beginning
  
  // Keep only last 100 articles to prevent file from getting too large
  if (articles.length > 100) {
    articles.splice(100);
  }
  
  await saveArticles(articles);
  return article;
}

// Check for duplicate articles
async function checkDuplicate(title, category) {
  try {
    const articles = await loadArticles();
    // Check if an article with the same title exists
    return articles.some(article => 
      article.title.toLowerCase() === title.toLowerCase()
    );
  } catch (error) {
    console.error('Error checking for duplicates:', error);
    return false;
  }
}

module.exports = {
  getArticles,
  saveArticle,
  saveArticles,
  checkDuplicate
}; 