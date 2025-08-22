const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Debug: Log environment variables (without sensitive data)
console.log('🔍 Environment check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
console.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0);
console.log('OPENAI_API_KEY starts with:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 10) + '...' : 'undefined');

// Check for Railway-prefixed variables
console.log('\n🔍 Checking for API key variations:');
Object.keys(process.env).forEach(key => {
  if (key.includes('OPENAI') || key.includes('API') || key.includes('KEY')) {
    console.log(`Found: ${key} = ${process.env[key] ? process.env[key].substring(0, 10) + '...' : 'empty'}`);
  }
});

console.log('\nAvailable env vars:', Object.keys(process.env).filter(key => !key.includes('SECRET') && !key.includes('KEY') && !key.includes('PASSWORD')).join(', '));

// Check environment variables before importing services
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY environment variable is not set!');
  console.error('Please set OPENAI_API_KEY in your Railway environment variables.');
  console.error('Env vars found:', Object.keys(process.env).length);
  process.exit(1);
}

const cron = require('node-cron');
const { generateDailyArticles, generateHourlyArticle } = require('./services/articleGenerator');
const { getArticles, saveArticle, saveArticles } = require('./services/articleStorage');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://cashminr-frontend.vercel.app'] // Replace with your actual Vercel domain
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

// Get article by slug (for SEO-friendly URLs)
app.get('/api/articles/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const articles = await getArticles();
    const article = articles.find(a => a.slug === slug);
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    res.json(article);
  } catch (error) {
    console.error('Error fetching article by slug:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

// Generate hourly article
app.post('/api/articles/generate-hourly', async (req, res) => {
  try {
    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      return res.status(400).json({ 
        error: 'OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file.' 
      });
    }
    
    const newArticle = await generateHourlyArticle();
    if (newArticle) {
      res.json({ 
        success: true, 
        message: 'Generated new hourly article',
        article: newArticle 
      });
    } else {
      res.json({ 
        success: false, 
        message: 'No new article generated (possible duplicate)' 
      });
    }
  } catch (error) {
    console.error('Error generating hourly article:', error);
    res.status(500).json({ 
      error: 'Failed to generate hourly article',
      details: error.message 
    });
  }
});

// Generate daily articles
app.post('/api/articles/generate-daily', async (req, res) => {
  try {
    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      return res.status(400).json({ 
        error: 'OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file.' 
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

// Delete article by ID
app.delete('/api/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const articles = await getArticles();
    const articleIndex = articles.findIndex(a => a.id === id);
    
    if (articleIndex === -1) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    const deletedArticle = articles.splice(articleIndex, 1)[0];
    await saveArticles(articles);
    
    res.json({ 
      success: true, 
      message: 'Article deleted successfully',
      deletedArticle 
    });
  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({ error: 'Failed to delete article' });
  }
});

// Schedule hourly article generation every hour
cron.schedule('0 * * * *', async () => {
  console.log('Running hourly article generation...');
  try {
    const article = await generateHourlyArticle();
    if (article) {
      console.log(`Hourly article generated successfully: ${article.title}`);
    } else {
      console.log('No new hourly article generated (possible duplicate)');
    }
  } catch (error) {
    console.error('Error generating hourly article:', error);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'Cashminr Articles Server',
    version: '2.0.0'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Cashminr Articles Server running on port ${PORT}`);
  console.log(`📝 Article generation scheduled for every hour`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
}); 