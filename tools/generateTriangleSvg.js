const getPath = (i, color) => `<path
		d="M${50 + i * 100} 10 L${80 + i * 100} 90 L${20 + i * 100} 90 Z"
		fill="${color}"
		stroke="white"
		stroke-width="10"
	/>`

const getSvg = () => {
	const pathes = Object.values(typesData).map((e, i) => getPath(i, e.color))
	return `<svg
	xmlns="http://www.w3.org/2000/svg"
	viewBox="0 0 ${pathes.length * 100} 100"
	width="${pathes.length * 100}"
	height="100"
	>
	${pathes.join('\n')}
</svg>`
}

getSvg()
