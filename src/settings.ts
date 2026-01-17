import { GnomonStyle } from "./sundial"
import { GNOMON_LENGTH_SCALE_DEFAULT } from "./constants"
import { getUserLocation } from "./location"

const GNOMON_STYLE_STORAGE_KEY = "sundial.gnomonStyle"
const GNOMON_LENGTH_SCALE_STORAGE_KEY = "sundial.gnomonLengthScale"
const SHOW_COMPASS_ROSE_STORAGE_KEY = "sundial.showCompassRose"

let selectedGnomonStyle: GnomonStyle = GnomonStyle.CurvedWall
let selectedGnomonLengthScale = GNOMON_LENGTH_SCALE_DEFAULT

let showCompassRose = false

const readStoredShowCompassRose = (): boolean | null => {
	try {
		const raw = localStorage.getItem(SHOW_COMPASS_ROSE_STORAGE_KEY)
		if (raw === null) return null
		if (raw === "true") return true
		if (raw === "false") return false
		return null
	} catch {
		return null
	}
}

let isSettingsPanelOpen = false
let useCustomTime = false
let customTimeHHMM: string | null = null

let useCustomLocation = false
let customLatitudeDegrees: number | null = null
let customLongitudeDegrees: number | null = null

const readStoredGnomonStyle = (): GnomonStyle | null => {
	try {
		const raw = localStorage.getItem(GNOMON_STYLE_STORAGE_KEY)
		if (raw === null) return null

		const asNumber = Number(raw)
		if (!Number.isInteger(asNumber)) return null
		if (asNumber in GnomonStyle) return asNumber as GnomonStyle
		return null
	} catch {
		return null
	}
}

export const getSelectedGnomonStyle = () => selectedGnomonStyle

export const getSelectedGnomonLengthScale = () => selectedGnomonLengthScale

export const getShowCompassRose = () => showCompassRose

export const getCustomTimeOverride = (): {
	hours: number
	minutes: number
} | null => {
	if (!isSettingsPanelOpen) return null
	if (!useCustomTime) return null
	if (!customTimeHHMM) return null

	const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(customTimeHHMM)
	if (!match) return null

	return { hours: Number(match[1]), minutes: Number(match[2]) }
}

export const getCustomLocationOverride = (): {
	latitudeDegrees: number
	longitudeDegrees: number
} | null => {
	if (!isSettingsPanelOpen) return null
	if (!useCustomLocation) return null
	if (customLatitudeDegrees === null || customLongitudeDegrees === null)
		return null
	if (!Number.isFinite(customLatitudeDegrees)) return null
	if (!Number.isFinite(customLongitudeDegrees)) return null
	if (customLatitudeDegrees < -90 || customLatitudeDegrees > 90) return null
	if (customLongitudeDegrees < -180 || customLongitudeDegrees > 180)
		return null

	return {
		latitudeDegrees: customLatitudeDegrees,
		longitudeDegrees: customLongitudeDegrees,
	}
}

export const initSettingsPanel = () => {
	const settingsPanel = document.getElementById("settings-panel")
	if (!settingsPanel) return

	const settingsBtn = document.getElementById("settings-btn")

	/* AI Usage Note: "Can you modify the settings btn icon so that when the settings panel is open, it stays at the gold color (active), to indicate that it needs to be pressed to close the settings panel?" */
	const syncSettingsButtonState = () => {
		if (!settingsBtn) return
		const isOpen = !settingsPanel.classList.contains("hidden")
		isSettingsPanelOpen = isOpen
		settingsBtn.classList.toggle("active", isOpen)
		settingsBtn.setAttribute("aria-expanded", String(isOpen))
	}

	const stored = readStoredGnomonStyle()
	if (stored !== null) selectedGnomonStyle = stored

	const storedShowCompass = readStoredShowCompassRose()
	if (storedShowCompass !== null) showCompassRose = storedShowCompass

	try {
		const rawScale = localStorage.getItem(GNOMON_LENGTH_SCALE_STORAGE_KEY)
		if (rawScale !== null) {
			const scale = Number(rawScale)
			if (Number.isFinite(scale) && scale >= 0.3 && scale <= 0.9) {
				selectedGnomonLengthScale = scale
			}
		}
	} catch {
		// Ignore storage errors
	}

	settingsBtn?.addEventListener("click", (event) => {
		event.preventDefault()
		settingsPanel.classList.toggle("hidden")
		syncSettingsButtonState()

		// Custom time should only apply while the panel is open.
		if (!isSettingsPanelOpen) {
			useCustomTime = false
			customTimeHHMM = null

			useCustomLocation = false
			customLatitudeDegrees = null
			customLongitudeDegrees = null

			const checkbox = settingsPanel.querySelector<HTMLInputElement>(
				"#custom-time-enabled",
			)
			const hourSelect =
				settingsPanel.querySelector<HTMLSelectElement>(
					"#custom-time-hour",
				)
			const minuteSelect = settingsPanel.querySelector<HTMLSelectElement>(
				"#custom-time-minute",
			)
			if (checkbox) checkbox.checked = false
			if (hourSelect) hourSelect.disabled = true
			if (minuteSelect) minuteSelect.disabled = true

			window.dispatchEvent(new CustomEvent("sundial:customTimeChanged"))

			const locationEnabled =
				settingsPanel.querySelector<HTMLInputElement>(
					"#custom-location-enabled",
				)
			const latInput =
				settingsPanel.querySelector<HTMLInputElement>(
					"#custom-latitude",
				)
			const lonInput =
				settingsPanel.querySelector<HTMLInputElement>(
					"#custom-longitude",
				)
			if (locationEnabled) locationEnabled.checked = false
			if (latInput) {
				latInput.value = ""
				latInput.disabled = true
			}
			if (lonInput) {
				lonInput.value = ""
				lonInput.disabled = true
			}

			window.dispatchEvent(
				new CustomEvent("sundial:customLocationChanged"),
			)
		}
	})

	syncSettingsButtonState()

	/* AI Usage Note: "In the settings panel, add a dropdown that allows the user to select from the different sundial modes" */
	/* AI Usage Note: "Can you add a slider to the settings panel to adjust the gnomon length? The options should range from 0.3 to 0.9, and in the code it should be that multiplied by the sundial radius to get the gnomon length" */
	/* AI Usage Note: "Can you add an option to the settings panel to set a custom time for the sundial? It should only be active while the settings panel is open, and then reset when it is closed." */
	/* AI Usage Note: "Similar to the custom time option, can you add a custom location (latitude and longitude) option that is similarly temporary?" */
	/* AI Usage Note: Can you make an option in the settings to show or hide the compass rose? This should be a persistent setting */
	settingsPanel.innerHTML = `
		<h2>Settings</h2>
		<div class="settings-row">
			<input id="show-compass-rose" type="checkbox" />
			<label for="show-compass-rose">Show compass rose</label>
		</div>
		<label for="gnomon-style-select">Sundial mode</label>
		<select id="gnomon-style-select">
			<option value="${GnomonStyle.Line}">Line</option>
			<option value="${GnomonStyle.Wedge}">Wedge</option>
			<option value="${GnomonStyle.RightTriangle}">Right triangle</option>
			<option value="${GnomonStyle.CurvedWall}">Curved wall</option>
		</select>
		<label for="gnomon-length-scale">Gnomon length</label>
		<input
			id="gnomon-length-scale"
			type="range"
			min="0.3"
			max="0.9"
			step="0.01"
			value="${selectedGnomonLengthScale}"
		/>
		<div class="settings-row">
			<input id="custom-time-enabled" type="checkbox" />
			<label for="custom-time-enabled">Use custom time</label>
		</div>
		<label>Custom time (24-hour)</label>
		<div class="settings-time">
			<select id="custom-time-hour" aria-label="Custom hour" disabled>
				${Array.from({ length: 24 })
					.map((_, h) => {
						const hh = String(h).padStart(2, "0")
						return `<option value="${hh}">${hh}</option>`
					})
					.join("")}
			</select>
			<span>:</span>
			<select id="custom-time-minute" aria-label="Custom minute" disabled>
				${Array.from({ length: 60 })
					.map((_, m) => {
						const mm = String(m).padStart(2, "0")
						return `<option value="${mm}">${mm}</option>`
					})
					.join("")}
			</select>
		</div>
		<div class="settings-row">
			<input id="custom-location-enabled" type="checkbox" />
			<label for="custom-location-enabled">Use custom location</label>
		</div>
		<label for="custom-latitude">Latitude</label>
		<input id="custom-latitude" type="number" step="0.0001" min="-90" max="90" disabled />
		<label for="custom-longitude">Longitude</label>
		<input id="custom-longitude" type="number" step="0.0001" min="-180" max="180" disabled />
	`

	const select = settingsPanel.querySelector<HTMLSelectElement>(
		"#gnomon-style-select",
	)
	if (!select) return

	const compassCheckbox =
		settingsPanel.querySelector<HTMLInputElement>("#show-compass-rose")
	if (!compassCheckbox) return

	compassCheckbox.checked = showCompassRose
	compassCheckbox.addEventListener("change", () => {
		showCompassRose = compassCheckbox.checked
		try {
			localStorage.setItem(
				SHOW_COMPASS_ROSE_STORAGE_KEY,
				String(showCompassRose),
			)
		} catch {
			// Ignore storage errors
		}

		window.dispatchEvent(new CustomEvent("sundial:showCompassChanged"))
	})

	select.value = String(selectedGnomonStyle)
	select.addEventListener("change", () => {
		const next = Number(select.value)
		if (!Number.isInteger(next)) return
		if (!(next in GnomonStyle)) return

		selectedGnomonStyle = next as GnomonStyle
		try {
			localStorage.setItem(
				GNOMON_STYLE_STORAGE_KEY,
				String(selectedGnomonStyle),
			)
		} catch {
			// Ignore storage errors (private mode, quota, etc.)
		}

		window.dispatchEvent(
			new CustomEvent("sundial:gnomonStyleChanged", {
				detail: selectedGnomonStyle,
			}),
		)
	})

	const lengthScaleInput = settingsPanel.querySelector<HTMLInputElement>(
		"#gnomon-length-scale",
	)
	if (!lengthScaleInput) return

	const clampScale = (value: number) => Math.min(0.9, Math.max(0.3, value))

	lengthScaleInput.value = String(selectedGnomonLengthScale)
	lengthScaleInput.addEventListener("input", () => {
		const next = clampScale(Number(lengthScaleInput.value))
		if (!Number.isFinite(next)) return

		selectedGnomonLengthScale = next
		try {
			localStorage.setItem(
				GNOMON_LENGTH_SCALE_STORAGE_KEY,
				String(selectedGnomonLengthScale),
			)
		} catch {
			// Ignore storage errors
		}

		window.dispatchEvent(
			new CustomEvent("sundial:gnomonLengthScaleChanged", {
				detail: selectedGnomonLengthScale,
			}),
		)
	})

	const customTimeEnabled = settingsPanel.querySelector<HTMLInputElement>(
		"#custom-time-enabled",
	)
	const hourSelect =
		settingsPanel.querySelector<HTMLSelectElement>("#custom-time-hour")
	const minuteSelect = settingsPanel.querySelector<HTMLSelectElement>(
		"#custom-time-minute",
	)
	if (!customTimeEnabled || !hourSelect || !minuteSelect) return

	const setSelectsFromHHMM = (hhmm: string) => {
		const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm)
		if (!match) return
		hourSelect.value = match[1]
		minuteSelect.value = match[2]
	}

	const setHHMMFromSelects = () => {
		customTimeHHMM = `${hourSelect.value}:${minuteSelect.value}`
	}

	customTimeEnabled.checked = useCustomTime
	hourSelect.disabled = !useCustomTime
	minuteSelect.disabled = !useCustomTime

	if (customTimeHHMM) {
		setSelectsFromHHMM(customTimeHHMM)
	} else {
		hourSelect.value = "12"
		minuteSelect.value = "00"
	}

	customTimeEnabled.addEventListener("change", () => {
		useCustomTime = customTimeEnabled.checked
		hourSelect.disabled = !useCustomTime
		minuteSelect.disabled = !useCustomTime

		if (!useCustomTime) {
			customTimeHHMM = null
		} else if (!customTimeHHMM) {
			const d = new Date()
			const hh = String(d.getHours()).padStart(2, "0")
			const mm = String(d.getMinutes()).padStart(2, "0")
			customTimeHHMM = `${hh}:${mm}`
			setSelectsFromHHMM(customTimeHHMM)
		}

		window.dispatchEvent(new CustomEvent("sundial:customTimeChanged"))
	})

	const onSelectChange = () => {
		if (!useCustomTime) return
		setHHMMFromSelects()
		window.dispatchEvent(new CustomEvent("sundial:customTimeChanged"))
	}

	hourSelect.addEventListener("change", onSelectChange)
	minuteSelect.addEventListener("change", onSelectChange)

	const customLocationEnabled = settingsPanel.querySelector<HTMLInputElement>(
		"#custom-location-enabled",
	)
	const latitudeInput =
		settingsPanel.querySelector<HTMLInputElement>("#custom-latitude")
	const longitudeInput =
		settingsPanel.querySelector<HTMLInputElement>("#custom-longitude")
	if (!customLocationEnabled || !latitudeInput || !longitudeInput) return

	const setLocationInputsEnabled = () => {
		latitudeInput.disabled = !useCustomLocation
		// Longitude isn't used right now; keep it read-only.
		longitudeInput.disabled = true
	}

	customLocationEnabled.checked = useCustomLocation
	setLocationInputsEnabled()

	if (customLatitudeDegrees !== null) {
		latitudeInput.value = String(customLatitudeDegrees)
	}
	if (customLongitudeDegrees !== null) {
		longitudeInput.value = String(customLongitudeDegrees)
	}

	customLocationEnabled.addEventListener("change", () => {
		useCustomLocation = customLocationEnabled.checked
		setLocationInputsEnabled()

		if (!useCustomLocation) {
			customLatitudeDegrees = null
			customLongitudeDegrees = null
			latitudeInput.value = ""
			longitudeInput.value = ""
		} else if (
			customLatitudeDegrees === null ||
			customLongitudeDegrees === null
		) {
			const current = getUserLocation()
			customLatitudeDegrees = current.latitudeDegrees
			customLongitudeDegrees = current.longitudeDegrees
			latitudeInput.value = String(customLatitudeDegrees)
			longitudeInput.value = String(customLongitudeDegrees)
		}

		window.dispatchEvent(new CustomEvent("sundial:customLocationChanged"))
	})

	const onLocationInput = () => {
		if (!useCustomLocation) return
		customLatitudeDegrees = Number(latitudeInput.value)
		window.dispatchEvent(new CustomEvent("sundial:customLocationChanged"))
	}

	latitudeInput.addEventListener("input", onLocationInput)
}

