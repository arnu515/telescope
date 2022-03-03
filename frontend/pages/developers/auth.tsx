import React, { useEffect } from "react"
import { GitHub } from "iconoir-react"
import { GetServerSideProps } from "next"
import { Developer } from "../../lib/util/types"
import Link from "next/link"
import api from "../../lib/util/api"

export const getServerSideProps: GetServerSideProps = async ({
	query,
	req,
	res
}) => {
	const { getSession } = await import("../../lib/session")
	const session = await getSession(req, res)

	const token = query.token
	if (typeof token === "string") {
		try {
			const {
				data: { dev }
			} = await api.developers.me(token)
			session.dev = dev
			session.token = token
			return { redirect: { statusCode: 302, destination: "/developers" } }
		} catch (e) {
			console.log(e)
			return { props: { dev: null } }
		}
	}

	return { props: { dev: session.dev ?? null } }
}

const Auth: React.FC<{ dev: Developer }> = ({ dev }) => {
	useEffect(() => {
		// get rid of query string
		history.replaceState(null, "", "/developers/auth")
	}, [])

	return (
		<React.Fragment>
			<div className="mx-auto max-w-screen-lg py-12">
				<h1 className="my-4 text-center text-5xl font-bold">
					Sign in to your developer account
				</h1>
				<p className="mt-12 text-center font-medium">
					{dev ? (
						<Link href="/developers">
							<a className="button bg-success">Signed in. Click this button.</a>
						</Link>
					) : (
						<a
							href={`${process.env.NEXT_PUBLIC_API_URL}/api/developers/auth/github/connect`}
							className="button bg-success"
						>
							<GitHub strokeWidth={2} />
							Sign in with Github
						</a>
					)}
				</p>
			</div>
		</React.Fragment>
	)
}

export default Auth
