import { DEFAULT_LATITUDE, DEFAULT_LONGITUDE } from "./constants"

const userLocation = {
	latitude: DEFAULT_LATITUDE,
	longitude: DEFAULT_LONGITUDE,
}

export const getUserLocation = () => userLocation

/**
 * Requests the user's geolocation from the browser.
 * @returns A promise that resolves with the GeolocationPosition
 */
const requestUserGeolocation = (): Promise<GeolocationPosition> => {
	return new Promise((resolve, reject) => {
		if (!navigator.geolocation) {
			reject(new Error("Geolocation is not supported by this browser."))
		} else {
			navigator.geolocation.getCurrentPosition(resolve, reject)
		}
	})
}

/**
 * Fetches the user's current geolocation and updates the userLocation object.
 */
export const fetchAndSetUserLocation = async () => {
	try {
		const position = await requestUserGeolocation()
		userLocation.latitude = position.coords.latitude
		userLocation.longitude = position.coords.longitude
	} catch (error) {
		console.error("Error fetching user location:", error)
	}
}

