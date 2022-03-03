import { GetServerSideProps } from "next"
import Link from "next/link"
import { useRouter } from "next/router"
import React from "react"
import ErrorAlert from "../../../lib/components/ErrorAlert"
import { ErrorObject } from "../../../lib/util/types"
import { getSession } from "../../../lib/session"
import { handleForm } from "../../../lib/util/form"

export const getServerSideProps: GetServerSideProps = async ({
	req,
	res,
	query
}) => {
	const session = await getSession(req, res)
	if (!session.dev)
		return { redirect: { statusCode: 302, destination: "/developers/auth" } }

	let err = null
	if (typeof query.error === "string") {
		err = {
			error: query.error,
			error_description: query.error_description || query.error
		} as ErrorObject
	}

	return {
		props: {
			dev: session.dev ?? null,
			err
		}
	}
}

const DevelopersIntegrationsSlug: React.FC<{
	err?: ErrorObject
}> = ({ err = null }) => {
	const router = useRouter()
	const [formError, setFormError] = React.useState<ErrorObject | null>(err)
	const [loading, setLoading] = React.useState<boolean>(false)

	React.useEffect(() => {
		// clear query string
		window.history.replaceState({}, "", `/developers/integrations/create`)
	}, [])

	async function createIntegration(fd: FormData) {
		const integration: any = {}
		for (const [key, value] of fd.entries()) {
			integration[key] = value
		}

		setLoading(true)
		const res = await fetch("/api/developers/integrations/create", {
			method: "POST",
			body: JSON.stringify(integration),
			headers: {
				"Content-Type": "application/json"
			}
		})
		setLoading(false)

		const data = await res.json()
		if (res.status === 200) router.push("/developers")
		else setFormError(data)

		console.log(data)
	}

	return (
		<React.Fragment>
			<div className="mx-auto max-w-screen-lg py-12">
				<h1 className="my-4 text-center text-5xl font-bold">
					Create integration
				</h1>
				<p className="my-4 text-center font-mono text-gray-500">
					Use the below form to create your own integration
				</p>
				<form
					method="POST"
					action={`/api/developers/integrations/create`}
					onSubmit={handleForm(createIntegration)}
				>
					<p className="mt-6 mb-12 text-center">
						<Link href="/developers">
							<a className="button mr-2 bg-success">Back</a>
						</Link>
						<button
							type="submit"
							className="button mr-4 bg-blue-500"
							disabled={loading}
						>
							{loading ? "..." : "Create"}
						</button>
					</p>

					<ErrorAlert
						error={formError ?? undefined}
						dismissable
						onDismiss={() => setFormError(null)}
					/>
					<div className="mt-6">
						<p className="mt-4">
							{/* TODO: Extract these to a class (maybe a component) */}
							<label htmlFor="name" className="my-1 block text-lg font-medium">
								Integration name
							</label>
							<input
								type="text"
								className="w-[80%] rounded border border-gray-700 bg-gray-600 px-2 py-1 font-mono text-white outline-none focus:border-gray-300"
								required
								maxLength={255}
								id="name"
								name="name"
							/>
							<small className="mt-1 block text-sm">
								The name of the integration. This is what your users will see.
							</small>
						</p>
						<p className="mt-4">
							<label htmlFor="id" className="my-1 block text-lg font-medium">
								Integration ID
							</label>
							<input
								type="text"
								className="w-[80%] cursor-help rounded border border-gray-700 bg-gray-600 px-2 py-1 font-mono text-gray-400 outline-none focus:border-gray-300"
								value="Auto generated"
								disabled
								title="To change the integration ID, you need to get it verified."
								id="id"
							/>
							<small className="mt-1 block text-sm">
								You will be able to change the ID once your integration is
								verified.
							</small>
						</p>
						<p className="mt-4">
							<label
								htmlFor="baseUrl"
								className="my-1 block text-lg font-medium"
							>
								Base API URL
							</label>
							<input
								type="url"
								className="w-[80%] rounded border border-gray-700 bg-gray-600 px-2 py-1 font-mono text-white outline-none focus:border-gray-300"
								required
								id="baseUrl"
								name="baseUrl"
							/>
							<small className="mt-1 block text-sm">
								This is the URL that will host your Integration's API
							</small>
						</p>
						<p className="mt-4">
							<label
								htmlFor="addUrl"
								className="my-1 block text-lg font-medium"
							>
								Add URL
							</label>
							<input
								type="text"
								className="w-[80%] rounded border border-gray-700 bg-gray-600 px-2 py-1 font-mono text-white outline-none focus:border-gray-300"
								required
								id="addUrl"
								name="addUrl"
							/>
							<small className="mt-1 block text-sm">
								This is the URL users will visit to add your integration.
							</small>
						</p>
						<input type="hidden" name="redirect" value={`/developers`} />
						<p className="mt-4">
							<button
								type="submit"
								className="button mr-2 bg-blue-500"
								disabled={loading}
							>
								{loading ? "..." : "Create integration"}
							</button>
						</p>
					</div>
				</form>
			</div>
		</React.Fragment>
	)
}

export default DevelopersIntegrationsSlug
