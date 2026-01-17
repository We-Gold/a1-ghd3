export const initSettingsPanel = () => {
	const settingsPanel = document.getElementById("settings-panel")
	if (!settingsPanel) return

	document
		.getElementById("settings-btn")
		?.addEventListener("click", (event) => {
			event.preventDefault()

			settingsPanel.classList.toggle("hidden")
		})

	settingsPanel.innerHTML = `
        <h2>Settings</h2>
        <p>Settings functionality is not implemented yet.</p>
    `
}

