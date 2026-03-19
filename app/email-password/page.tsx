import EmailPasswordDemo from './EmailPasswordDemo'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'

export default async function EmailPasswordPage() {
	// instantiate Supabase client
	const supabase = await createSupabaseServerClient()
	// grab the user property from the Supabase instance
	const {
		data: { user },
	} = await supabase.auth.getUser()

	return <EmailPasswordDemo user={null} />
}
