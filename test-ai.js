/**
 * Test script for AI integration
 * 
 * PREREQUISITES:
 * 1. Dev server must be running: npm run dev
 * 2. You must have a Supabase user account created at http://localhost:3000/auth
 * 3. You must be logged in (have an active session)
 * 
 * MANUAL TEST INSTRUCTIONS:
 * Since API routes require Supabase authentication, follow these steps:
 * 
 * 1. Open http://localhost:3000/auth in your browser
 * 2. Sign up or log in
 * 3. Open browser DevTools → Console
 * 4. Copy and paste this code:
 * 
 * ```javascript
 * // Test AI Integration
 * async function testAI() {
 *   console.log('🧪 Testing AI Integration...')
 *   
 *   // Save an article
 *   console.log('📥 Saving article...')
 *   const saveRes = await fetch('/api/articles/save', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ url: 'https://paulgraham.com/writes.html' })
 *   })
 *   const saveData = await saveRes.json()
 *   console.log('✅ Article saved:', saveData.article.title)
 *   
 *   // Process with AI
 *   const articleId = saveData.article.id
 *   console.log('🤖 Processing with AI (may take 10-30 seconds)...')
 *   const aiRes = await fetch('/api/ai/process', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ articleId })
 *   })
 *   const aiData = await aiRes.json()
 *   
 *   console.log('✅ AI processing complete!')
 *   console.log('📝 Summary:', aiData.article.ai_summary)
 *   console.log('🔑 Key Points:', aiData.article.ai_key_points)
 *   console.log('✨ Highlights:', aiData.article.ai_highlights)
 *   
 *   return aiData
 * }
 * 
 * // Run the test
 * testAI()
 * ```
 * 
 * EXPECTED RESULTS:
 * - Article saved successfully with title
 * - AI summary (2-3 paragraphs)
 * - Key points (3-5 items with citations)
 * - Highlights (5-8 quotes with character positions)
 * - Processing status: "completed"
 */

console.log(`
╔════════════════════════════════════════════════════════════════╗
║                 AI Integration Test Instructions                ║
╚════════════════════════════════════════════════════════════════╝

⚠️  This test requires browser authentication

STEPS:
1. Go to: http://localhost:3000/auth
2. Sign up or log in with Supabase
3. Open browser DevTools (F12) → Console tab  
4. Copy the test function from test-ai.js
5. Paste into console and press Enter

OR use the quick test below if you're already logged in:

──────────────────────────────────────────────────────────────────
QUICK BROWSER TEST (paste in console):
──────────────────────────────────────────────────────────────────

fetch('/api/articles/save', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({url: 'https://paulgraham.com/writes.html'})
}).then(r => r.json()).then(data => {
  console.log('✅ Saved:', data.article.title)
  return fetch('/api/ai/process', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({articleId: data.article.id})
  })
}).then(r => r.json()).then(result => {
  console.log('✅ AI Result:')
  console.log('Summary:', result.article.ai_summary)
  console.log('Key Points:', result.article.ai_key_points.length)
  console.log('Highlights:', result.article.ai_highlights.length)
})

──────────────────────────────────────────────────────────────────
`)

		
		const saveResponse = await fetch(`${API_BASE}/api/articles/save`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ url: TEST_URL }),
		})

		if (!saveResponse.ok) {
			throw new Error(`Save failed: ${saveResponse.status} ${await saveResponse.text()}`)
		}

		const saveData = await saveResponse.json()
		console.log('✅ Article saved!')
		console.log(`   ID: ${saveData.article.id}`)
		console.log(`   Title: ${saveData.article.title}`)
		console.log(`   Status: ${saveData.article.processing_status}`)
		console.log(`   Already existed: ${saveData.alreadyExists || false}\n`)

		const articleId = saveData.article.id

		// Step 2: Process with AI
		console.log('🤖 Step 2: Processing with AI (this may take 10-30 seconds)...')
		
		const processResponse = await fetch(`${API_BASE}/api/ai/process`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ articleId }),
		})

		if (!processResponse.ok) {
			const errorText = await processResponse.text()
			throw new Error(`AI processing failed: ${processResponse.status} ${errorText}`)
		}

		const processData = await processResponse.json()
		console.log('✅ AI processing complete!\n')

		// Step 3: Display results
		console.log('📊 Results:')
		console.log('─'.repeat(80))
		
		console.log('\n📝 Summary:')
		console.log(processData.article.ai_summary)
		
		console.log('\n🔑 Key Points:')
		processData.article.ai_key_points.forEach((kp, i) => {
			console.log(`\n${i + 1}. ${kp.point}`)
			console.log(`   Citations: [${kp.citations.join(', ')}]`)
		})
		
		console.log('\n✨ Highlights:')
		processData.article.ai_highlights.forEach((h, i) => {
			console.log(`\n${i + 1}. [${h.citationId}] "${h.sourceText.slice(0, 100)}${h.sourceText.length > 100 ? '...' : ''}"`)
			console.log(`   Position: chars ${h.startChar}-${h.endChar}`)
			console.log(`   Referenced by: ${h.referencedBy.length} key point(s)`)
		})

		console.log('\n' + '─'.repeat(80))
		console.log('\n✅ All tests passed! AI integration is working correctly.')
		
	} catch (error) {
		console.error('\n❌ Test failed:', error.message)
		process.exit(1)
	}
}

// Run the test
testAIIntegration()
