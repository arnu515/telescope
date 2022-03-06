import { useRouter } from "next/router"
import React from "react"

const Component: React.FC = () => {
	const [callId, setCallId] = React.useState<string>("")
	const router = useRouter()

	const joinCall = () => {
		if (!callId.trim()) return

		router.push(`/calls/${callId}`)
	}

	return (
		<React.Fragment>
			<div className="mx-auto max-w-screen-lg py-12">
				<h1 className="my-4 text-center text-5xl font-bold">
					Connect to a call
				</h1>
				<div className="mt-8 mb-4 text-center text-3xl font-medium">
					<input
						type="text"
						className="w-[80%] rounded border border-gray-700 bg-gray-600 px-4 py-2 font-mono text-white outline-none focus:border-gray-300 md:w-[60%]"
						value={callId}
						onChange={e => setCallId(e.target.value)}
						required
						placeholder="Call ID"
						aria-label="Call ID"
						autoFocus
					/>
				</div>
				<p className="mt-4 text-center text-2xl">
					<button className="button mr-2 bg-blue-500" onClick={joinCall}>
						Join call
					</button>
				</p>
			</div>
		</React.Fragment>
	)
}

export default Component
