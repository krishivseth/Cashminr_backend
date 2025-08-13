# Cashminr Articles Server

A Node.js backend server that automatically generates financial education articles using Claude AI. The server generates articles on various financial topics including investing, mortgages, credit, retirement, and savings.

## Features

- 🤖 **AI-Powered Content**: Uses Claude 3.5 Sonnet to generate high-quality financial articles
- 📅 **Automated Generation**: Scheduled daily article generation at 9:00 AM
- 🏷️ **Smart Categorization**: Articles are automatically categorized and tagged
- 🔍 **Duplicate Prevention**: Prevents generation of duplicate articles
- 📊 **SEO Optimization**: Automatically extracts relevant keywords
- 🚀 **RESTful API**: Clean API endpoints for frontend integration
- ⏰ **Cron Scheduling**: Automated daily article generation

## Prerequisites

- Node.js 16+ 
- Claude API key from Anthropic
- npm or yarn package manager

## Setup

1. **Clone and install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Environment Configuration:**
   ```bash
   # Copy the example environment file
   cp env.example .env
   
   # Edit .env and add your Claude API key
   CLAUDE_API_KEY=your_actual_api_key_here
   PORT=3001
   ```

3. **Get Claude API Key:**
   - Visit [Anthropic Console](https://console.anthropic.com/)
   - Create an account and generate an API key
   - Add the key to your `.env` file

## Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Test Article Generation
```bash
node test-generation.js
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |
| GET | `/api/articles` | Get all articles |
| GET | `/api/articles/category/:category` | Get articles by category |
| GET | `/api/articles/:id` | Get specific article |
| POST | `/api/articles/generate-daily` | Generate daily articles |

## Article Categories

- **investing**: Investment strategies, IRAs, ETFs, portfolio management
- **mortgages**: Home loans, refinancing, mortgage rates
- **credit**: Credit scores, debt management, credit cards
- **retirement**: 401(k)s, IRAs, retirement planning
- **savings**: High-yield accounts, emergency funds, budgeting

## Article Structure

Each generated article includes:
- **Title**: Engaging, SEO-friendly headline
- **Content**: 800-1200 words of educational content
- **Category**: Financial topic classification
- **SEO Keywords**: Automatically extracted relevant terms
- **Word Count**: Content length for quality control
- **Timestamps**: Generation and publication dates
- **Status**: Article publication status

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CLAUDE_API_KEY` | Your Claude API key | Required |
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment mode | development |

### Cron Schedule

Articles are automatically generated daily at 9:00 AM. You can modify the schedule in `index.js`:

```javascript
cron.schedule('0 9 * * *', async () => {
  // Daily at 9:00 AM
});
```

## File Structure

```
server/
├── index.js              # Main server file
├── services/
│   ├── articleGenerator.js  # AI article generation logic
│   └── articleStorage.js    # Article storage and retrieval
├── data/                 # Generated articles storage
├── test-generation.js    # Test script for article generation
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

## Troubleshooting

### Common Issues

1. **API Key Not Configured**
   - Ensure `.env` file exists with valid `CLAUDE_API_KEY`
   - Check that the key is not the placeholder value

2. **Rate Limiting**
   - The server includes 1-second delays between API calls
   - Monitor Claude API usage limits

3. **Duplicate Articles**
   - The system prevents duplicate titles
   - Check the `checkDuplicate` function in `articleStorage.js`

4. **Storage Issues**
   - Articles are stored in `data/articles.json`
   - Ensure the data directory has write permissions

### Error Handling

The server includes comprehensive error handling:
- API key validation
- Duplicate prevention
- Rate limiting protection
- Detailed error logging

## Development

### Adding New Topics

Edit `financialTopics` in `articleGenerator.js`:

```javascript
const financialTopics = [
  {
    category: 'new-category',
    topics: [
      'New topic 1',
      'New topic 2'
    ]
  }
];
```

### Customizing Prompts

Modify the prompt template in `generateArticle()` function:

```javascript
const prompt = `Your custom prompt template here...`;
```

### Database Integration

Currently uses file-based storage. To integrate with a database:
1. Modify `articleStorage.js` functions
2. Update database connection in `index.js`
3. Add database environment variables

## Monitoring

- Check `/health` endpoint for server status
- Monitor console logs for generation status
- Review generated articles in `data/articles.json`

## Security

- API keys are stored in environment variables
- CORS is enabled for frontend integration
- Input validation on all endpoints
- Rate limiting on article generation

## License

This project is part of the Cashminr financial education platform. 