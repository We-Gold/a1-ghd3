import * as d3 from "d3"

import {
	TIME_ELEMENT_ID,
	SUNDIAL_ELEMENT_ID,
	SUNDIAL_WIDTH,
	SUNDIAL_RADIUS,
} from "./constants"

import { degreesToRadians, radiansToDegrees } from "./angles"
import { romanNumeralForHour } from "./roman-numerals"
import { now, getTimeString } from "./time"
import type { UserLocation } from "./location"

/**
 * Notes about AI usage:
 * "For the hour marks, can you make them use roman numerals and rotate to face the center rather than being vertically aligned?"
 */
const renderHourMarks = (
	svg: d3.Selection<SVGGElement, unknown, HTMLElement, any>,
	latitudeDegrees: number,
) => {
	const degreesPerHour = 360 / 24
	const startHour = 2 // 2 AM
	const endHour = 22 // 10 PM
	const meridianHour = 12 // Noon

	const computeHourAngle = (hour: number) => {
		return (hour - meridianHour) * degreesPerHour
	}

	const computeSundialHourAngleRelativeToNoon = (hour: number) => {
		const HA = computeHourAngle(hour)
		const rhs =
			Math.tan(degreesToRadians(HA)) *
			Math.sin(degreesToRadians(latitudeDegrees))

		// atan() returns only (-90, 90), so hours outside 6–18 overlap.
		// Flip "night hours" onto the opposite side to make them unique.
		let theta = radiansToDegrees(Math.atan(rhs))
		if (Math.abs(HA) > 90) theta += 180

		return theta
	}

	for (let hour = startHour; hour <= endHour; hour++) {
		const hourAngle = computeSundialHourAngleRelativeToNoon(hour)
		const hourAngleRadians = degreesToRadians(hourAngle - 90) // Adjust by -90 degrees to start from top
		const x1 = (SUNDIAL_RADIUS - 10) * Math.cos(hourAngleRadians)
		const y1 = (SUNDIAL_RADIUS - 10) * Math.sin(hourAngleRadians)
		const x2 = SUNDIAL_RADIUS * Math.cos(hourAngleRadians)
		const y2 = SUNDIAL_RADIUS * Math.sin(hourAngleRadians)

		svg.append("line")
			.attr("x1", x1)
			.attr("y1", y1)
			.attr("x2", x2)
			.attr("y2", y2)
			.attr("stroke", "black")
			.attr("stroke-width", 2)

		// Add hour labels
		const labelX = (SUNDIAL_RADIUS - 30) * Math.cos(hourAngleRadians)
		const labelY = (SUNDIAL_RADIUS - 30) * Math.sin(hourAngleRadians)
		const labelRotationDegrees = hourAngle - 90

		svg.append("text")
			.attr(
				"transform",
				`translate(${labelX}, ${labelY}) rotate(${labelRotationDegrees + 90})`,
			)
			.attr("text-anchor", "middle")
			.attr("dominant-baseline", "middle")
			.attr("font-size", "28px")
			.attr("font-family", "Gideon Roman")
			.text(romanNumeralForHour(hour))
	}
}

export const updateSundial = (userLocation: UserLocation) => {
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

	// Render hour marks
	renderHourMarks(svg, userLocation.latitudeDegrees)
}

