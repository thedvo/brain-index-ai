# 🧠 Brain Index AI

> **Your intelligent personal knowledge base powered by AI**

Brain Index AI is a modern web application that transforms how you read, understand, and retain information from online articles. Simply paste any article URL, and our AI instantly generates comprehensive summaries, extracts key insights, highlights important passages, and enriches content with contextual Wikipedia links—all while letting you add your own personal notes.

---

## Key Features

### 🤖 AI-Powered Analysis
- **Instant Summaries**: Claude AI generates concise 2-3 paragraph summaries that capture the essence of any article
- **Smart Key Points**: Automatically extracts 3-5 main insights with supporting citations from the original text
- **Intelligent Highlights**: Identifies and highlights 5-8 of the most important passages worth remembering
- **Important Terms Detection**: Recognizes key concepts, methodologies, and technical terms for deeper exploration

### 📝 Personal Knowledge Management
- **Custom Notes**: Add your own thoughts, insights, and reflections directly to articles with auto-save
- **Smart Filtering**: Sort articles by date or title
- **Search Functionality**: Quickly find articles in your collection

### 🔗 Content Enrichment
- **Wikipedia Integration**: Automatic Wikipedia links for important terms and concepts
- **Citation Tracking**: Every AI-generated insight links back to the exact quote in the original article
- **Metadata Extraction**: Automatically captures author, publication date, and article metadata
- **Archive Support**: Works with archive.is and archive.org URLs for accessing paywalled content

### 🎨 Enhanced Reading Experience
- **Multiple Reading Themes**: Choose from various carefully designed reading themes optimized for different preferences
- **Clean Article View**: Distraction-free reading with sanitized, properly formatted content
- **Responsive Design**: Seamless experience across desktop, tablet, and mobile devices
- **Real-time Updates**: Live processing status and instant UI updates

<img width="1710" height="954" alt="Screenshot 2026-03-30 at 11 32 34 AM" src="https://github.com/user-attachments/assets/7fb03b75-0418-4ed1-a276-6c7b968496ed" />

---

## Unique Features

What sets Brain Index AI apart:

1. **Permanent AI Analysis**: Articles are analyzed once and saved forever—no re-processing means consistent insights and lower costs
2. **Source Attribution**: All AI-generated content includes exact citations linking back to the original text
3. **Processing Safeguards**: Built-in protection prevents duplicate processing and handles errors gracefully
4. **Archive Service Support**: Seamlessly extracts content from archive services to access paywalled articles
5. **Wikipedia Context Layer**: Automatically enriches your reading with relevant background information
6. **Real-time Processing**: Watch your article transform in real-time as AI analysis completes
7. **Multi-Auth Options**: Flexible authentication with email/password or Google OAuth

<img width="1705" height="947" alt="Screenshot 2026-03-30 at 11 32 58 AM" src="https://github.com/user-attachments/assets/24bf9eea-6dfd-4ba4-b4e3-0bb17651ee54" />

---

## 🛠️ Tech Stack

### Frontend
- **[Next.js 16](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - Latest React with Server Components
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first styling
- **[shadcn/ui](https://ui.shadcn.com/)** - High-quality React components
- **[Radix UI](https://www.radix-ui.com/)** - Accessible component primitives
- **[Lucide React](https://lucide.dev/)** - Beautiful icon library

### Backend & AI
- **[Supabase](https://supabase.com/)** - PostgreSQL database, authentication, and real-time subscriptions
- **[Anthropic Claude](https://www.anthropic.com/)** - AI-powered article analysis (Claude Sonnet 3.5)
- **[Mozilla Readability](https://github.com/mozilla/readability)** - Article content extraction
- **[sanitize-html](https://github.com/apostrophecms/sanitize-html)** - Content sanitization and security

### Infrastructure
- **[Vercel](https://vercel.com/)** - Hosting and deployment
- **[Vercel Analytics](https://vercel.com/analytics)** - Usage analytics
- **PostgreSQL** - Primary database via Supabase

---

## 🔄 How It Works: Article Processing Flow

Brain Index AI processes articles through a sophisticated multi-stage pipeline:

### 1️⃣ **Article Submission**
```
User pastes URL → Validation → Submit
```
- User enters any article URL (including archive services)
- URL validation ensures proper format
- Article is queued for processing

### 2️⃣ **URL Fetching & Parsing**
```
Fetch HTML → Detect Archive Service → Extract Original URL
```
- **HTTP Fetch**: Downloads the article HTML content
- **Archive Detection**: Identifies if URL is from archive.is or archive.org
- **URL Extraction**: Retrieves the original article URL for proper attribution

### 3️⃣ **Content Extraction**
```
HTML → Mozilla Readability → Clean Content + Metadata
```
- **Readability Parser**: Extracts main article content, removing ads, navigation, and clutter
- **Metadata Extraction**: Captures title, author, publication date, and description
- **Word Count**: Calculates article length for processing estimates

### 4️⃣ **Content Sanitization**
```
Raw HTML → Sanitize → Safe HTML for Storage
```
- **Security Filtering**: Removes potentially dangerous HTML/JavaScript
- **Format Preservation**: Keeps paragraphs, headings, lists, and formatting
- **Safe Storage**: Ensures content is safe to render in the application

### 5️⃣ **Database Storage**
```
Sanitized Content → Supabase → Article Record Created
```
- **Initial Save**: Article stored with status "pending" or "processing"
- **User Association**: Linked to authenticated user account
- **Metadata Storage**: All extracted metadata saved for display

### 6️⃣ **AI Analysis with Claude**
```
Plain Text Extraction → Claude API → Structured Analysis
```
- **Text Preparation**: HTML converted to plain text for AI analysis
- **Claude Processing**: Sends article to Claude Sonnet 3.5 with specialized prompts
- **Structured Output**: Receives JSON with summary, key points, highlights, and terms
- **Citation Generation**: AI quotes exact text from article for verification

**AI Output Structure:**
```json
{
  "summary": "2-3 paragraph overview...",
  "keyPoints": [
    {
      "point": "Main insight",
      "citations": ["exact quote 1", "exact quote 2"]
    }
  ],
  "highlights": ["Important quote 1", "Important quote 2"],
  "importantTerms": ["Term 1", "Term 2", "Term 3"]
}
```

### 7️⃣ **Wikipedia Enrichment**
```
Important Terms → Wikipedia API → Context Links
```
- **Term Detection**: Identifies technical terms, concepts, and entities from AI analysis
- **Wikipedia Search**: Queries Wikipedia API for each term
- **Link Generation**: Creates clickable links to relevant Wikipedia articles
- **Context Addition**: Enriches reading experience with background information

### 8️⃣ **Final Storage & Display**
```
AI Results → Database Update → Mark Complete → Display to User
```
- **Permanent Storage**: AI analysis saved to database (never regenerated)
- **Status Update**: Article marked as "completed"
- **Real-time Sync**: UI updates instantly via Supabase real-time subscriptions
- **User Notification**: Success message confirms processing completion


### 🔒 **Processing Safeguards**

- **Duplicate Prevention**: Checks if article already processed before starting
- **Status Tracking**: Monitors processing state (`pending`, `processing`, `completed`, `failed`)
- **Error Handling**: Gracefully handles failures and updates status accordingly
- **Cost Optimization**: Single AI analysis per article, never re-processes

---

## 🏃 Getting Started

### Prerequisites

- **Node.js 18+** installed
- **npm** or **yarn** or **pnpm** or **bun**
- **Supabase account** (free tier available)
- **Anthropic API key** (Claude AI)

### 1. Clone the Repository

```bash
git clone https://github.com/thedvo/brain-index-ai.git
cd brain-index-ai
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Project Settings** → **API** and copy:
   - **Project URL**
   - **Anon Public Key**
3. Run the database migrations:

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### 4. Get Your Claude API Key

1. Sign up at [console.anthropic.com](https://console.anthropic.com)
2. Navigate to **Settings** → **API Keys**
3. Create a new API key

### 5. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Anthropic API Configuration
# Get your API key from: https://console.anthropic.com/settings/keys
ANTHROPIC_API_KEY=your-anthropic-api-key
```

### 6. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

---

## 🌐 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add environment variables in **Project Settings** → **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ANTHROPIC_API_KEY`
4. Deploy!

Alternatively, use the Vercel CLI:

```bash
npm i -g vercel
vercel
```

### Configure Production Environment

For production, make sure to:
- Set all environment variables in Vercel dashboard
- Enable Supabase Row Level Security (RLS) policies
- Configure your Supabase authentication settings
- Set up custom domain (optional)

---

## 📝 Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | ✅ | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ | `eyJhbGc...` |
| `ANTHROPIC_API_KEY` | Claude AI API key | ✅ | `sk-ant-api03-...` |
