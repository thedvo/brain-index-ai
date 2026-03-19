import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import { redirect } from 'next/navigation'
import DashboardContent from './dashboard-content'

export default async function DashboardPage() {
	const supabase = await createSupabaseServerClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	// Redirect to auth if not authenticated
	if (!user) {
		redirect('/auth')
	}

	return <DashboardContent user={user} />
}
