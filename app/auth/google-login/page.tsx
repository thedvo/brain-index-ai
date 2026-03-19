import GoogleLoginForm from './google-login-form'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'

export default async function GoogleLoginPage() {
	const supabase = await createSupabaseServerClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	console.log({ user })
	return <GoogleLoginForm user={user} />
}
