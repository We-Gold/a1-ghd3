export const now = () => new Date()

/**
 * @returns The current time in seconds since the Unix epoch
 */
export const getCurrentSecond = () => Math.floor(now().getTime() / 1000)

/**
 * Returns a formatted time string HH:MM:SS for the given Date object
 * @param currentTime The current Date object
 * @returns Formatted time string HH:MM:SS
 */
export const getTimeString = (currentTime: Date) => {
	const hours = currentTime.getHours()
	const minutes = currentTime.getMinutes()
	const seconds = currentTime.getSeconds()

	const timeString = `${hours.toString().padStart(2, "0")}:${minutes
		.toString()
		.padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`

	return timeString
}

