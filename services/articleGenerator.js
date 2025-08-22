require('dotenv').config();
const OpenAI = require('openai');
const { saveArticle, checkDuplicate } = require('./articleStorage');

// Initialize OpenAI client lazily to avoid startup errors
let openai = null;

function getOpenAIClient() {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

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
- Include practical tips and actionable advice
- Structure with clear headings and subheadings
- Focus on educational value, not sales pitches
- End with a brief summary of key takeaways

Format the response in markdown with proper headings:
- Use # for the main title
- Use ## for major section headings
- Use ### for subsection headings
- Use regular paragraphs for most content

Topic: ${topic}
Category: ${category}`;

  try {
    const openaiClient = getOpenAIClient();
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
    });

    const content = completion.choices[0].message.content;
    
    if (!content || content.trim() === '') {
      console.error('Empty content received from OpenAI');
      throw new Error('Generated content is empty');
    }
    
    // Create a URL-friendly slug from the topic
    const slug = topic
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    const article = {
      id: Date.now().toString(),
      title: topic,
      slug: slug,
      category: category,
      content: content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      readTime: Math.ceil(content.split(' ').length / 200), // Estimate reading time
      excerpt: content.length > 150 ? content.substring(0, 150) + '...' : content
    };
    
    return article;
  } catch (error) {
    console.error('Error generating article with OpenAI:', error);
    throw new Error(`Failed to generate article: ${error.message}`);
  }
}

async function generateHourlyArticle() {
  try {
    // Select a random category
    const randomCategory = financialTopics[Math.floor(Math.random() * financialTopics.length)];
    
    // Select a random topic from that category
    const randomTopic = randomCategory.topics[Math.floor(Math.random() * randomCategory.topics.length)];
    
    // Check if this topic has already been covered
    const isDuplicate = await checkDuplicate(randomTopic, randomCategory.category);
    
    if (isDuplicate) {
      console.log(`Topic "${randomTopic}" already exists, generating alternative...`);
      // Try a different topic from the same category
      const alternativeTopics = randomCategory.topics.filter(t => t !== randomTopic);
      if (alternativeTopics.length > 0) {
        const alternativeTopic = alternativeTopics[Math.floor(Math.random() * alternativeTopics.length)];
        const article = await generateArticle(alternativeTopic, randomCategory.category);
        await saveArticle(article);
        return article;
      }
    } else {
      const article = await generateArticle(randomTopic, randomCategory.category);
      await saveArticle(article);
      return article;
    }
    
    return null;
  } catch (error) {
    console.error('Error in generateHourlyArticle:', error);
    throw error;
  }
}

async function generateDailyArticles() {
  try {
    console.log('Starting daily article generation...');
    const articles = [];
    
    // Generate one article for each category
    for (const category of financialTopics) {
      const randomTopic = category.topics[Math.floor(Math.random() * category.topics.length)];
      
      // Check for duplicates
      const isDuplicate = await checkDuplicate(randomTopic, category.category);
      if (!isDuplicate) {
        const article = await generateArticle(randomTopic, category.category);
        await saveArticle(article);
        articles.push(article);
        console.log(`Generated article: ${article.title}`);
      } else {
        console.log(`Skipping duplicate topic: ${randomTopic}`);
      }
    }
    
    console.log(`Generated ${articles.length} new articles`);
    return articles;
  } catch (error) {
    console.error('Error generating daily articles:', error);
    throw error;
  }
}

module.exports = {
  generateArticle,
  generateHourlyArticle,
  generateDailyArticles
}; 