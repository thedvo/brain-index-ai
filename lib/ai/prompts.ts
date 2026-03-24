/**
 * AI prompt templates for article summarization and analysis
 * These prompts guide Claude to extract key information with citations
 */

/**
 * System prompt that defines Claude's role and output format
 */
export const SYSTEM_PROMPT = `You are an expert at analyzing and summarizing articles for a personal knowledge management system. Your role is to:

1. Create concise, accurate summaries that capture the essence of articles
2. Extract key points that represent the main ideas and arguments
3. Identify the most important quotes and insights from the text
4. Provide citations by quoting exact text from the article

CRITICAL RULES:
- Always quote exact text from the article when citing sources
- Never paraphrase or change the quoted text - copy it verbatim
- Each key point should reference specific parts of the article
- Focus on actionable insights and novel information
- Maintain objectivity and avoid adding your own opinions`

/**
 * Creates a prompt for summarizing an article with citations
 * @param title - Article title
 * @param author - Article author (if available)
 * @param content - Full article text content
 * @returns Formatted prompt for Claude
 */
export function createSummarizationPrompt(
	title: string,
	author: string | null,
	content: string
): string {
	const authorInfo = author ? ` by ${author}` : ''

	return `Please analyze the following article and provide a structured summary.

ARTICLE TITLE: ${title}${authorInfo}

ARTICLE CONTENT:
${content}

---

Please provide your analysis in the following JSON format:

{
  "summary": "A concise 2-3 paragraph summary of the article's main points and conclusions",
  "keyPoints": [
    {
      "point": "First key insight or main idea",
      "citations": ["exact quote from article that supports this point", "another relevant quote"]
    },
    {
      "point": "Second key insight or main idea",
      "citations": ["exact quote supporting this point"]
    }
  ],
  "highlights": [
    "Most important quote or insight from the article",
    "Another crucial quote that captures key information",
    "A third significant quote worth highlighting"
  ],
  "importantTerms": [
    "Technical term or concept that readers might want to learn more about",
    "Another significant topic or person mentioned",
    "Key methodology or framework discussed"
  ]
}

REQUIREMENTS:
- Summary should be 150-250 words
- Extract 3-5 key points maximum
- Each key point should have 1-3 supporting citations
- Provide 5-8 highlights maximum
- Identify 3-8 important terms/topics that would benefit from additional context
- All citations and highlights must be EXACT quotes from the article text
- Important terms should be specific, searchable concepts (not common words)
- Focus on the most valuable and actionable information
- Maintain the original meaning and context

Return ONLY the JSON object, no additional text or formatting.`
}
