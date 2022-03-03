import { Plus } from "iconoir-react"
import { GetServerSideProps } from "next"
import Link from "next/link"
import React from "react"
import IntegrationCard from "../../lib/components/IntegrationCard"
import { getSession } from "../../lib/session"
import api from "../../lib/util/api"
import { Developer, Integration } from "../../lib/util/types"

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
	const session = await getSession(req, res)
	if (!session.dev)
		return { redirect: { statusCode: 302, destination: "/developers/auth" } }

	try {
		const integrations =
			(await api.developers.integrations.all(session.token)).data
				?.integrations ?? null
		return { props: { dev: session.dev ?? null, integrations } }
	} catch (e) {
		console.log(e)
		session.dev = null
		session.token = null
		return { redirect: { statusCode: 302, destination: "/developers/auth" } }
	}
}

const DevelopersIndex: React.FC<{
	dev: Developer
	integrations: Integration[]
}> = ({ dev, integrations }) => {
	if (!dev) return null
	if (!integrations) return null

	return (
		<React.Fragment>
			<div className="mx-auto max-w-screen-lg py-12">
				<h1 className="my-4 text-center text-5xl font-bold">
					Hello, {dev.name}!
				</h1>
				<p className="mt-12 text-center font-medium">
					Signed in as{" "}
					<a
						href={`https://github.com/${dev.username}`}
						className="text-success hover:underline"
					>
						{dev.username}
					</a>
					.{" "}
					<a
						href="/api/developers/logout"
						className="text-success hover:underline"
					>
						Logout
					</a>
				</p>
				<p className="mt-6 mb-12 text-center">
					<Link href="/">
						<a className="button mr-4 bg-success">Homepage</a>
					</Link>
				</p>
				<h2 className="mt-12 text-center text-3xl font-medium">
					Your integrations
				</h2>
				<div className="my-4 mx-auto flex max-w-screen-lg flex-col gap-4 py-12">
					<div className="flex flex-col gap-2 rounded-xl bg-[#333] px-8 py-4">
						<p className="flex items-center justify-between text-2xl font-medium">
							Create integration
							<Link href="/developers/integrations/create">
								<a className="button bg-success text-base font-normal">
									<Plus /> Create
								</a>
							</Link>
						</p>
					</div>
					{integrations.map((x, y) => (
						<IntegrationCard
							integration={x}
							key={y}
							path="/developers/integrations/%id%"
						/>
					))}
				</div>
			</div>
		</React.Fragment>
	)
}

export default DevelopersIndex
