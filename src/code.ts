import * as colorConvert from 'color-convert'
import { ghostify } from './helpers/ghostify.helper'
import { doesItHavePropertyChildren } from './helpers/utils.helper'
// import { RGB } from 'color-convert/conversions'

let type = ['Solid', 'Gradient']
let colors = ['Gray', 'Black', 'White']
let fills: (SolidPaint | GradientPaint)[]

figma.parameters.on('input', ({ key, query, result }: ParameterInputEvent) => {
	switch (key) {
		case 'type':
			result.setSuggestions(
				type.filter((s) => s.toLowerCase().includes(query.toLowerCase()))
			)
			break
		case 'color':
			result.setSuggestions(
				colors.filter((s) => s.toLowerCase().includes(query.toLowerCase()))
			)
			break
		default:
			return
	}
})

figma.on('run', async ({ parameters }: RunEvent) => {
	try {
		if (parameters) {
			if (figma.currentPage.selection.length === 0) {
				figma.notify('Select at least one item.')
				figma.closePlugin()
			}

			if (parameters.color === 'Gray' && parameters.type === 'Solid') {
				console.log('solid gray =>')
				fills = [
					{
						type: 'SOLID',
						color: {
							r: 0.9,
							g: 0.9,
							b: 0.9,
						},
					},
				]
			}

			if (
				parameters.type === 'Solid' &&
				parameters.color !== 'Gray' &&
				parameters.color !== 'Black' &&
				parameters.color !== 'White'
			) {
				// const colorConvert = require('color-convert')
				const hexColor = parameters.color
				const rgbColor = colorConvert.hex.rgb(hexColor)

				// console.log('Color conversion =>', 'rgbColor =>', rgbColor, 'hexColor =>', hexColor)

				fills = [
					{
						type: 'SOLID',
						color: {
							r: rgbColor[0] / 255,
							g: rgbColor[1] / 255,
							b: rgbColor[2] / 255,
						},
					},
				]
			}

			if (parameters.color === 'Gray' && parameters.type === 'Gradient') {
				fills = [
					{
						type: 'GRADIENT_LINEAR',
						gradientTransform: [
							[-1, 1.516437286852579e-8, 1],
							[-1.7966517162903983e-8, -0.0659240335226059, 0.5335403084754944],
						],
						gradientStops: [
							{
								color: {
									r: 0.8588235378265381,
									g: 0.8588235378265381,
									b: 0.8588235378265381,
									a: 0.05,
								},
								position: 0,
							},
							{
								color: {
									r: 0.8588235378265381,
									g: 0.8588235378265381,
									b: 0.8588235378265381,
									a: 1,
								},
								position: 0.5,
							},
						],
					},
				]
			}

			if (parameters.color === 'Black' && parameters.type === 'Solid') {
				fills = [
					{
						type: 'SOLID',
						color: {
							r: 0,
							g: 0,
							b: 0,
						},
					},
				]
			}

			if (parameters.color === 'Black' && parameters.type === 'Gradient') {
				fills = [
					{
						type: 'GRADIENT_LINEAR',
						gradientTransform: [
							[-1, 1.516437286852579e-8, 1],
							[-1.7966517162903983e-8, -0.0659240335226059, 0.5335403084754944],
						],
						gradientStops: [
							{
								color: {
									r: 0,
									g: 0,
									b: 0,
									a: 1,
								},
								position: 0,
							},
							{
								color: {
									r: 0,
									g: 0,
									b: 0,
									a: 0.05,
								},
								position: 0.5,
							},
						],
					},
				]
			}

			if (parameters.color === 'White' && parameters.type === 'Solid') {
				fills = [
					{
						type: 'SOLID',
						color: {
							r: 1,
							g: 1,
							b: 1,
						},
					},
				]
			}

			if (parameters.color === 'White' && parameters.type === 'Gradient') {
				fills = [
					{
						type: 'GRADIENT_LINEAR',
						gradientTransform: [
							[-1, 1.516437286852579e-8, 1],
							[-1.7966517162903983e-8, -0.0659240335226059, 0.5335403084754944],
						],
						gradientStops: [
							{
								color: {
									r: 1,
									g: 1,
									b: 1,
									a: 1,
								},
								position: 0,
							},
							{
								color: {
									r: 1,
									g: 1,
									b: 1,
									a: 0.05,
								},
								position: 0.5,
							},
						],
					},
				]
			}

			// ================================== Ghostify Design ============================================>
			let all: SceneNode[] = []
			const traversal = (
				currentSelectionNodes: readonly SceneNode[],
				allNodes: SceneNode[]
			) => {
				const t = (function* e(t) {
					const a = t.length
					if (0 !== a) {
						for (let i = 0; i < a; i++) {
							const a = t[i]
							yield a
							let o: readonly SceneNode[]
							if (doesItHavePropertyChildren(a)) {
								o = a.children
							}
							o && (yield* e(o))
						}
						allNodes.push(...t)
					}
				})(currentSelectionNodes)
				let a = t.next()
				for (; !a.done; ) a = t.next()
			}

			traversal(figma.currentPage.selection, all)
			all = all.flat()

			const detach = (sceneNodes: SceneNode[]) => {
				let t: SceneNode[] = []
				const instanceNodes: InstanceNode[] = []
				sceneNodes.forEach((node) => {
					if (node.type === 'INSTANCE' && 'I' !== node.id.substring(0, 1)) {
						instanceNodes.push(node)
					}
				})

				if (instanceNodes.length > 0) {
					traversal(
						instanceNodes.map((node) => node.detachInstance()),
						t
					)

					all.push(
						...t
							.flat()
							.filter((node) => 'INSTANCE' !== node.type)
							.filter((node) => 'I' !== node.id.substring(0, 1))
					)

					t = t
						.flat()
						.filter((node) => 'INSTANCE' === node.type)
						.filter((node) => 'I' !== node.id.substring(0, 1))

					detach(t)
					all.flat()
				}
			}

			detach(all)

			all = all
				.flat()
				.filter((e) => 'INSTANCE' !== e.type)
				.filter((e) => 'I' !== e.id.substring(0, 1))

			await ghostify(all, fills)
		}
	} catch (error) {
		console.error('Plugin error =>', error)
	}
})
