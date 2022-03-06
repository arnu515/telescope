import { isSupported as twilioIsSupported } from "twilio-video"
import { detect } from "detect-browser"

function isSupported(): boolean {
	if (twilioIsSupported) return true
	const browser = detect()

	// Twilio doesn't return `true` for certain chromium forks like Brave because they don't "extensively test them"
	// https://github.com/twilio/twilio-video.js/issues/1037
	return browser?.name === "chrome"
}

export default isSupported
