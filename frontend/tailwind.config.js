module.exports = {
	mode: "jit",
	content: ["./pages/**/*.{js,ts,jsx,tsx}", "./lib/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				error: "#c21f3d",
				success: "#00a878",
				bg: "#222222"
			}
		}
	},
	plugins: []
}
