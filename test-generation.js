// Test script for article generation
require('dotenv').config();
const { generateDailyArticles } = require('./services/articleGenerator');

async function testGeneration() {
  console.log('🧪 Testing article generation...');
  
  // Check if API key is configured
  if (!process.env.CLAUDE_API_KEY || process.env.CLAUDE_API_KEY === 'your_claude_api_key_here') {
    console.error('❌ Claude API key not configured!');
    console.log('Please create a .env file with your CLAUDE_API_KEY');
    console.log('You can copy from env.example and add your actual API key');
    return;
  }
  
  try {
    console.log('📝 Starting article generation...');
    const articles = await generateDailyArticles();
    
    if (articles.length === 0) {
      console.log('ℹ️  No new articles generated (all topics may already exist)');
      return;
    }
    
    console.log(`✅ Successfully generated ${articles.length} articles:`);
    
    articles.forEach((article, index) => {
      console.log(`\n${index + 1}. ${article.title}`);
      console.log(`   📂 Category: ${article.category}`);
      console.log(`   📊 Word count: ${article.wordCount}`);
      console.log(`   🏷️  Keywords: ${article.seoKeywords.join(', ')}`);
      console.log(`   📅 Generated: ${new Date(article.generatedDate).toLocaleString()}`);
    });
    
    console.log(`\n🎉 Test completed successfully! Generated ${articles.length} articles.`);
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  testGeneration();
}

module.exports = { testGeneration }; 