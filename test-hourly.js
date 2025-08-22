const { generateHourlyArticle } = require('./services/articleGenerator');
require('dotenv').config();

async function testHourlyGeneration() {
  console.log('🧪 Testing hourly article generation with OpenAI...');
  
  // Check if API key is configured
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
    console.log('❌ OPENAI_API_KEY not configured');
    console.log('Please create a .env file with your OPENAI_API_KEY');
    return;
  }
  
  try {
    console.log('🚀 Starting hourly article generation...');
    const startTime = Date.now();
    
    const article = await generateHourlyArticle();
    
    if (article) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log('✅ Article generated successfully!');
      console.log(`📝 Title: ${article.title}`);
      console.log(`🏷️  Category: ${article.category}`);
      console.log(`🔗 Slug: ${article.slug}`);
      console.log(`⏱️  Generation time: ${duration}ms`);
      console.log(`📖 Reading time: ~${article.readTime} minutes`);
      console.log(`📊 Word count: ${article.content.split(' ').length}`);
      console.log(`📅 Created: ${article.createdAt}`);
      console.log(`\n📄 Content preview:`);
      console.log(article.content.substring(0, 300) + '...');
    } else {
      console.log('⚠️  No new article generated (possible duplicate)');
    }
    
  } catch (error) {
    console.error('❌ Error generating article:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testHourlyGeneration();
