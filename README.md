# Synthesis Log with AI Integration

A four-stage circular reflection application designed to help users concentrate on subjects by randomly defining and amalgamating terms in custom sets. The app features integrated AI assistance, multi-set blending, and a perpetual spiral learning model.

![Synthesis Log Screenshot](https://via.placeholder.com/800x400?text=Synthesis+Log+Interface)

## Overview

Synthesis Log guides users through a structured reflection process using rotating term banks. Each term progresses through four stages over multiple days, creating deep conceptual connections and insights.

### The Four Stages

1. **History** - Historical context and background associations
2. **Concrete/Abstract** - Observable facts and theoretical frameworks
3. **Amalgamation** - Synthesis with other terms to find connections
4. **Motion** - Proposed actions or applications based on insights

## Key Features

### 🎯 Multi-Set Selection
- Select 2+ term lists at the outset for cross-disciplinary learning
- Choose from three modes:
  - **Sequential**: Terms appear in original list order
  - **Shuffled**: Terms randomized within each list separately
  - **Blended**: All lists shuffled together for maximum amalgamation

### 🤖 Integrated AI Assistant
- AI chat panel embedded directly in each reflection stage
- Contextual prompts based on current term and stage
- No page navigation required - everything stays in-app

### 🌈 Color-Coded Learning Journey
- Each term list has a signature hue (Music Theory = amber, Physics = cyan, etc.)
- Progress bar displays gradient of all selected list hues
- Source list indicators (colored dots) show term origins
- Visual transition cues on Day N-2 prompt spiral continuation

### 📚 12 Preset Term Lists
- **Music Theory** - Scales, harmony, rhythm concepts
- **Art & Design** - Composition, color theory, techniques
- **Geography** - Landforms, climate, cultural regions
- **Computer Science** - Algorithms, data structures, paradigms
- **Physics** - Mechanics, energy, waves
- **Biology** - Cells, evolution, ecosystems
- **Philosophy** - Ethics, logic, metaphysics
- **Psychology** - Cognition, behavior, development
- **Economics** - Markets, trade, policy
- **Literature** - Narrative, genre, literary devices
- **Feel-Good Words** - Positive concepts and emotions
- **Verbs of Motion** - Action and movement vocabulary

### 🔄 Perpetual Spiral Model
- Seamless list transitions create continuous learning
- Day N-2 prompt to add new lists prevents abrupt endings
- Multi-segment progress bar visualizes entire learning journey
- Terms from ending lists overlap with new list ramp-up

### 💾 Data Management
- JSON export/import for local backup
- CSV upload for custom term lists
- Google Sheets integration (import term banks via public URL)
- Database persistence for all reflections and progress

### 🎨 Theme Support
- Light/dark mode toggle
- Warm academic color palette
- Responsive design for mobile and desktop

## How It Works

### Ramp-Up Phase (Days 1-3)
Terms gradually enter the rotation:
- **Day 1**: 1 term (History only)
- **Day 2**: 2 terms (History, Concrete)
- **Day 3**: 3 terms (History, Concrete, Amalgam)
- **Day 4+**: Full 4-term rotation

### Active Phase
Each day presents four terms at different stages. You reflect on each term according to its current stage, building deeper understanding over time.

### Transition Zone (Day N-2)
When approaching the end of a term list, the app prompts you to add another list. This creates thematic bridges between subjects (e.g., ending Music Theory while beginning Art & Design).

### Wind-Down Phase (Last 3 Days)
Terms exit the rotation gracefully while new terms from the next list enter, maintaining the perpetual spiral.

## Multi-Set Blended Mode Example

Imagine selecting **Music Theory**, **Physics**, and **Art & Design** in Blended mode:

**Day 4 might present:**
- **History**: Counterpoint (Music)
- **Concrete**: Gravity (Physics)
- **Amalgam**: Chiaroscuro (Art)
- **Motion**: Resonance (Music)

This creates unexpected conceptual connections across disciplines!

## Technical Stack

### Frontend
- React 19 with TypeScript
- Tailwind CSS 4 for styling
- Wouter for routing
- tRPC for type-safe API calls
- shadcn/ui components

### Backend
- Node.js with Express
- tRPC 11 for API layer
- Drizzle ORM for database
- MySQL/TiDB database
- JWT authentication

### AI Integration
- Built-in LLM API (Manus Forge)
- Streaming responses with markdown rendering
- Contextual prompts per reflection stage

### Storage
- S3-compatible object storage
- Database for metadata and reflections
- JSON export for portability

## Getting Started

### Prerequisites
- Node.js 22+
- pnpm package manager
- MySQL or TiDB database

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd synthesis-log-ai

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Push database schema
pnpm db:push

# Start development server
pnpm dev
```

### Environment Variables

```env
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=your-jwt-secret
BUILT_IN_FORGE_API_KEY=your-llm-api-key
BUILT_IN_FORGE_API_URL=https://api.example.com
```

## Usage Guide

### Starting a New Spiral

1. Click **"Add Term List"** on the home screen
2. Select one or more preset lists (or upload CSV)
3. Choose your spiral mode (Sequential, Shuffled, or Blended)
4. Click **"Start Spiral"**

### Daily Reflection Workflow

1. Review the circular workflow diagram showing today's four terms
2. For each active stage, write your reflection in the textarea
3. Click **AI Assistant** to get contextual prompts
4. Use suggested prompts or ask your own questions
5. Click **"Save Reflections"** to persist your work

### Continuing the Spiral

When you reach Day N-2, a **"Continue the Spiral"** button appears:
1. Click to open the list selector
2. Choose additional lists to blend in
3. Select your preferred mode
4. The spiral continues seamlessly!

### Exporting Your Work

- **JSON Export**: Click "Export" in the header to download all data
- **JSON Import**: Click "Import" to restore from a previous export
- **Manual Backup**: Use the Management UI → Code panel to download files

## Deployment Options

### Option 1: Manus Hosting (Recommended)
1. Click **Publish** in the Management UI
2. Get instant live URL: `yourproject.manus.space`
3. Add custom domain if desired
4. All backend services included

### Option 2: Self-Hosting
Deploy to platforms like Railway, Render, or Vercel:
1. Set up environment variables
2. Configure database connection
3. Deploy backend and frontend
4. Set up S3-compatible storage

### Option 3: Docker
```bash
docker build -t synthesis-log .
docker run -p 3000:3000 --env-file .env synthesis-log
```

## Project Structure

```
synthesis-log-ai/
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React contexts
│   │   └── lib/           # tRPC client setup
├── server/                # Backend Express + tRPC
│   ├── routers.ts         # API endpoints
│   ├── db.ts              # Database queries
│   ├── _core/             # Framework internals
│   └── *.test.ts          # Vitest tests
├── drizzle/               # Database schema
│   └── schema.ts
├── shared/                # Shared types and utilities
│   ├── presets.ts         # Preset term lists
│   ├── spiralQueue.ts     # Queue logic
│   └── types.ts           # TypeScript types
└── README.md              # This file
```

## API Documentation

### tRPC Procedures

#### `termBank.create`
Create a new term bank
```typescript
input: { name: string; terms: string[]; hue?: number }
output: { id: number; name: string; ... }
```

#### `reflection.save`
Save a day's reflections
```typescript
input: { 
  day: number; 
  history: string; 
  concrete: string; 
  amalgam: string; 
  motion: string; 
}
output: { id: number; ... }
```

#### `ai.chat`
Get AI assistance for a reflection
```typescript
input: { 
  reflectionId: number; 
  stage: string; 
  term: string; 
  message: string; 
}
output: { response: string }
```

## Customization

### Adding Custom Term Lists

**Via CSV Upload:**
1. Create a CSV file with one term per line
2. Click "CSV Upload" tab in the list selector
3. Upload your file

**Via Code:**
Edit `shared/presets.ts` to add new preset lists:
```typescript
export const PRESET_LISTS = [
  {
    id: "my-custom-list",
    name: "My Custom List",
    hue: 120, // 0-360 color wheel
    terms: ["term1", "term2", "term3", ...]
  }
];
```

### Customizing AI Prompts

Edit `server/routers.ts` in the `ai.chat` procedure to customize system prompts per stage.

### Changing Theme Colors

Edit `client/src/index.css` to modify the color palette:
```css
:root {
  --primary: 35 80% 55%; /* OKLCH format */
  --background: 35 15% 98%;
  /* ... */
}
```

## Testing

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test server/spiralQueue.test.ts

# Watch mode
pnpm test --watch
```

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` in `.env`
- Ensure database server is running
- Check firewall rules for remote connections

### AI Chat Not Working
- Verify `BUILT_IN_FORGE_API_KEY` is set
- Check API endpoint URL
- Review server logs for error messages

### Progress Bar Not Updating
- Clear browser cache
- Check that reflections are saving (look for success toast)
- Verify `currentDay` is incrementing correctly

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - feel free to use this project for personal or educational purposes.

## Acknowledgments

- Original Synthesis Log concept from [kappter/SynthesisLog](https://github.com/kappter/SynthesisLog)
- Built with [Manus](https://manus.im) development platform
- UI components from [shadcn/ui](https://ui.shadcn.com)

## Support

For questions or issues:
- Open an issue on GitHub
- Contact via [your-email@example.com]
- Visit the project website

## Roadmap

- [ ] Reflection history calendar view
- [ ] Motion gallery export to PDF
- [ ] Capacity warnings and auto-archive
- [ ] Badge system for completed spirals
- [ ] Social sharing of interesting amalgamations
- [ ] Mobile app (React Native)
- [ ] Collaborative spirals (team mode)

---

**Happy Learning! 🌀**
