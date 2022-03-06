import Link from "next/link"
import React from "react"

const DevelopersDocs: React.FC = () => {
	return (
		<div className="mx-auto max-w-screen-lg py-12 px-4">
			<h1 className="my-4 text-center text-5xl font-bold">Coming soon</h1>
			<p className="my-4 text-center text-2xl font-medium">
				We're working on the documentation. For now, if you want to create your
				own integration, you can use Deno by looking at the source code of the
				existing integrations.
			</p>
			<p className="mt-12 text-center">
				<Link href="/">
					<a className="button mr-4 bg-success">Homepage</a>
				</Link>
				<a
					href="https://github.com/arnu515/telescope/tree/master/integrations"
					className="button bg-gray-500"
				>
					Source code
				</a>
			</p>
		</div>
	)
}

export default DevelopersDocs
