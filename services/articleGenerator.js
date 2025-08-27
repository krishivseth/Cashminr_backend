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
  const prompt = `You are a financial writer for Cashminr who excels at finding sophisticated but accessible personal finance topics. Your readers are financially aware but not professionals - think educated consumers who want to go beyond basic advice.

Your mission: Generate and write about a specific, non-generic personal finance topic that is:

TOPIC CRITERIA:
✅ SOPHISTICATED: Goes beyond obvious advice everyone knows
✅ ACCESSIBLE: Regular people can understand and apply it (no CPA/CFP expertise required)  
✅ SPECIFIC: Focuses on particular situations, strategies, or decisions
✅ ACTIONABLE: Readers can implement the insights
✅ CURRENT: Relevant to today's economic environment
✅ NON-OBVIOUS: Provides insights people wouldn't naturally think of

❌ AVOID: Generic topics, expert-only strategies, basic financial literacy

EXAMPLES of the right complexity level:
- "Why Your Emergency Fund Location Matters More Than the Amount"
- "How Rising Interest Rates Change Your Mortgage Payoff Strategy"
- "When Credit Card Points Actually Cost You Money: Hidden Calculations"
- "The Psychology Behind Why Dollar-Cost Averaging Often Fails"
- "How Remote Work Changes Your Tax Strategy (Without Moving States)"
- "Why Your 401k Match Timing Could Cost You Thousands"
- "The Hidden Costs of 'Free' Financial Apps and When to Pay Instead"
- "How Inflation Actually Affects Different Types of Debt Differently"

CURRENT CONTEXT TO CONSIDER:
- Interest rate environment and its ripple effects
- Inflation impact on different financial decisions
- Remote work changing financial planning
- Technology changing how we manage money
- Supply chain issues affecting investments and spending
- Generational wealth transfer happening now
- Housing market dynamics
- Credit market changes

THINKING PROCESS:
1. What financial situations do people face that have non-obvious complications?
2. What common advice might be wrong in current conditions?
3. What timing or implementation details make a big difference?
4. What psychological biases affect financial decisions?
5. How do current events create new considerations for personal finance?
6. What technology changes create new opportunities or risks?

ARTICLE REQUIREMENTS:
- 1200-1800 words, accessible but sophisticated
- Include 3-4 specific calculations or examples with real numbers where necessary
- Address current market conditions (2024-2025)
- Provide counterintuitive insights where appropriate
- Include practical implementation steps
- Balance opportunities with realistic risks
- Use clear language but don't oversimplify complex topics

STRUCTURE:
# [Your Generated Topic Title]
## Why This Matters Right Now
## [Main Analysis Sections - You Choose]
## What This Means for You
## Action Steps
## Bottom Line

CRITICAL: Choose a topic that makes readers think "I never considered that" or "That's not what I expected" - but something they can still understand and act on.

Generate the topic and write the complete article now.

Topic: ${topic}
Category: ${category}`;

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