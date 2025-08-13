const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { generateDailyArticles } = require('./services/articleGenerator');
const { getArticles, saveArticle } = require('./services/articleStorage');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-vercel-domain.vercel.app'] // Replace with your actual Vercel domain
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Get all articles
app.get('/api/articles', async (req, res) => {
  try {
    const articles = await getArticles();
    res.json(articles);
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

// Get articles by category
app.get('/api/articles/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const articles = await getArticles();
    const filteredArticles = articles.filter(article => article.category === category);
    res.json(filteredArticles);
  } catch (error) {
    console.error('Error fetching articles by category:', error);
    res.status(500).json({ error: 'Failed to fetch articles by category' });
  }
});

// Generate daily articles
app.post('/api/articles/generate-daily', async (req, res) => {
  try {
    // Check if API key is configured
    if (!process.env.CLAUDE_API_KEY || process.env.CLAUDE_API_KEY === 'your_claude_api_key_here') {
      return res.status(400).json({ 
        error: 'Claude API key not configured. Please set CLAUDE_API_KEY in your .env file.' 
      });
    }
    
    const newArticles = await generateDailyArticles();
    res.json({ 
      success: true, 
      message: `Generated ${newArticles.length} new articles`,
      articles: newArticles 
    });
  } catch (error) {
    console.error('Error generating articles:', error);
    res.status(500).json({ 
      error: 'Failed to generate articles',
      details: error.message 
    });
  }
});

// Get article by ID
app.get('/api/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const articles = await getArticles();
    const article = articles.find(a => a.id === id);
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    res.json(article);
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

// Schedule daily article generation at 9 AM
cron.schedule('0 9 * * *', async () => {
  console.log('Running daily article generation...');
  try {
    await generateDailyArticles();
    console.log('Daily articles generated successfully');
  } catch (error) {
    console.error('Error generating daily articles:', error);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Cashminr Articles Server running on port ${PORT}`);
  console.log(`📚 API endpoints available:`);
  console.log(`   GET  /health - Server health check`);
  console.log(`   GET  /api/articles - Get all articles`);
  console.log(`   GET  /api/articles/category/:category - Get articles by category`);
  console.log(`   GET  /api/articles/:id - Get specific article`);
  console.log(`   POST /api/articles/generate-daily - Generate daily articles`);
  console.log(`⏰ Daily article generation scheduled for 9:00 AM`);
}); 