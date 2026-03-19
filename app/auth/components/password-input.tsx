'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, Eye, EyeOff } from 'lucide-react'

type PasswordInputProps = {
	id: string
	label: string
	value: string
	onChange: (value: string) => void
	placeholder?: string
	required?: boolean
	minLength?: number
}

export function PasswordInput({
	id,
	label,
	value,
	onChange,
	placeholder = 'At least 6 characters',
	required = true,
	minLength = 6,
}: PasswordInputProps) {
	const [showPassword, setShowPassword] = useState(false)

	return (
		<div className="space-y-2">
			<Label htmlFor={id} className="text-slate-200">
				{label}
			</Label>
			<div className="relative">
				<Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
				<Input
					id={id}
					type={showPassword ? 'text' : 'password'}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					required={required}
					minLength={minLength}
					placeholder={placeholder}
					className="border-white/10 bg-[#0b1b18] pl-10 pr-10 text-white placeholder:text-slate-500"
				/>
				<button
					type="button"
					onClick={() => setShowPassword(!showPassword)}
					className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
					aria-label={showPassword ? 'Hide password' : 'Show password'}
				>
					{showPassword ? (
						<EyeOff className="h-4 w-4" />
					) : (
						<Eye className="h-4 w-4" />
					)}
				</button>
			</div>
		</div>
	)
}
