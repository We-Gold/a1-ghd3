import { GnomonStyle } from "./sundial"
import { GNOMON_LENGTH_SCALE_DEFAULT } from "./constants"

const GNOMON_STYLE_STORAGE_KEY = "sundial.gnomonStyle"
const GNOMON_LENGTH_SCALE_STORAGE_KEY = "sundial.gnomonLengthScale"

let selectedGnomonStyle: GnomonStyle = GnomonStyle.CurvedWall
let selectedGnomonLengthScale = GNOMON_LENGTH_SCALE_DEFAULT

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

export const initSettingsPanel = () => {
	const settingsPanel = document.getElementById("settings-panel")
	if (!settingsPanel) return

	const settingsBtn = document.getElementById("settings-btn")

	/* AI Usage Note: "Can you modify the settings btn icon so that when the settings panel is open, it stays at the gold color (active), to indicate that it needs to be pressed to close the settings panel?" */
	const syncSettingsButtonState = () => {
		if (!settingsBtn) return
		const isOpen = !settingsPanel.classList.contains("hidden")
		settingsBtn.classList.toggle("active", isOpen)
		settingsBtn.setAttribute("aria-expanded", String(isOpen))
	}

	const stored = readStoredGnomonStyle()
	if (stored !== null) selectedGnomonStyle = stored

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
	})

	syncSettingsButtonState()

	/* AI Usage Note: "In the settings panel, add a dropdown that allows the user to select from the different sundial modes" */
	/* AI Usage Note: "Can you add a slider to the settings panel to adjust the gnomon length? The options should range from 0.3 to 0.9, and in the code it should be that multiplied by the sundial radius to get the gnomon length" */
	settingsPanel.innerHTML = `
		<h2>Settings</h2>
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
	`

	const select = settingsPanel.querySelector<HTMLSelectElement>(
		"#gnomon-style-select",
	)
	if (!select) return

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
}

