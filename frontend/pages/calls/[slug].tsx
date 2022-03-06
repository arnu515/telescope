import { GetServerSideProps } from "next"
import React from "react"
import api, { FetchError } from "../../lib/util/api"
import {
	Call as CallType,
	ErrorObject,
	Integration
} from "../../lib/util/types"
import isSupported from "../../lib/util/isBrowserSupported"
import Link from "next/link"
import ErrorAlert from "../../lib/components/ErrorAlert"
import Call from "../../lib/components/Call"

export const getServerSideProps: GetServerSideProps = async ({
	params,
	query
}) => {
	const slug = params!.slug as string

	if (!slug) return { notFound: true }
	let call

	let error = typeof query.error === "string" ? query.error : null
	let error_description =
		typeof query.error_description === "string" ? query.error_description : null

	try {
		const { data } = await api.integrations.calls.one(slug)

		if (!data.call) return { notFound: true }
		call = data.call
	} catch (e) {
		if (!(e instanceof FetchError)) return { notFound: true }
		console.log(e)
		if ((e as any).status === 404) return { notFound: true }
		error = e.error
		error_description = e.error_description
		return { props: { error, error_description } }
	}

	const authToken =
		typeof query.auth_token === "string" ? query.auth_token : null

	if (!authToken) return { props: { call, error, error_description } }

	try {
		const { data: tokenData } = await api.integrations.calls.getTokenData(
			slug,
			authToken
		)

		return {
			props: {
				call,
				token: authToken,
				suggested: tokenData.data,
				error,
				error_description
			}
		}
	} catch (e) {
		if (!(e instanceof FetchError))
			return { props: { call, isTokenInvalid: true } }
		console.log(e)
		error = e.error
		error_description = e.error_description
		return { props: { call, isTokenInvalid: true, error, error_description } }
	}
}

const CallsSlug: React.FC<{
	call?: CallType & { integration: Integration }
	token?: string
	suggested?: { nickname: string; avatarUrl: string }
	isTokenInvalid?: boolean
	error: string
	error_description: string
}> = ({
	call,
	token,
	suggested = {},
	isTokenInvalid = false,
	error,
	error_description
}) => {
	const [nickname, setNickname] = React.useState(suggested.nickname || "")
	const [joinButtonLoading, setJoinButtonLoading] = React.useState(false)
	const [twilioToken, setTwilioToken] = React.useState<string | null>(null)

	React.useEffect(() => {
		// clear query string
		window.history.replaceState({}, document.title, window.location.pathname)
	}, [])

	const [errObj, setErrObj] = React.useState<ErrorObject | undefined>(
		error ? { error, error_description } : undefined
	)

	if (!isSupported())
		return (
			<div className="mx-auto max-w-screen-lg py-12">
				<h1 className="my-4 text-center text-5xl font-bold">
					Browser not supported
				</h1>
				{errObj && (
					<div className="my-12">
						<ErrorAlert error={errObj} />
					</div>
				)}
				<p className="mt-8 mb-4 text-center text-3xl font-medium">
					Your browser doesn't support Telescope. Please upgrade to a newer
					browser.
				</p>
				<p className="mt-12 text-center">
					<Link href="/">
						<a className="button mr-4 bg-success">Homepage</a>
					</Link>
				</p>
			</div>
		)

	if (!call) {
		return (
			<div className="mx-auto max-w-screen-lg py-12">
				<h1 className="my-4 text-center text-5xl font-bold">Call not found</h1>
				{errObj && (
					<div className="my-12">
						<ErrorAlert error={errObj} />
					</div>
				)}
			</div>
		)
	}

	if (!token)
		return (
			<div className="mx-auto max-w-screen-lg py-12">
				<h1 className="my-4 text-center text-5xl font-bold">Join call</h1>
				{errObj && (
					<div className="my-12">
						<ErrorAlert error={errObj} />
					</div>
				)}
				<p className="mt-8 mb-4 text-center text-3xl font-medium">
					{isTokenInvalid
						? "The token is invalid, please authenticate again"
						: "Authenticate with your integration to prove that it is you"}
				</p>
				<p className="mt-12 text-center">
					<button
						className="button bg-blue-500"
						onClick={() =>
							(window.location.href = `${
								call.integration.baseUrl
							}/auth?key=${encodeURIComponent(
								call.integration.key
							)}&call_id=${encodeURIComponent(call.id)}`)
						}
					>
						Authenticate with {call.integration.name}
					</button>
				</p>
			</div>
		)

	async function joinCall(e: React.FormEvent) {
		e.preventDefault()

		if (!nickname.trim()) alert("Enter a nickname")

		setJoinButtonLoading(true)

		const res = await fetch(
			process.env.NEXT_PUBLIC_API_URL +
				`/api/integrations/calls/${call!.id}/calltoken`,
			{
				method: "POST",
				body: JSON.stringify({ nickname, avatarUrl: suggested.avatarUrl }),
				headers: {
					Authorization: `token ${token}`,
					"Content-Type": "application/json"
				}
			}
		)
		const data = await res.json()
		setJoinButtonLoading(false)

		if (data.error) {
			setErrObj(data)
		} else {
			setTwilioToken(data.token)
		}
	}

	if (!twilioToken)
		return (
			<React.Fragment>
				<div className="mx-auto max-w-screen-lg py-12">
					<h1 className="my-4 text-center text-5xl font-bold">Join call</h1>
					{errObj && (
						<div className="my-12">
							<ErrorAlert error={errObj} />
						</div>
					)}
					<p className="mt-8 mb-4 text-center text-3xl font-medium">
						You're authenticated. You can join the call.
					</p>
					<form
						onClick={joinCall}
						className="mt-12 flex flex-col items-center justify-center gap-2"
					>
						<img
							src={suggested.avatarUrl || "https://i.imgur.com/GhJz0Ks.png"}
							alt="Your avatar"
							width={128}
							height={128}
							className="m-2 rounded-xl border-2 border-white"
						/>
						<input
							type="text"
							className="rounded border border-gray-700 bg-gray-600 px-4 py-2 text-center font-mono text-white outline-none focus:border-gray-300"
							value={nickname}
							onChange={e => setNickname(e.target.value)}
							required
							placeholder="Nickname"
							aria-label="Nickname"
							autoFocus
						/>
						<button
							disabled={joinButtonLoading}
							className={`button ${
								joinButtonLoading ? "bg-blue-700" : "bg-blue-500"
							}`}
						>
							{joinButtonLoading ? "Loading..." : "Join the call"}
						</button>
					</form>
				</div>
			</React.Fragment>
		)

	return <Call token={twilioToken} />
}

export default CallsSlug
