# Innovation Starterkit

A powerful Next.js application for AI-powered innovation assistance and ideation tools.

## Prerequisites

- Node.js 18+ and npm

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd innovation-starterkit
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API keys:

```env
# Required: Anthropic API Key
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Optional: Custom base URL (default: https://api.anthropic.com)
ANTHROPIC_BASE_URL=https://api.anthropic.com

# Required: AI Provider
AI_PROVIDER=anthropic
```

### 4. Get an Anthropic API Key

You can get your API key from these provider:
1. Go to [console.anthropic.com](https://console.anthropic.com/) or [z.ai](https://z.ai)
2. Sign up or log in
3. Navigate to API Keys
4. Create a new API key
5. Copy it to your `.env.local` file

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Building for Production

```bash
npm run build
npm start
```

The production server will run on port 3000 by default. You can customize the port:

```bash
PORT=3001 npm start
```

## Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key | - |
| `ANTHROPIC_BASE_URL` | No | Anthropic API base URL | `https://api.anthropic.com` |
| `AI_PROVIDER` | Yes | AI provider to use | `anthropic` |
| `ANTHROPIC_DEFAULT_SONNET_MODEL` | No | Default AI model | `claude-sonnet-4-20250514` |
| `TAVILY_API_KEY` | Yes | For web search features | - |
| `NEXT_PUBLIC_DEMO_MODE` | No | Enable demo mode | `false` |
| `NEXT_PUBLIC_DISABLE_TOUR` | No | Hide onboarding tour | `false` |
| `API_TIMEOUT` | No | API request timeout (ms) | `60000` |
| `API_MAX_RETRIES` | No | API retry attempts | `3` |

## Web Search Feature

To enable web search functionality, you can add Tavily API:

1. Get a free API key at [tavily.com](https://tavily.com)
2. Free tier: 1,000 requests/month
3. Add to `.env.local`:

```env
TAVILY_API_KEY=your_tavily_api_key_here
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

### Self-Hosted

```bash
npm run build
PORT=3001 npm start
```

To run as a background service:

```bash
PORT=3001 nohup npm start > server.log 2>&1 &
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

## Tech Stack

- **Framework:** Next.js 16.1.1
- **React:** 19.0.0
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI
- **AI SDK:** Vercel AI SDK + Anthropic

## Project Structure

```
innovation-starterkit/
├── app/                 # Next.js app router pages
│   ├── api/            # API routes
│   ├── challenge/      # Challenge page
│   ├── ideation/       # Ideation page
│   ├── investment-appraisal/
│   ├── market/         # Market analysis page
│   └── pitch/          # Pitch generation page
├── components/         # React components
├── lib/               # Utility functions and API clients
├── types/             # TypeScript type definitions
├── hooks/             # Custom React hooks
└── public/            # Static assets
```

## Security Notes

**Important:** Never commit `.env.local` to version control. It contains sensitive API keys.

- `.env.local` is listed in `.gitignore`
- Use `.env.example` as a template for required variables
- Add environment variables in your deployment platform's dashboard

## Troubleshooting

### Port already in use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### Build errors

```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run build
```

### API key issues

Ensure your `.env.local` file is in the project root and contains valid keys:

```bash
cat .env.local
```

## License

This project is private and proprietary.

## Support

For issues and questions, please contact the development team.
