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
      'Understanding Stock Options: Calls, Puts, and Advanced Strategies',
      'The Psychology of Market Timing: Why Most Investors Fail',
      'Value Investing vs Growth Investing: Deep Dive Analysis',
      'Understanding Derivatives: Futures, Forwards, and Swaps',
      'Portfolio Optimization: Modern Portfolio Theory in Practice',
      'Alternative Investments: REITs, Commodities, and Cryptocurrency',
      'Understanding Beta, Alpha, and Sharpe Ratio in Investing',
      'Dividend Investing: Building Passive Income Streams',
      'International Investing: Emerging Markets and Currency Risk',
      'Tax-Loss Harvesting: Advanced Strategies for Tax Efficiency',
      'Understanding Margin Trading and Leverage Risks',
      'Sector Rotation Strategies: Timing Industry Cycles',
      'Understanding Bond Duration and Interest Rate Risk',
      'Quantitative Investing: Algorithmic Trading Strategies',
      'ESG Investing: Environmental, Social, and Governance Factors'
    ]
  },
  {
    category: 'mortgages',
    topics: [
      'Mortgage-Backed Securities: Understanding the Secondary Market',
      'Reverse Mortgages: When and How They Make Sense',
      'Understanding Mortgage Servicing Rights and Transfers',
      'Jumbo Loans: Requirements and Implications for High-Value Properties',
      'Mortgage Prepayment Penalties: Hidden Costs to Avoid',
      'Understanding Escrow Accounts and Tax Implications',
      'Mortgage Insurance: PMI, MIP, and Private Options Compared',
      'Interest-Only Mortgages: Risks and Rewards Analysis',
      'Balloon Mortgages: Short-Term Financing Strategies',
      'Mortgage Rate Locks: Timing and Cost Considerations',
      'Understanding Mortgage Points: When to Buy Down Your Rate',
      'VA Loans: Military Benefits and Qualification Requirements',
      'USDA Loans: Rural Property Financing Options',
      'Mortgage Refinancing: Break-Even Analysis and Timing',
      'Construction Loans: Financing New Home Building'
    ]
  },
  {
    category: 'credit',
    topics: [
      'Understanding Credit Default Swaps and Credit Derivatives',
      'Credit Card Arbitrage: Balance Transfer Strategies',
      'Business Credit: Building Separate Credit for Your Company',
      'Understanding Credit Bureaus and Credit Scoring Models',
      'Credit Repair: Legal Strategies for Improving Your Score',
      'Credit Card Churning: Maximizing Rewards and Sign-Up Bonuses',
      'Understanding Secured vs Unsecured Debt: Priority in Bankruptcy',
      'Credit Counseling: When and How to Seek Professional Help',
      'Understanding Credit Inquiries: Hard vs Soft Pulls',
      'Credit Card Fraud Protection: Advanced Security Measures',
      'Understanding Credit Card Networks: Visa, Mastercard, Amex',
      'Credit Card Chargebacks: Protecting Your Rights as a Consumer',
      'Understanding Credit Card Grace Periods and Billing Cycles',
      'Credit Card Foreign Transaction Fees: International Travel Costs',
      'Understanding Credit Card Cash Advances and Balance Transfers'
    ]
  },
  {
    category: 'retirement',
    topics: [
      'Required Minimum Distributions: Complex Rules and Strategies',
      'Roth IRA Conversion Ladder: Tax-Free Retirement Income',
      'Understanding Pension Plans: Defined Benefit vs Defined Contribution',
      'Social Security Optimization: Spousal and Survivor Benefits',
      'Retirement Healthcare Costs: Medicare, Medigap, and Long-Term Care',
      'Retirement Portfolio Withdrawal Strategies: The 4% Rule Revisited',
      'Catch-Up Contributions: Maximizing Retirement Savings After 50',
      'Retirement Plan Rollovers: Navigating Complex Tax Rules',
      'Understanding Qualified vs Non-Qualified Retirement Plans',
      'Retirement Income Sources: Creating Multiple Revenue Streams',
      'Early Retirement Planning: FIRE Movement Strategies',
      'Retirement Plan Beneficiary Designations and Estate Planning',
      'Understanding Retirement Plan Loans and Hardship Distributions',
      'Retirement Plan Fiduciary Responsibilities and Legal Obligations',
      'International Retirement Planning: Expatriate Considerations'
    ]
  },
  {
    category: 'savings',
    topics: [
      'CD Ladder Strategies: Maximizing Interest While Maintaining Liquidity',
      'High-Yield Savings vs Money Market Accounts: Yield Comparison',
      'Understanding Inflation-Adjusted Returns on Savings',
      'Emergency Fund Optimization: Where and How Much to Keep',
      'Savings Bonds: Series EE vs Series I Bond Strategies',
      'Understanding Banking Relationships and Account Benefits',
      'Savings Account Insurance: FDIC vs NCUA Coverage Limits',
      'Understanding Banking Fees: Overdraft, Monthly, and Transaction Costs',
      'Savings Automation: Building Consistent Wealth Habits',
      'Understanding Liquidity: Balancing Access and Returns',
      'Savings Rate Optimization: Percentage vs Dollar Amount Strategies',
      'Understanding Banking Regulations and Consumer Protections',
      'Savings Goals: Short-Term vs Long-Term Planning',
      'Understanding Banking Technology: Online vs Traditional Banks',
      'Savings Psychology: Behavioral Economics of Wealth Building'
    ]
  },
  {
    category: 'taxes',
    topics: [
      'Tax Loss Harvesting: Advanced Strategies for Reducing Tax Liability',
      'Understanding Capital Gains Tax: Short-Term vs Long-Term Rates',
      'Tax-Efficient Investing: Minimizing Tax Drag on Returns',
      'Understanding Alternative Minimum Tax (AMT) and Its Impact',
      'Tax Deductions vs Tax Credits: Maximizing Your Tax Benefits',
      'Understanding Retirement Plan Contribution Limits and Deadlines',
      'Tax Planning for High-Net-Worth Individuals: Advanced Strategies',
      'Understanding Estate and Gift Taxes: Wealth Transfer Planning',
      'Tax Consequences of Investment Income: Dividends and Interest',
      'Understanding Tax Brackets: Marginal vs Effective Tax Rates',
      'Tax-Advantaged Accounts: HSAs, FSAs, and Educational Savings',
      'Understanding Business Tax Deductions and Write-Offs',
      'Tax Planning for Real Estate Investors: Depreciation and Deductions',
      'Understanding International Tax Considerations for Expats',
      'Tax Audit Preparation: Documentation and Record Keeping'
    ]
  },
  {
    category: 'insurance',
    topics: [
      'Understanding Whole Life vs Term Life Insurance: Cost-Benefit Analysis',
      'Universal Life Insurance: Flexible Premium and Death Benefit Options',
      'Variable Life Insurance: Investment Component and Risk Factors',
      'Long-Term Care Insurance: Coverage Options and Premium Costs',
      'Understanding Disability Insurance: Short-Term vs Long-Term Coverage',
      'Umbrella Insurance: Additional Liability Protection Strategies',
      'Understanding Health Insurance Networks: HMOs, PPOs, and EPOs',
      'Health Savings Accounts (HSAs): Triple Tax Advantage Explained',
      'Understanding Insurance Underwriting: Risk Assessment and Premiums',
      'Insurance Policy Riders: Customizing Coverage for Your Needs',
      'Understanding Insurance Claims: Process and Timeline Expectations',
      'Self-Insuring: When to Skip Insurance and Assume Risk',
      'Understanding Insurance Deductibles: High vs Low Options',
      'Insurance Policy Reviews: When and How to Update Coverage',
      'Understanding Reinsurance: How Insurance Companies Manage Risk'
    ]
  },
  {
    category: 'estate_planning',
    topics: [
      'Understanding Trusts: Revocable vs Irrevocable Trust Structures',
      'Estate Tax Planning: Strategies for Minimizing Tax Liability',
      'Understanding Wills vs Trusts: Which is Right for Your Situation',
      'Power of Attorney: Financial vs Healthcare Decision Making',
      'Understanding Probate: Process, Timeline, and Costs',
      'Charitable Giving: Tax-Efficient Philanthropic Strategies',
      'Understanding Beneficiary Designations: Primary vs Contingent',
      'Estate Planning for Blended Families: Complex Family Dynamics',
      'Understanding Life Insurance Trusts: Estate Tax Avoidance',
      'Digital Estate Planning: Managing Online Assets and Accounts',
      'Understanding Guardianship: Planning for Minor Children',
      'Estate Planning for Business Owners: Succession Planning',
      'Understanding Joint Tenancy vs Tenancy in Common',
      'Estate Planning for High-Net-Worth Individuals: Advanced Strategies',
      'Understanding Living Wills and Advance Healthcare Directives'
    ]
  }
];

async function generateArticle(topic, category) {
  const prompt = `You are a senior financial expert with 15+ years of experience writing for Cashminr, a premium financial education platform. Write a comprehensive, sophisticated article about: "${topic}"

CRITICAL REQUIREMENTS:

1. THINKING AND ANALYSIS REQUIREMENTS:
- DO NOT simply regurgitate predefined content or follow rigid templates
- Think critically about the topic and provide your own expert analysis and insights
- Consider current market conditions, economic trends, and regulatory changes that affect this topic
- Draw from your knowledge of financial theory, industry best practices, and real-world case studies
- Provide nuanced perspectives that go beyond surface-level explanations
- Include counterintuitive insights and challenge common assumptions when appropriate
- Consider how this topic intersects with other areas of personal finance
- Address emerging trends, technologies, or regulatory changes that could impact this topic

2. CONTENT DEPTH AND SOPHISTICATION:
- Write 1200-1800 words of advanced, nuanced content
- Assume readers have basic financial literacy but want to deepen their knowledge
- Cover complex concepts with detailed explanations and real-world applications
- Include intermediate-to-advanced strategies and considerations
- Discuss both opportunities and risks/caveats of each topic
- Go beyond the obvious - explore edge cases, advanced strategies, and expert-level insights

3. MANDATORY STATISTICAL EXAMPLES:
You MUST include specific, realistic calculations and examples that demonstrate your understanding. Include at least 3-4 detailed calculations that are relevant to the specific topic. Think creatively about which calculations would be most illuminating for readers. Examples might include:

FOR MORTGAGES:
- "A $450,000 30-year mortgage at 6.25% would cost $2,771 monthly and $547,560 in total interest over the loan term. With an extra $200 monthly payment, you'd save $108,000 in interest and pay off 5 years early."
- "A 15-year mortgage for the same amount at 5.75% would cost $3,735 monthly but only $222,300 in total interest, saving $325,260 compared to the 30-year option."
- Consider break-even analysis, refinancing scenarios, or investment opportunity cost calculations

FOR INVESTING:
- "Investing $15,000 in an S&P 500 index fund averaging 9.2% returns would grow to $67,200 in 15 years. With monthly contributions of $500, you'd reach $1.2 million in 25 years."
- "A $50,000 investment in a diversified portfolio with 7% returns would provide $3,500 annually in dividends, growing to $7,000+ annually after 10 years with dividend reinvestment."
- Consider risk-adjusted returns, correlation analysis, or tax-efficient investing scenarios

FOR SAVINGS:
- "Saving $750 monthly at 4.5% interest would reach $367,000 in 20 years. If inflation averages 2.5%, the real value would be $223,000 in today's dollars."
- "A CD ladder with $50,000 spread across 1-5 year terms at current rates (4.25-5.1%) would generate approximately $2,200 annually in interest."
- Consider opportunity cost analysis, emergency fund sizing, or savings rate optimization

FOR RETIREMENT:
- "Starting at age 30, contributing $800 monthly to a 401(k) with 7.5% returns and 3% employer match would give you $2.1 million by age 65. Delaying to age 35 would reduce this to $1.4 million."
- "A 65-year-old with $1 million in retirement savings using the 4% rule could withdraw $40,000 annually, adjusted for inflation, with 90% confidence of not running out of money over 30 years."
- Consider sequence of returns risk, withdrawal strategy analysis, or healthcare cost projections

FOR CREDIT:
- "A $10,000 credit card balance at 18.99% interest would take 17 years to pay off with minimum payments (3% of balance), costing $8,400 in interest. Paying $300 monthly would clear it in 4 years with only $2,800 in interest."
- "Transferring a $15,000 balance to a 0% APR card for 18 months with a 3% transfer fee ($450) would save $2,700 in interest over 18 months."
- Consider credit utilization impact, debt-to-income ratios, or balance transfer arbitrage

FOR TAXES:
- Consider tax-loss harvesting scenarios, bracket optimization, or charitable giving strategies
- Include calculations showing tax efficiency of different investment vehicles

FOR INSURANCE:
- Consider cost-benefit analysis of different coverage levels, self-insurance calculations, or premium optimization
- Include risk assessment calculations and probability-weighted cost analysis

4. STRUCTURE REQUIREMENTS:
- Begin with a compelling hook that establishes the topic's importance and your unique perspective
- Include a "Key Takeaways" section with 3-5 bullet points that capture your expert insights
- Use clear headings and subheadings (## for major sections, ### for subsections)
- Include a "Risks and Considerations" section that reflects your expert judgment
- End with actionable next steps and resources for further learning
- Include relevant regulatory considerations where applicable
- Consider adding sections that address common misconceptions or emerging trends

5. WRITING STYLE:
- Professional but accessible tone that reflects your expertise
- Use active voice and clear, concise language
- Include expert insights and industry perspectives that demonstrate deep knowledge
- Address common misconceptions and pitfalls with authority
- Provide context for why the topic matters to readers' financial health
- Express your own informed opinions and recommendations where appropriate

6. FORMATTING:
- Use proper markdown formatting
- Include tables for comparing options when relevant
- Use bullet points sparingly and only for lists of key points
- Include callout boxes for important warnings or tips
- Consider using charts or visual elements described in text when helpful

Topic: ${topic}
Category: ${category}

CRITICAL THINKING INSTRUCTIONS:
Before writing, take time to:
1. Analyze the current economic environment and how it affects this topic
2. Consider recent regulatory changes or proposed legislation
3. Think about emerging trends or technologies that could impact this area
4. Reflect on common mistakes or misconceptions you've observed in practice
5. Consider how this topic relates to broader financial planning strategies
6. Identify opportunities for readers that might not be immediately obvious

Remember: This article should serve as a comprehensive resource that readers can reference for years to come. Focus on timeless principles while acknowledging current market conditions and regulatory considerations. Your goal is to provide analysis that goes beyond what readers could find in basic financial education materials.`;

  try {
    const openaiClient = getOpenAIClient();
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 3000,
      temperature: 0.7,
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