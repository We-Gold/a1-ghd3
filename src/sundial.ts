import * as d3 from "d3"

import {
	TIME_ELEMENT_ID,
	SUNDIAL_ELEMENT_ID,
	SUNDIAL_RADIUS,
	GNOMON_LENGTH_SCALE_DEFAULT,
} from "./constants"

import { degreesToRadians, radiansToDegrees } from "./angles"
import { romanNumeralForHour } from "./roman-numerals"
import { now, getTimeString } from "./time"
import type { UserLocation } from "./location"

export enum GnomonStyle {
	Line,
	Wedge,
	RightTriangle,
	CurvedWall,
}

type Point = { x: number; y: number }

const startHour = 2 // 2 AM
const endHour = 22 // 10 PM
const meridianHour = 12 // Noon
const degreesPerHour = 360 / 24

const computeHourAngle = (
	hour: number,
	meridianHour: number,
	degreesPerHour: number,
) => {
	return (hour - meridianHour) * degreesPerHour
}

const computeSundialHourAngleRelativeToNoon = (
	hour: number,
	meridianHour: number,
	degreesPerHour: number,
	latitudeDegrees: number,
) => {
	const HA = computeHourAngle(hour, meridianHour, degreesPerHour)
	const rhs =
		Math.tan(degreesToRadians(HA)) *
		Math.sin(degreesToRadians(latitudeDegrees))

	// atan() returns only (-90, 90), so hours outside 6–18 overlap.
	// Flip "night hours" onto the opposite side to make them unique.
	let theta = radiansToDegrees(Math.atan(rhs))
	if (Math.abs(HA) > 90) theta += 180

	return theta
}

/**
 * Notes about AI usage:
 * "For the hour marks, can you make them use roman numerals and rotate to face the center rather than being vertically aligned?"
 */
const renderHourMarks = (
	svg: d3.Selection<SVGGElement, unknown, HTMLElement, any>,
	latitudeDegrees: number,
	showCompass: boolean = true,
) => {
	const CENTRAL_CIRCLE_RADIUS = 120
	const COMPASS_CENTER: Point = { x: 0, y: CENTRAL_CIRCLE_RADIUS / 2 }
	const COMPASS_RADIUS = CENTRAL_CIRCLE_RADIUS / 2

	// Draw a circle at the center of the sundial
	svg.append("circle")
		.attr("cx", 0)
		.attr("cy", 0)
		.attr("r", CENTRAL_CIRCLE_RADIUS)
		.attr("stroke", "black")
		.attr("stroke-opacity", 0.5)
		.attr("stroke-width", 1.5)
		.attr("fill", "none")

	if (showCompass) {
		// Draw a circle to contain a compass rose
		svg.append("circle")
			.attr("cx", COMPASS_CENTER.x)
			.attr("cy", COMPASS_CENTER.y)
			.attr("r", COMPASS_RADIUS)
			.attr("stroke", "black")
			.attr("stroke-opacity", 0.1)
			.attr("stroke-width", 1.5)
			.attr("fill", "none")

		/* AI Usage Note: "can you draw a compass rose with the cardinal directions? Make sure to use Gideon Roman for the font" */
		// Compass rose (cardinal directions)
		const compassStroke = "rgba(0, 0, 0, 0.3)"
		const compassStrokeThickness = 2
		const labelInset = 18
		const labelFontSize = "22px"

		// Crosshair strokes (rects instead of lines)
		const crossInset = 32
		const crossLength = 2 * (COMPASS_RADIUS - crossInset)

		// Vertical stroke
		svg.append("rect")
			.attr("x", COMPASS_CENTER.x - compassStrokeThickness / 2)
			.attr("y", COMPASS_CENTER.y - crossLength / 2)
			.attr("width", compassStrokeThickness)
			.attr("height", crossLength)
			.attr("fill", compassStroke)

		// Horizontal stroke
		svg.append("rect")
			.attr("x", COMPASS_CENTER.x - crossLength / 2)
			.attr("y", COMPASS_CENTER.y - compassStrokeThickness / 2)
			.attr("width", crossLength)
			.attr("height", compassStrokeThickness)
			.attr("fill", compassStroke)

		// Star ticks (rotated rects at a configurable angular interval)
		// Adjust this to change the number of rays (e.g., 30, 45, 60).
		const starTickIntervalDegrees = 15
		const starTickThickness = 1
		const starTickLength = crossLength * 0.5

		if (
			Number.isFinite(starTickIntervalDegrees) &&
			starTickIntervalDegrees > 0
		) {
			const starGroup = svg
				.append("g")
				.attr(
					"transform",
					`translate(${COMPASS_CENTER.x}, ${COMPASS_CENTER.y})`,
				)

			for (let angle = 0; angle < 360; angle += starTickIntervalDegrees) {
				// Skip the main axes since the crosshair already covers them.
				const normalized = ((angle % 360) + 360) % 360
				if (normalized % 90 === 0) continue

				starGroup
					.append("rect")
					.attr("x", -starTickThickness / 2)
					.attr("y", -starTickLength / 2)
					.attr("width", starTickThickness)
					.attr("height", starTickLength)
					.attr("transform", `rotate(${angle})`)
					.attr("fill", "rgba(0, 0, 0, 0.2)")
			}
		}

		const addCompassLabel = (text: string, x: number, y: number) => {
			svg.append("text")
				.attr("x", x)
				.attr("y", y)
				.attr("text-anchor", "middle")
				.attr("dominant-baseline", "middle")
				.attr("font-size", labelFontSize)
				.attr("font-family", "Gideon Roman")
				.attr("fill", compassStroke)
				.text(text)
		}

		addCompassLabel(
			"N",
			COMPASS_CENTER.x,
			COMPASS_CENTER.y - (COMPASS_RADIUS - labelInset) + 5,
		)
		addCompassLabel(
			"E",
			COMPASS_CENTER.x + (COMPASS_RADIUS - labelInset) - 4,
			COMPASS_CENTER.y + 1,
		)
		addCompassLabel(
			"S",
			COMPASS_CENTER.x,
			COMPASS_CENTER.y + (COMPASS_RADIUS - labelInset),
		)
		addCompassLabel(
			"W",
			COMPASS_CENTER.x - (COMPASS_RADIUS - labelInset) + 2,
			COMPASS_CENTER.y + 1,
		)
	}

	for (let hour = startHour; hour <= endHour; hour++) {
		const hourAngle = computeSundialHourAngleRelativeToNoon(
			hour,
			meridianHour,
			degreesPerHour,
			latitudeDegrees,
		)
		const hourAngleRadians = degreesToRadians(hourAngle - 90) // Adjust by -90 degrees to start from top
		const x1 = (SUNDIAL_RADIUS - 50) * Math.cos(hourAngleRadians)
		const y1 = (SUNDIAL_RADIUS - 50) * Math.sin(hourAngleRadians)
		const x2 = CENTRAL_CIRCLE_RADIUS * Math.cos(hourAngleRadians)
		const y2 = CENTRAL_CIRCLE_RADIUS * Math.sin(hourAngleRadians)

		svg.append("line")
			.attr("x1", x1)
			.attr("y1", y1)
			.attr("x2", x2)
			.attr("y2", y2)
			.attr("stroke", "rgba(0, 0, 0, 0.5)")
			.attr("stroke-width", 1.5)

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

export const renderGnomon = (
	svg: d3.Selection<SVGGElement, unknown, HTMLElement, any>,
	latitudeDegrees: number,
	hour: number,
	meridianHour: number,
	degreesPerHour: number,
	gnomonLength: number,
) => {
	const gnomonEndY =
		-gnomonLength * Math.cos(degreesToRadians(latitudeDegrees))

	svg.append("line")
		.attr("x1", 0)
		.attr("y1", 0)
		.attr("x2", 0)
		.attr("y2", gnomonEndY)
		.attr("stroke", "black")
		.attr("stroke-width", 4)

	// Calculate the angle for the shadow
	const theta = degreesToRadians(
		computeSundialHourAngleRelativeToNoon(
			hour,
			meridianHour,
			degreesPerHour,
			latitudeDegrees,
		),
	)

	// Calculate the hour angle in radians
	const hourAngleRad = degreesToRadians(
		computeHourAngle(hour, meridianHour, degreesPerHour),
	)

	// Calculate the angle alpha, which is the angle of elevation of the sun
	const alpha = Math.asin(
		Math.cos(degreesToRadians(latitudeDegrees)) * Math.cos(hourAngleRad),
	)

	const tanAlpha = Math.tan(alpha)
	if (!Number.isFinite(tanAlpha) || Math.abs(tanAlpha) < 1e-6) return

	// Use a positive length so the shadow direction doesn't flip at night hours.
	const shadowLength = gnomonLength / Math.abs(tanAlpha)

	// Calculate the end point of the shadow
	const shadowEnd = {
		x: shadowLength * Math.sin(theta),
		y: -shadowLength * Math.cos(theta),
	}

	// Render the shadow
	svg.append("line")
		.attr("x1", 0)
		.attr("y1", 0)
		.attr("x2", shadowEnd.x)
		.attr("y2", shadowEnd.y)
		.attr("stroke", "rgba(0, 0, 0, 0.5)")
		.attr("stroke-width", 2)
}

/**
 * AI Usage Note:
 * "Can you make another function renderGnomonWedge, which is similar to the current one but instead of it being a line, it is a triangle with a triangular shadow?"
 */
export const renderGnomonWedge = (
	svg: d3.Selection<SVGGElement, unknown, HTMLElement, any>,
	latitudeDegrees: number,
	hour: number,
	meridianHour: number,
	degreesPerHour: number,
	gnomonLength: number,
) => {
	const gnomonEndY =
		-gnomonLength * Math.cos(degreesToRadians(latitudeDegrees))

	// A simple isosceles triangle "wedge" anchored at the center.
	const baseWidth = 18
	const baseLeft = { x: -baseWidth / 2, y: 0 }
	const baseRight: Point = { x: baseWidth / 2, y: 0 }
	const tip: Point = { x: 0, y: gnomonEndY }

	svg.append("polygon")
		.attr(
			"points",
			`${baseLeft.x},${baseLeft.y} ${baseRight.x},${baseRight.y} ${tip.x},${tip.y}`,
		)
		.attr("fill", "black")
		.attr("stroke", "black")
		.attr("stroke-width", 2)

	// Calculate the angle for the shadow
	const theta = degreesToRadians(
		computeSundialHourAngleRelativeToNoon(
			hour,
			meridianHour,
			degreesPerHour,
			latitudeDegrees,
		),
	)

	// Calculate the hour angle in radians
	const hourAngleRad = degreesToRadians(
		computeHourAngle(hour, meridianHour, degreesPerHour),
	)

	// Angle of elevation of the sun
	const alpha = Math.asin(
		Math.cos(degreesToRadians(latitudeDegrees)) * Math.cos(hourAngleRad),
	)

	const tanAlpha = Math.tan(alpha)
	if (!Number.isFinite(tanAlpha) || Math.abs(tanAlpha) < 1e-6) return

	// Length of the shadow (projection of the gnomon tip)
	const shadowLength = gnomonLength / Math.abs(tanAlpha)

	const shadowTip: Point = {
		x: shadowLength * Math.sin(theta),
		y: -shadowLength * Math.cos(theta),
	}

	// Triangular shadow (base of wedge -> projected tip)
	svg.append("polygon")
		.attr(
			"points",
			`${baseLeft.x},${baseLeft.y} ${baseRight.x},${baseRight.y} ${shadowTip.x},${shadowTip.y}`,
		)
		.attr("fill", "rgba(0, 0, 0, 0.25)")
}

/**
 * AI Usage Note:
 * "Can you make another where the gnomon is a thin triangle with one edge along the sundial and another vertical (perpendicular to the surface), and the third connecting between the perpendicular edge and the center of the sundial?"
 */
export const renderGnomonRightTriangle = (
	svg: d3.Selection<SVGGElement, unknown, HTMLElement, any>,
	latitudeDegrees: number,
	hour: number,
	meridianHour: number,
	degreesPerHour: number,
	gnomonLength: number,
) => {
	// A thin right-triangle approximation of a gnomon where:
	// - one edge lies on the dial surface (center -> basePoint)
	// - one edge represents a vertical wall (basePoint -> verticalTop)
	// - the third edge connects the vertical top back to the center
	//
	// Note: SVG is 2D, so the "vertical" edge is depicted with a small offset.
	const basePoint: Point = {
		x: 0,
		y: -gnomonLength * Math.cos(degreesToRadians(latitudeDegrees)),
	}
	const verticalVisualOffset = 8
	const verticalTop: Point = {
		x: basePoint.x + verticalVisualOffset,
		y: basePoint.y,
	}
	const center: Point = { x: 0, y: 0 }

	svg.append("polygon")
		.attr(
			"points",
			`${center.x},${center.y} ${basePoint.x},${basePoint.y} ${verticalTop.x},${verticalTop.y}`,
		)
		.attr("fill", "black")
		.attr("stroke", "black")
		.attr("stroke-width", 2)

	const theta = degreesToRadians(
		computeSundialHourAngleRelativeToNoon(
			hour,
			meridianHour,
			degreesPerHour,
			latitudeDegrees,
		),
	)

	const hourAngleRad = degreesToRadians(
		computeHourAngle(hour, meridianHour, degreesPerHour),
	)

	const alpha = Math.asin(
		Math.cos(degreesToRadians(latitudeDegrees)) * Math.cos(hourAngleRad),
	)

	const tanAlpha = Math.tan(alpha)
	if (!Number.isFinite(tanAlpha) || Math.abs(tanAlpha) < 1e-6) return

	const shadowLength = gnomonLength / Math.abs(tanAlpha)
	const shadowTip: Point = {
		x: shadowLength * Math.sin(theta),
		y: -shadowLength * Math.cos(theta),
	}

	// Triangular shadow from the edge-on gnomon (center -> basePoint) toward shadow tip.
	svg.append("polygon")
		.attr(
			"points",
			`${center.x},${center.y} ${basePoint.x},${basePoint.y} ${shadowTip.x},${shadowTip.y}`,
		)
		.attr("fill", "rgba(0, 0, 0, 0.25)")
}

/**
 * Curved "vertical wall" gnomon drawn with SVG paths.
 *
 * Geometry matches `renderGnomonRightTriangle` for two edges:
 * - center -> basePoint (on the sundial surface)
 * - center -> verticalTop (represents a vertical/perpendicular edge, visualized in 2D)
 *
 * The edge basePoint -> verticalTop is replaced with a concave curve.
 * Shadow is rendered as a similarly-curved path (approximation).
 *
 * AI Usage Note:
 * "I want to add a fancier gnomon that has a curve to it, where two of the edges are the same as the right angle triangle, but the vertical edge is now a concave curve. This will impact the appearance of the shadow."
 */
export const renderGnomonCurvedWall = (
	svg: d3.Selection<SVGGElement, unknown, HTMLElement, any>,
	latitudeDegrees: number,
	hour: number,
	meridianHour: number,
	degreesPerHour: number,
	gnomonLength: number,
) => {
	const center: Point = { x: 0, y: 0 }
	const basePoint: Point = {
		x: 0,
		y: -gnomonLength * Math.cos(degreesToRadians(latitudeDegrees)),
	}

	// 2D visualization of the vertical/perpendicular edge.
	const verticalVisualOffset = 10
	const verticalTop: Point = {
		x: basePoint.x + verticalVisualOffset,
		y: basePoint.y,
	}

	const midpoint = (a: Point, b: Point): Point => ({
		x: (a.x + b.x) / 2,
		y: (a.y + b.y) / 2,
	})
	const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)
	const normalize = (p: Point): Point => {
		const len = Math.hypot(p.x, p.y)
		if (len === 0) return { x: 0, y: 0 }
		return { x: p.x / len, y: p.y / len }
	}
	const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y })
	const scale = (p: Point, s: number): Point => ({ x: p.x * s, y: p.y * s })
	const sub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y })

	// Control point that pulls the curve inward (toward the center), making it concave.
	const midBV = midpoint(basePoint, verticalTop)
	const towardCenter = normalize(sub(center, midBV))
	const curveStrength = Math.min(14, distance(basePoint, verticalTop) * 1.2)
	const controlBV = add(midBV, scale(towardCenter, curveStrength))

	const gnomonPath =
		`M ${center.x} ${center.y} ` +
		`L ${basePoint.x} ${basePoint.y} ` +
		`Q ${controlBV.x} ${controlBV.y} ${verticalTop.x} ${verticalTop.y} ` +
		`Z`

	svg.append("path")
		.attr("d", gnomonPath)
		.attr("fill", "black")
		.attr("stroke", "black")
		.attr("stroke-width", 2)

	// --- Shadow (approximation) ---
	const theta = degreesToRadians(
		computeSundialHourAngleRelativeToNoon(
			hour,
			meridianHour,
			degreesPerHour,
			latitudeDegrees,
		),
	)
	const hourAngleRad = degreesToRadians(
		computeHourAngle(hour, meridianHour, degreesPerHour),
	)
	const alpha = Math.asin(
		Math.cos(degreesToRadians(latitudeDegrees)) * Math.cos(hourAngleRad),
	)

	const tanAlpha = Math.tan(alpha)
	if (!Number.isFinite(tanAlpha) || Math.abs(tanAlpha) < 1e-6) return

	const shadowLength = gnomonLength / Math.abs(tanAlpha)
	const shadowTip: Point = {
		x: shadowLength * Math.sin(theta),
		y: -shadowLength * Math.cos(theta),
	}

	// Curve control for the shadow edge basePoint -> shadowTip.
	const midBS = midpoint(basePoint, shadowTip)
	const towardCenterShadow = normalize(sub(center, midBS))
	const curveStrengthShadow = Math.min(
		18,
		distance(basePoint, shadowTip) * 0.15,
	)
	const controlBS = add(midBS, scale(towardCenterShadow, curveStrengthShadow))

	const shadowPath =
		`M ${center.x} ${center.y} ` +
		`L ${basePoint.x} ${basePoint.y} ` +
		`Q ${controlBS.x} ${controlBS.y} ${shadowTip.x} ${shadowTip.y} ` +
		`Z`

	svg.append("path").attr("d", shadowPath).attr("fill", "rgba(0, 0, 0, 0.25)")
}

export const updateSundial = (
	userLocation: UserLocation,
	gnomonStyle: GnomonStyle = GnomonStyle.CurvedWall,
	gnomonLengthScale: number = GNOMON_LENGTH_SCALE_DEFAULT,
	customTimeOverride?: { hours: number; minutes: number } | null,
) => {
	const realNow = now()
	const displayDate = new Date(realNow)
	if (customTimeOverride) {
		displayDate.setHours(
			customTimeOverride.hours,
			customTimeOverride.minutes,
			0,
			0,
		)
	}

	const hours = displayDate.getHours()
	const minutes = displayDate.getMinutes()

	const timeString = getTimeString(displayDate)

	document.getElementById(TIME_ELEMENT_ID)!.textContent = timeString

	const sundial = d3.select(`#${SUNDIAL_ELEMENT_ID}`)
	sundial.selectAll("*").remove()

	/* AI Usage Note: "Right now, I have my sundial in the middle of the page below the current time. Because of the way I'm doing it, it can cut off longer shadows. Can you make it so the sundial is in the same spot but it takes up the full size of the window behind other elements so the shadow can fully show? It should still be responsive to window resize though." */
	// Render into a full-window SVG canvas so shadows don't get clipped.
	// The dial itself stays in the same on-screen spot by anchoring the drawing
	// origin to the center of the #sundial placeholder element.
	const anchorEl = document.getElementById(SUNDIAL_ELEMENT_ID)
	const anchorRect = anchorEl?.getBoundingClientRect()

	const viewportWidth = Math.max(1, window.innerWidth)
	const viewportHeight = Math.max(1, window.innerHeight)

	// Fallback: if layout isn't ready yet, use the center of the viewport.
	const centerX = anchorRect
		? anchorRect.left + anchorRect.width / 2
		: viewportWidth / 2
	const centerY = anchorRect
		? anchorRect.top + anchorRect.height / 2
		: viewportHeight / 2

	const radius = SUNDIAL_RADIUS

	const svg = sundial
		.append("svg")
		.attr("class", "sundial-canvas")
		.attr("width", viewportWidth)
		.attr("height", viewportHeight)
		.attr("viewBox", `0 0 ${viewportWidth} ${viewportHeight}`)
		.append("g")
		.attr("transform", `translate(${centerX}, ${centerY})`)

	// Create a circle for the sundial face
	svg.append("circle")
		.attr("r", radius)
		.attr("fill", "#FFD700")
		.attr("stroke", "black")
		.attr("stroke-width", 2)

	// Render hour marks
	renderHourMarks(svg, userLocation.latitudeDegrees, false)

	const lengthScale = Number.isFinite(gnomonLengthScale)
		? Math.min(0.9, Math.max(0.3, gnomonLengthScale))
		: GNOMON_LENGTH_SCALE_DEFAULT
	const gnomonLength = SUNDIAL_RADIUS * lengthScale

	// Render gnomon
	const gnomonParams: [typeof svg, number, number, number, number, number] = [
		svg,
		userLocation.latitudeDegrees,
		hours + minutes / 60,
		meridianHour,
		degreesPerHour,
		gnomonLength,
	]

	switch (gnomonStyle) {
		case GnomonStyle.Line:
			renderGnomon(...gnomonParams)
			break
		case GnomonStyle.Wedge:
			renderGnomonWedge(...gnomonParams)
			break
		case GnomonStyle.RightTriangle:
			renderGnomonRightTriangle(...gnomonParams)
			break
		case GnomonStyle.CurvedWall:
			renderGnomonCurvedWall(...gnomonParams)
			break
	}
}

