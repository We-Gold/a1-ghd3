import { GnomonStyle } from "./sundial"

const GNOMON_STYLE_STORAGE_KEY = "sundial.gnomonStyle"

let selectedGnomonStyle: GnomonStyle = GnomonStyle.CurvedWall

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

	settingsBtn?.addEventListener("click", (event) => {
		event.preventDefault()
		settingsPanel.classList.toggle("hidden")
		syncSettingsButtonState()
	})

	syncSettingsButtonState()

	/* AI Usage Note: "In the settings panel, add a dropdown that allows the user to select from the different sundial modes" */
	settingsPanel.innerHTML = `
		<h2>Settings</h2>
		<label for="gnomon-style-select">Sundial mode</label>
		<select id="gnomon-style-select">
			<option value="${GnomonStyle.Line}">Line</option>
			<option value="${GnomonStyle.Wedge}">Wedge</option>
			<option value="${GnomonStyle.RightTriangle}">Right triangle</option>
			<option value="${GnomonStyle.CurvedWall}">Curved wall</option>
		</select>
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
}

