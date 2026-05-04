/** @type {import('tailwindcss'.Config)} */
export default{
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                serif:['"Playfair Display"', 'serif'],
                mono:['"JetBrains Mono"', 'monospace'],
            },
            colors: {
                paper:'#F4F0EB',
                ink: "#1C1C1C",
                highlighter: "#E63946",
            },
        },
    },
    plugins: []
}