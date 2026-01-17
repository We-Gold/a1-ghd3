import * as d3 from "d3"

import {
	TIME_ELEMENT_ID,
	SUNDIAL_ELEMENT_ID,
	SUNDIAL_WIDTH,
	SUNDIAL_RADIUS,
} from "./constants"

import { now, getTimeString } from "./time"

// const render

export const updateSundial = () => {
	const nowDate = now()
	const hours = nowDate.getHours()
	const minutes = nowDate.getMinutes()

	const timeString = getTimeString(nowDate)

	document.getElementById(TIME_ELEMENT_ID)!.textContent = timeString

	const sundial = d3.select(`#${SUNDIAL_ELEMENT_ID}`)
	sundial.selectAll("*").remove()

	const width = SUNDIAL_WIDTH
	const height = SUNDIAL_WIDTH
	const radius = SUNDIAL_RADIUS

	const svg = sundial
		.append("svg")
		.attr("width", width)
		.attr("height", height)
		.append("g")
		.attr("transform", `translate(${width / 2}, ${height / 2})`)

	// Create a circle for the sundial face
	svg.append("circle")
		.attr("r", radius)
		.attr("fill", "#FFD700")
		.attr("stroke", "black")
		.attr("stroke-width", 2)
}

