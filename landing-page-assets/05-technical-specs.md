# Innovation StarterKit - Technical Specifications

## Technology Stack

### Frontend Framework
- **Next.js**: Version 16.1.1
  - React 19.0.0
  - App Router architecture
  - Server-side rendering (SSR)
  - Static site generation (SSG) capability
  - API routes for backend functionality

### Language & Tooling
- **TypeScript**: Version 5.x
  - Full type safety across codebase
  - Enhanced developer experience
  - Better IDE support and refactoring

### Styling & UI
- **Tailwind CSS**: Version 3.4.1
  - Utility-first CSS framework
  - Custom design system
  - Responsive design utilities
  - Dark mode support via CSS variables

- **Radix UI**: Component primitives
  - Accessible unstyled components
  - Dialog, Dropdown, Tabs, Tooltip, Label
  - WCAG compliant components

- **Framer Motion**: Version 12.26.2
  - Smooth animations and transitions
  - Page transitions
  - Micro-interactions
  - Gesture-based animations

### State Management
- **React Context API**: For global state
  - Case study context
  - Text selection context
  - Session state management

- **Local Storage**: Browser persistence
  - Session data saved automatically
  - Work preservation across sessions
  - No login required

### AI Integration
- **Vercel AI SDK**: Version 6.0.39
  - Stream completion handling
  - Chat interface utilities
  - Tool calling support

- **AI Providers**:
  - **Primary**: OpenAI SDK (v4.77.0)
  - **Alternative**: Zhipuai (v2.0.0) for Chinese market
  - **Base URL**: Configurable (default: OpenAI, supports Z.AI)

- **Models Supported**:
  - GPT-4 and GPT-3.5 variants
  - Claude models (via Anthropic API)
  - Custom models via environment variables

### Additional Integrations
- **Tavily API**: Optional web search
  - Real-time market research
  - Competitive analysis
  - Trend identification
  - Free tier: 1,000 requests/month

### Data Visualization
- **Recharts**: Version 3.7.0
  - Market size charts
  - Financial projections
  - Interactive data displays

### Document Generation
- **jsPDF**: Version 4.0.0
  - Business plan PDF export
  - Pitch deck generation
  - Branded document output

- **jsPDF-AutoTable**: Version 5.0.7
  - Table formatting in PDFs
  - Financial data presentation

- **XLSX**: Version 0.18.5
  - Excel export capability
  - Data export for further analysis

### Icons & Graphics
- **Lucide React**: Version 0.468.0
  - Consistent icon set
  - Lightbulb (innovation)
  - Business/financial icons
  - Navigation icons

### Markdown Rendering
- **React Markdown**: Version 10.1.0
  - AI response formatting
  - Rich text display

- **Rehype Raw**: Version 7.0.0
  - HTML support in markdown

- **Remark GFM**: Version 4.0.1
  - GitHub Flavored Markdown
  - Tables, strikethrough, task lists

### Development Tools
- **ESLint**: Version 9.x
  - Code quality enforcement
  - Next.js configuration
  - TypeScript rules

- **PostCSS**: Version 8.x
  - CSS processing
  - Tailwind integration

- **Autoprefixer**: Version 10.4.23
  - Cross-browser compatibility

### Testing & Automation
- **Puppeteer**: Version 24.35.0
  - Automated testing
  - Screenshot generation
  - E2E testing capability

---

## Architecture

### Project Structure
```
innovation-starterkit/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── ai/                   # AI endpoints
│   │   │   ├── challenge/        # Phase 1: Challenge definition
│   │   │   ├── market/           # Phase 2: Market analysis
│   │   │   ├── ideate/           # Phase 3: Ideation
│   │   │   ├── appraisal/        # Phase 4: Investment appraisal
│   │   │   └── pitch/            # Phase 5: Pitch generation
│   │   └── assistant/            # Chat assistant routes
│   ├── challenge/                # Phase 1 page
│   ├── market/                   # Phase 2 page
│   ├── ideation/                 # Phase 3 page
│   ├── investment-appraisal/     # Phase 4 page
│   ├── pitch/                    # Phase 5 page
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home (redirects to /challenge)
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── assistant/                # Chat assistant
│   ├── case-studies/             # Case study modals
│   ├── chat/                     # Chat interface
│   ├── idea/                     # Idea cards
│   ├── ideation/                 # Ideation components
│   ├── investment/               # Investment components
│   ├── market/                   # Market analysis components
│   ├── ui/                       # Reusable UI components
│   └── wizard/                   # Wizard navigation
├── contexts/                     # React contexts
│   ├── case-study-context.tsx    # Case study state
│   └── ...
├── hooks/                        # Custom React hooks
├── lib/                          # Utilities & configurations
│   ├── ai/                       # AI integration
│   ├── utils/                    # Helper functions
│   └── ...
├── types/                        # TypeScript definitions
├── data/                         # Static data
│   └── case-studies/             # Case study JSON
└── public/                       # Static assets
```

### Routing Strategy
- **App Router**: Next.js 13+ app directory structure
- **Phase-based routes**: Each innovation phase is a separate route
- **Progress persistence**: State maintained via localStorage
- **Redirection**: Home page redirects to /challenge

### State Management Architecture
```
Global State (React Context)
├── Case Study Context
│   ├── Selected case study
│   ├── Phase data
│   └── Comparison mode
└── Text Selection Context

Local State (Component Level)
├── Chat messages
├── Form inputs
├── UI states (modals, dropdowns)
└── Loading states

Persistent State (Browser)
├── localStorage
│   ├── Session data
│   ├── Phase completion
│   └── User inputs
```

---

## API Architecture

### AI Endpoints

#### Phase 1: Challenge Definition
```
POST /api/ai/challenge
- Input: User problem description
- Output: Structured challenge analysis
- Model: GPT-4 / Claude
```

#### Phase 2: Market Analysis
```
POST /api/ai/market
POST /api/ai/market/generate (with Tavily search)
- Input: Challenge context
- Output: Market sizing, trends, competitors
- Optional: Web search integration
```

#### Phase 3: Ideation
```
POST /api/ai/ideate
POST /api/ai/ideate/score
- Input: Challenge + Market data
- Output: Multiple business concepts with scores
```

#### Phase 4: Investment Appraisal
```
POST /api/ai/appraisal
POST /api/ai/appraisal/generate
- Input: Selected idea
- Output: Financial projections, ROI analysis
```

#### Phase 5: Pitch Generation
```
POST /api/ai/pitch
- Input: All previous phases data
- Output: Complete pitch deck summary
```

### Assistant Endpoints
```
POST /api/assistant/challenge
POST /api/assistant/market
POST /api/assistant/ideation
POST /api/assistant/investment-appraisal
POST /api/assistant/pitch

Streaming responses for chat interface
```

---

## Environment Configuration

### Required Variables
```env
# AI Integration (choose one)
OPENAI_API_KEY=sk-...                    # OpenAI API key
# OR
ANTHROPIC_API_KEY=sk-ant-...             # Anthropic API key

# Optional: Alternative provider
OPENAI_BASE_URL=https://api.z.ai/api/paas/v4/  # Z.AI endpoint
```

### Optional Variables
```env
# Web Search Integration
TAVILY_API_KEY=tvly-...                  # Tavily API key for web search

# AI Configuration
OPENAI_DEFAULT_MODEL=gpt-4               # Default AI model
API_TIMEOUT=60000                        # Request timeout (ms)
API_MAX_RETRIES=3                        # Retry attempts

# Feature Flags
NEXT_PUBLIC_DEMO_MODE=false              # Enable demo mode
NEXT_PUBLIC_DISABLE_TOUR=false           # Hide onboarding tour

# Deployment
PORT=3000                                # Server port
NODE_ENV=production                      # Environment
```

---

## Performance Considerations

### Optimization Strategies
1. **Code Splitting**: Automatic with Next.js App Router
2. **Image Optimization**: Next.js Image component (when images are added)
3. **Bundle Size**: Tree-shaking with webpack
4. **Lazy Loading**: Route-based code splitting
5. **Caching**: API response caching where appropriate

### Loading States
- Skeleton screens for AI responses
- Progressive loading for case studies
- Streaming responses for chat interface

---

## Deployment Options

### Option 1: Vercel (Recommended)
**Pros**:
- Zero configuration deployment
- Automatic HTTPS
- Global CDN
- Preview deployments
- Environment variable management

**Steps**:
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

**Build Command**: `npm run build`
**Output Directory**: `.next`

### Option 2: Self-Hosted
**Requirements**:
- Node.js 18+
- 1GB RAM minimum
- Linux/macOS/Windows

**Commands**:
```bash
npm run build
npm start
# Or with custom port
PORT=3001 npm start
```

**Production Considerations**:
- Use process manager (PM2, systemd)
- Configure reverse proxy (nginx, Apache)
- Enable HTTPS with Let's Encrypt
- Set up monitoring and logging

### Option 3: Docker
**Dockerfile** (to be created):
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## Security Considerations

### API Key Management
- **Never commit** `.env.local` to version control
- `.env.local` is in `.gitignore`
- Use `.env.example` as template
- In production, use platform environment variables

### Data Privacy
- No user account system required
- All data stored in browser (localStorage)
- No data sent to external servers except AI API calls
- AI API calls don't include PII by default

### CORS Configuration
- API routes handle CORS automatically in Next.js
- Custom CORS if deploying separately

---

## Browser Support

### Target Browsers
- **Chrome/Edge**: Last 2 versions
- **Firefox**: Last 2 versions
- **Safari**: Last 2 versions
- **Mobile**: iOS Safari 12+, Chrome Android

### Required Features
- ES2020+ JavaScript support
- CSS Grid and Flexbox
- Local Storage API
- Fetch API
- WebSocket (for streaming responses)

---

## Accessibility

### WCAG Compliance
- Radix UI components are WCAG compliant
- Keyboard navigation support
- ARIA labels where needed
- Focus management in modals
- Color contrast ratios (WCAG AA)

### Screen Reader Support
- Semantic HTML
- ARIA attributes
- Focus indicators
- Screen reader announcements

---

## Internationalization (i18n)

### Current Status
- English language only
- No built-in i18n framework

### Future Expansion
Potential for:
- Next.js i18n routing
- Translated case studies
- Multi-language AI model support
- RTL language support

---

## Monitoring & Analytics (Recommended Additions)

### Suggested Tools
- **Error Tracking**: Sentry
- **Analytics**: Vercel Analytics, Plausible
- **Performance**: Vercel Speed Insights
- **Uptime**: UptimeRobot, Pingdom

### Key Metrics to Track
- Phase completion rates
- Drop-off points
- API response times
- Error rates by phase
- User journey flows

---

## Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Runs on http://localhost:3000
# Hot reload enabled
# TypeScript checking in real-time
```

### Type Checking
```bash
# Type check without build
npx tsc --noEmit
```

### Linting
```bash
# Run ESLint
npm run lint

# Fix lint issues
npm run lint -- --fix
```

### Building
```bash
# Production build
npm run build

# Output: .next/ directory
# Optimized and minified
# Ready for deployment
```

---

## Known Limitations

1. **No Database**: All data stored in browser localStorage
2. **No Authentication**: No user accounts or login system
3. **Session-based**: Work lost if browser cache is cleared
4. **AI Dependency**: Requires valid API key to function
5. **Web Search Optional**: Tavily integration not required
6. **Single Session**: No multi-user collaboration

---

## Future Enhancement Possibilities

### Short-term
- [ ] Add user authentication (NextAuth.js)
- [ ] Database integration (Prisma + PostgreSQL)
- [ ] Team collaboration features
- [ ] Export to PowerPoint/Google Slides
- [ ] Additional case studies

### Long-term
- [ ] Mobile native apps (React Native)
- [ ] Real-time collaboration (WebSocket)
- [ ] Advanced financial modeling
- [ ] Investor matching platform
- [ ] Multi-language support
- [ ] White-label solution for organizations

---

## Support & Maintenance

### Documentation
- README.md with setup instructions
- Code comments for complex logic
- Type definitions in `/types`
- Environment variable template (`.env.example`)

### Troubleshooting
Common issues and solutions in README.md:
- Port conflicts
- API key problems
- Build errors
- Dependency issues

### Getting Help
- Development team contact
- Issue tracking (if repo is internal)
- Knowledge base (if available)
