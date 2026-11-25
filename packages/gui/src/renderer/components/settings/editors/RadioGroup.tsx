/**
 * RadioGroup component: a styled radio button group with label and optional description.
 * Used in settings pages for single-choice configuration options.
 */

export function RadioGroup<T extends string>({
	value,
	onChange,
	options,
	name,
}: {
	value: T;
	onChange: (value: T) => void;
	options: { value: T; label: string; description?: string }[];
	name: string;
}) {
	return (
		<div className="space-y-1" role="radiogroup">
			{options.map(option => (
				<label
					className={`flex cursor-pointer items-start gap-2.5 rounded-md border px-2.5 py-2 transition-colors ${
						value === option.value
							? "border-(--omsk-border-accent) bg-[color-mix(in_srgb,var(--omsk-link)_8%,transparent)]"
							: "border-(--omsk-border-muted) hover:bg-(--omsk-bg-tertiary)"
					}`}
					key={option.value}
				>
					<input
						checked={value === option.value}
						className="mt-0.5 accent-(--omsk-accent)"
						name={name}
						onChange={() => onChange(option.value)}
						type="radio"
					/>
					<span className="min-w-0">
						<span className="block text-omsk-xs font-medium text-(--omsk-text)">{option.label}</span>
						{option.description && (
							<span className="mt-0.5 block text-omsk-sm leading-snug text-(--omsk-muted)">
								{option.description}
							</span>
						)}
					</span>
				</label>
			))}
		</div>
	);
}
