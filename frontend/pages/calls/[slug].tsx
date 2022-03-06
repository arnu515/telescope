import { GetServerSideProps } from "next"
import React from "react"
import api, { FetchError } from "../../lib/util/api"
import { Call, Integration } from "../../lib/util/types"
import { isSupported } from "twilio-video"
import Link from "next/link"
import ErrorAlert from "../../lib/components/ErrorAlert"

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
	call?: Call & { integration: Integration }
	token?: string
	suggested?: { nickname?: string; avatarUrl?: string }
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
	if (!isSupported)
		return (
			<div className="mx-auto max-w-screen-lg py-12">
				<h1 className="my-4 text-center text-5xl font-bold">
					Browser not supported
				</h1>
				{error && (
					<div className="my-12">
						<ErrorAlert error={{ error, error_description }} />
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
				{error && (
					<div className="my-12">
						<ErrorAlert error={{ error, error_description }} />
					</div>
				)}
			</div>
		)
	}

	if (!token)
		return (
			<div className="mx-auto max-w-screen-lg py-12">
				<h1 className="my-4 text-center text-5xl font-bold">Join call</h1>
				{error && (
					<div className="my-12">
						<ErrorAlert error={{ error, error_description }} />
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

	return (
		<React.Fragment>
			<p>Token: {token}</p>
			<p>Suggested Nickname: {suggested.nickname || "None"}</p>
			<p>Suggested Avatar: {suggested.avatarUrl || "None"}</p>
		</React.Fragment>
	)
}

export default CallsSlug
