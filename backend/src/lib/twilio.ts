import Twilio from "twilio"

export const apiSid = process.env.TWILIO_API_SID!
export const apiSecret = process.env.TWILIO_API_SECRET!
export const accountSid = process.env.TWILIO_ACCOUNT_SID!

const twilio = Twilio(apiSid, apiSecret, { accountSid })

export default twilio
