/**
 * Returns the Roman numeral representation for a given hour in 24-hour format.
 * @param hour24 Hour in 24-hour format (0-23)
 * @returns Roman numeral string for the hour in 12-hour format
 */
export const romanNumeralForHour = (hour24: number) => {
	const hour12 = ((hour24 % 12) + 12) % 12 || 12
	const romanNumerals = [
		"I",
		"II",
		"III",
		"IV",
		"V",
		"VI",
		"VII",
		"VIII",
		"IX",
		"X",
		"XI",
		"XII",
	]
	return romanNumerals[hour12 - 1]
}

