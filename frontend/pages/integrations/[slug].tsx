import { Plus } from "iconoir-react"
import { GetServerSideProps } from "next"
import Link from "next/link"
import React from "react"
import api from "../../lib/util/api"
import { Developer, Integration } from "../../lib/util/types"

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
	if (typeof params?.slug !== "string") return { notFound: true }

	const { data } = await api.integrations.publicOne(params.slug)
	if (!data.integration) return { notFound: true }

	return {
		props: { integration: data.integration }
	}
}

const IntegrationsSlug: React.FC<{
	integration: Integration & { owner: Developer }
}> = ({ integration }) => {
	return (
		<React.Fragment>
			<div className="mx-auto max-w-screen-lg py-12">
				<h1 className="my-4 text-center text-5xl font-bold">
					{integration.name}
				</h1>
				<p className="my-4 text-center font-mono text-gray-500">
					{integration.id}
				</p>
				{integration.isVerified && (
					<p className="my-4 text-center font-mono text-sm font-bold uppercase text-success">
						Verfied
					</p>
				)}
				<p className="mt-8 mb-4 flex items-center justify-center gap-2 text-center text-2xl font-medium">
					By:{" "}
					<img
						src={integration.owner.avatarUrl}
						alt={`Avatar of ${integration.owner.name}`}
						width={32}
						height={32}
					/>
					<a
						href={`https://github.com/${integration.owner.username}`}
						className="text-success hover:underline"
					>
						{integration.owner.username}
					</a>
				</p>
				<p className="mt-12 flex items-center justify-center text-center">
					<a href={integration.addUrl} className="button mr-4 bg-success">
						<Plus /> Add integration
					</a>
					<Link href="/">
						<a className="button bg-gray-500">Homepage</a>
					</Link>
				</p>
			</div>
		</React.Fragment>
	)
}

export default IntegrationsSlug
