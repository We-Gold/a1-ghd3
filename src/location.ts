import {
	DEFAULT_LATITUDE_DEGREES,
	DEFAULT_LONGITUDE_DEGREES,
} from "./constants"

const userLocation = {
	latitudeDegrees: DEFAULT_LATITUDE_DEGREES,
	longitudeDegrees: DEFAULT_LONGITUDE_DEGREES,
}

export type UserLocation = typeof userLocation

export const getUserLocation = (): UserLocation => userLocation

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
		userLocation.latitudeDegrees = position.coords.latitude
		userLocation.longitudeDegrees = position.coords.longitude
	} catch (error) {
		console.error("Error fetching user location:", error)
	}
}

