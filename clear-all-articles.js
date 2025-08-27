const fs = require('fs').promises;
const path = require('path');

const ARTICLES_FILE = path.join(__dirname, 'data/articles.json');

async function clearAllArticles() {
  try {
    console.log('🧹 Clearing all articles...');
    
    // Write an empty array to the articles file
    await fs.writeFile(ARTICLES_FILE, JSON.stringify([], null, 2));
    
    console.log('✅ All articles cleared successfully!');
    console.log('📝 New articles will be generated automatically by the cron job.');
    
  } catch (error) {
    console.error('❌ Error clearing articles:', error);
  }
}

// Run cleanup
clearAllArticles();



