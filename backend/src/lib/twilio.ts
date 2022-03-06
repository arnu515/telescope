import Twilio from "twilio"

const twilio = Twilio(
	process.env.TWILIO_API_SID,
	process.env.TWILIO_API_SECRET,
	{ accountSid: process.env.TWILIO_ACCOUNT_SID }
)

export default twilio
