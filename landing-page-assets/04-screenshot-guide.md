# Screenshot Guide for Innovation StarterKit

This guide provides detailed instructions for capturing screenshots that will showcase the Innovation StarterKit effectively on a landing page.

## Preparation Steps

### 1. Start the Development Server
```bash
cd /home/htr1hc/01_PJNE/07_innovation-starterkit
npm run dev
```

The application will be available at: **http://localhost:3000**

### 2. Enable Demo Mode (Recommended)
Demo mode provides pre-filled sample data, making it easier to capture meaningful screenshots without going through the entire workflow.

Edit `.env.local` and add:
```env
NEXT_PUBLIC_DEMO_MODE=true
```

Or run:
```bash
echo "NEXT_PUBLIC_DEMO_MODE=true" >> .env.local
npm run dev
```

### 3. Browser Setup
- Use **Chrome** or **Firefox** for best screenshot quality
- Open DevTools (F12) and toggle device toolbar if needed
- Recommended viewport: **1920x1080** (desktop) or **1440x900**
- Consider using browser extensions for clean screenshots (e.g., "Full Page Screen Capture")

---

## Essential Screenshots

### 1. Hero / Main Interface Shot

**Purpose**: Primary visual for the landing page hero section

**URL**: http://localhost:3000/challenge

**What to capture**:
- Full browser window showing the Challenge phase
- Chat panel on the left (with some conversation visible)
- Progress tracker on the right (if visible)
- Clean, uncluttered view

**Tips**:
- Dark mode often looks more impressive
- Ensure some AI response is visible in the chat
- Hide browser UI elements (bookmarks bar, etc.)

**Recommended dimensions**: 1600x900px or 1200x800px

**Example capture**:
```
1. Navigate to /challenge
2. In demo mode, the chat will have pre-filled content
3. Scroll to show a good balance of chat and progress
4. Take screenshot at full window width
```

---

### 2. Complete Workflow / Process Visual

**Purpose**: Show the 5-phase progression

**URL**: http://localhost:3000/pitch (final phase)

**What to capture**:
- All 5 phases visible in the progress indicator
- Ideally showing completion checkmarks for early phases
- Summary content from the pitch phase

**Tips**:
- Take this after completing all phases (or use demo mode with saved progress)
- Show how the phases connect
- Dark mode with accent colors looks professional

**Recommended dimensions**: 1400x700px

---

### 3. Case Study Modal

**Purpose**: Showcase the learning/education aspect

**URL**: Any phase, click on a case study

**What to capture**:
- Case study modal overlay
- Tesla or Nest case study (most recognizable)
- The structured breakdown showing all 5 phases for that company
- Metrics and key learnings section

**Tips**:
- Tesla case study is most compelling for most audiences
- Capture the modal with the page slightly dimmed behind it
- Ensure the company logo/title is clearly visible

**Recommended dimensions**: 1000x700px

**How to access**:
```
1. Navigate to any phase
2. Look for "Case Studies" button or link
3. Click on "Tesla" case study
4. Take screenshot of the modal
```

---

### 4. Market Analysis Visualization

**Purpose**: Show data-driven insights capability

**URL**: http://localhost:3000/market

**What to capture**:
- Market sizing display (TAM/SAM/SOM)
- Market trends section
- Competitive landscape
- Charts or visual elements if present

**Tips**:
- Ensure the market size breakdown is visible
- Color-coded sections look good
- Show some of the AI-generated analysis

**Recommended dimensions**: 1200x800px

---

### 5. Ideation Cards

**Purpose**: Show multiple business concept generation

**URL**: http://localhost:3000/ideation

**What to capture**:
- Multiple idea cards displayed
- Each card showing different business concepts
- Metrics/evaluations on each card
- Selection mechanism

**Tips**:
- Show at least 2-3 idea cards
- Make sure the difference between ideas is visible
- Capture any comparison or scoring elements

**Recommended dimensions**: 1400x800px

---

### 6. Investment Appraisal Dashboard

**Purpose**: Show financial analysis capabilities

**URL**: http://localhost:3000/investment-appraisal

**What to capture**:
- Revenue model section
- Funding requirements
- ROI projections
- Use of funds breakdown

**Tips**:
- Financial data looks professional in tables/charts
- Color-coded categories (R&D, Marketing, etc.)
- Show percentage breakdowns visually

**Recommended dimensions**: 1200x700px

---

## Optional Enhanced Screenshots

### 7. Dark vs Light Mode Comparison

**Purpose**: Show theme customization

**What to capture**: Two screenshots side-by-side showing the same view in both modes

**Tips**:
- Use consistent viewport and content
- Great for showing UI flexibility
- Good for "Features" section

---

### 8. Mobile Responsiveness

**Purpose**: Show cross-device compatibility

**What to capture**:
- Browser DevTools mobile view (iPhone or Android)
- Responsive layout adaptation
- Touch-friendly interface

**Tips**:
- Use iPhone 14 Pro or similar viewport (393x852)
- Show vertical layout
- Demonstrate mobile chat interface

**Recommended dimensions**: 400x850px (portrait)

---

### 9. PDF Export Preview

**Purpose**: Show professional output generation

**What to capture**:
- Export dialog or confirmation
- Preview of generated document
- Download indication

**Tips**:
- Shows practical utility
- Demonstrates professional output
- Good for B2B audience

---

## Screenshot Best Practices

### Technical Quality
1. **Resolution**: Minimum 1920px width for desktop, scale down as needed
2. **Format**: PNG for quality, WebP for web optimization
3. **File size**: Compress for web (aim for under 500KB per image)
4. **Naming**: Use descriptive names (e.g., `hero-interface.png`, `market-analysis.png`)

### Visual Composition
1. **Clean UI**: Remove browser chrome, bookmarks, extensions
2. **Consistent styling**: Use same theme (dark or light) for all screenshots
3. **Content density**: Don't overcrowd - white space is good
4. **Focus**: Ensure the main feature is clearly visible

### Content Tips
1. **Real data**: Use demo mode data rather than empty states
2. **Company names**: Use recognizable company names in case studies
3. **Human element**: Show chat/AI interaction to feel personal
4. **Progress**: Show completed phases with checkmarks

### Tools to Use
1. **Built-in**: OS screenshot tools (Windows: Win+Shift+S, Mac: Cmd+Shift+4)
2. **Browser extensions**: "Full Page Screen Capture" for Chrome
3. **Professional**: Snagit, CleanShot X, or similar
4. **Automation**: Playwright or Puppeteer scripts (available in this repo!)

---

## Automated Screenshot Capture

The repository includes Puppeteer for automated screenshots. To use:

```bash
# Install dependencies if not already installed
npm install

# The repo has mcp-browser-test.js which can be adapted
# Or create a new script in the scripts directory
```

Example automation script concept:
```javascript
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // Navigate to challenge page
  await page.goto('http://localhost:3000/challenge');
  await page.waitForSelector('chat-interface');

  // Take screenshot
  await page.screenshot({ path: 'screenshots/hero.png', fullPage: false });

  await browser.close();
})();
```

---

## Post-Processing Recommendations

### For Web Display
1. **Optimize**: Use TinyPNG or ImageOptim to compress
2. **Format**: WebP for modern browsers, PNG as fallback
3. **Responsive**: Create multiple sizes (1x, 2x) for retina displays
4. **Lazy loading**: Implement for better page load performance

### For Presentations
1. **Add shadows**: Subtle drop shadows for depth
2. **Rounded corners**: 8-12px radius for modern look
3. **Background**: Place on neutral gradient or solid color
4. **Annotations**: Add arrows/callouts to highlight features

---

## Screenshot Checklist

Use this checklist to ensure you have all needed assets:

- [ ] Hero/main interface shot (dark mode)
- [ ] Hero/main interface shot (light mode) - optional
- [ ] Complete 5-phase workflow visual
- [ ] Case study modal (Tesla recommended)
- [ ] Market analysis with data visualization
- [ ] Ideation cards showing multiple ideas
- [ ] Investment appraisal dashboard
- [ ] Mobile responsive view
- [ ] Export/generation functionality
- [ ] Dark/light mode comparison (optional)

---

## File Organization

Organize screenshots in a clear structure:

```
landing-page-assets/
├── screenshots/
│   ├── hero/
│   │   ├── hero-dark-1600x900.png
│   │   └── hero-light-1600x900.png
│   ├── workflow/
│   │   └── 5-phase-progress-1400x700.png
│   ├── case-studies/
│   │   └── tesla-modal-1000x700.png
│   ├── features/
│   │   ├── market-analysis-1200x800.png
│   │   ├── ideation-cards-1400x800.png
│   │   └── investment-appraisal-1200x700.png
│   └── responsive/
│       └── mobile-view-400x850.png
```

---

## Quick Start Command Sequence

```bash
# 1. Navigate to project
cd /home/htr1hc/01_PJNE/07_innovation-starterkit

# 2. Enable demo mode
echo "NEXT_PUBLIC_DEMO_MODE=true" >> .env.local

# 3. Start server
npm run dev

# 4. Open browser
# Chrome: http://localhost:3000

# 5. Take screenshots following guide above

# 6. (Optional) Create output directory
mkdir -p landing-page-assets/screenshots/{hero,workflow,case-studies,features,responsive}
```

---

## Need Help?

If screenshots don't look right:
- Clear browser cache and reload
- Ensure demo mode is enabled (check .env.local)
- Try incognito/private browsing mode
- Check browser console for errors
- Verify the dev server is running without errors
