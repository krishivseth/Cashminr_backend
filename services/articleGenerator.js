const Anthropic = require('@anthropic-ai/sdk');
const { saveArticle, checkDuplicate } = require('./articleStorage');

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

const financialTopics = [
  {
    category: 'investing',
    topics: [
      'What is an IRA and how does it work?',
      'How to start investing with $100',
      'Understanding stock options for beginners',
      'The difference between ETFs and mutual funds',
      'How to build a diversified investment portfolio',
      'Understanding compound interest in investing',
      'Roth vs Traditional IRA: Which is right for you?',
      'How to invest in index funds for beginners',
      'Understanding market volatility and risk',
      'The importance of asset allocation'
    ]
  },
  {
    category: 'mortgages',
    topics: [
      '30-year vs 15-year mortgage: Which is better?',
      'How to qualify for a mortgage with bad credit',
      'Understanding mortgage points and closing costs',
      'When should you refinance your mortgage?',
      'FHA vs conventional loans: Pros and cons',
      'How to calculate your mortgage payment',
      'Understanding PMI and when you can remove it',
      'The home buying process step by step',
      'How to get the best mortgage rate',
      'Understanding adjustable-rate mortgages'
    ]
  },
  {
    category: 'credit',
    topics: [
      'How to improve your credit score fast',
      'Understanding credit card interest rates',
      'Debt consolidation strategies that work',
      'How to negotiate with credit card companies',
      'Building credit when you have none',
      'Understanding credit utilization ratio',
      'How to dispute errors on your credit report',
      'The impact of late payments on credit',
      'Understanding secured vs unsecured credit cards',
      'How to rebuild credit after bankruptcy'
    ]
  },
  {
    category: 'retirement',
    topics: [
      '401(k) vs IRA: Which retirement account is right for you?',
      'How much should you save for retirement?',
      'Social Security benefits: When to claim',
      'Roth vs traditional IRA: Key differences',
      'Planning for retirement in your 20s and 30s',
      'Understanding required minimum distributions',
      'How to catch up on retirement savings',
      'Retirement planning for self-employed individuals',
      'Understanding pension plans vs 401(k)s',
      'How to plan for healthcare costs in retirement'
    ]
  },
  {
    category: 'savings',
    topics: [
      'High-yield savings accounts: What to know',
      'Emergency fund: How much and where to keep it',
      'CD ladder strategy for better returns',
      'Saving for a down payment on a house',
      'Teaching kids about money and saving',
      'How to save money on everyday expenses',
      'Understanding inflation and its impact on savings',
      'Saving strategies for different life stages',
      'How to automate your savings',
      'Understanding the 50/30/20 budgeting rule'
    ]
  }
];

async function generateArticle(topic, category) {
  const prompt = `You are a financial expert writing for Cashminr, a financial education platform. Write a comprehensive, informative article about: "${topic}"

Requirements:
- Write 800-1200 words
- Use clear, simple language that beginners can understand
- Focus on paragraph-based explanations rather than bullet points
- Include practical tips and actionable advice woven into paragraphs
- Structure with clear headings and subheadings
- Focus on educational value, not sales pitches
- Include relevant financial terms and definitions naturally in the text
- End with a brief summary of key takeaways
- Make it engaging and easy to read
- Use paragraphs to explain concepts, avoid excessive bullet points
- When you do use lists, keep them short (2-3 items max) and integrate them naturally

Format the response in markdown with proper headings:
- Use # for the main title (the topic)
- Use ## for major section headings
- Use ### for subsection headings
- Use regular paragraphs for most content
- Use numbered lists sparingly and only when absolutely necessary

Topic: ${topic}
Category: ${category}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0].text;
    
    // Extract SEO keywords from the content
    const keywords = extractKeywords(content, topic);
    
    return {
      title: topic,
      content: content,
      category: category,
      seoKeywords: keywords,
      generatedDate: new Date().toISOString(),
      publishedDate: new Date().toISOString(),
      status: 'published',
      wordCount: content.split(' ').length
    };
  } catch (error) {
    console.error('Error generating article:', error);
    throw error;
  }
}

function extractKeywords(content, title) {
  // Simple keyword extraction - you can enhance this later
  const commonFinancialTerms = [
    'investing', 'mortgage', 'credit', 'retirement', 'savings',
    'IRA', '401k', 'ETF', 'mutual fund', 'interest rate',
    'credit score', 'debt', 'loan', 'refinance', 'down payment',
    'portfolio', 'diversification', 'compound interest', 'budget',
    'financial planning', 'wealth building', 'tax advantages'
  ];
  
  const titleWords = title.toLowerCase().split(' ').filter(word => word.length > 3);
  const contentWords = content.toLowerCase().split(' ').filter(word => word.length > 3);
  
  const allWords = [...titleWords, ...contentWords];
  const keywords = new Set();
  
  commonFinancialTerms.forEach(term => {
    if (allWords.some(word => word.includes(term) || term.includes(word))) {
      keywords.add(term);
    }
  });
  
  return Array.from(keywords).slice(0, 8);
}

async function generateDailyArticles() {
  const newArticles = [];
  const today = new Date().toDateString();
  
  // Generate 5 articles, one from each category
  for (const category of financialTopics) {
    const availableTopics = [];
    
    // Check each topic for duplicates
    for (const topic of category.topics) {
      const isDuplicate = await checkDuplicate(topic, category.category);
      if (!isDuplicate) {
        availableTopics.push(topic);
      }
    }
    
    if (availableTopics.length > 0) {
      // Pick a random topic from available ones
      const randomTopic = availableTopics[Math.floor(Math.random() * availableTopics.length)];
      
      try {
        const article = await generateArticle(randomTopic, category.category);
        await saveArticle(article);
        newArticles.push(article);
        
        // Add delay between API calls to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to generate article for ${category.category}:`, error);
      }
    }
  }
  
  return newArticles;
}

module.exports = {
  generateDailyArticles,
  generateArticle
}; 