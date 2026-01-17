import "./style.css"

import { updateSundial } from "./sundial"
import { TIME_ELEMENT_ID, SUNDIAL_ELEMENT_ID } from "./constants"
import { getCurrentSecond } from "./time"
import { fetchAndSetUserLocation } from "./location"

/* The location pin svg below was generated with AI - "Add a location pin icon svg" */

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div id="container">
    <h1 id=${TIME_ELEMENT_ID}></h1>
    <div id=${SUNDIAL_ELEMENT_ID}></div>
  </div>
  <a id="locate-btn" href="" target="_blank" rel="noopener noreferrer" title="Use Current Location (WPI is default)">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  </a>
`

document.getElementById("locate-btn")?.addEventListener("click", (event) => {
	event.preventDefault()
	fetchAndSetUserLocation().catch((error) => {
		console.error("Error fetching user location on button click:", error)
	})
})

let lastAnimationFrame: number | null = null
let lastRenderedSecond: number | null = null

const animationLoop = () => {
	const currentSecond = getCurrentSecond()

	// Update sundial only if the second has changed
	if (lastRenderedSecond !== currentSecond) {
		lastRenderedSecond = currentSecond
		updateSundial()
	}

	lastAnimationFrame = requestAnimationFrame(animationLoop)
}

lastAnimationFrame = requestAnimationFrame(animationLoop)

// Clean up on unload
window.addEventListener("beforeunload", () => {
	if (lastAnimationFrame !== null) cancelAnimationFrame(lastAnimationFrame)
})

