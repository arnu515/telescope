import { GetServerSideProps } from 'next'
import Link from 'next/link'
import React from 'react'
import ErrorAlert from '../../../lib/components/ErrorAlert'
import {
  Developer,
  ErrorObject,
  IntegrationCredentials,
} from '../../../lib/util/types'
import { getSession } from '../../../lib/session'
import api from '../../../lib/util/api'
import { handleForm } from '../../../lib/util/form'
import { Integration } from '../../../lib/util/types'
import { Plus, Trash } from 'iconoir-react'
import dayjs from 'dayjs'

export const getServerSideProps: GetServerSideProps = async ({
  req,
  res,
  params,
  query,
}) => {
  const session = await getSession(req, res)
  if (!session.dev)
    return { redirect: { statusCode: 302, destination: '/developers/auth' } }

  if (typeof params?.slug !== 'string') {
    return { notFound: true }
  }

  let err = null
  if (typeof query.error === 'string') {
    err = {
      error: query.error,
      error_description: query.error_description || query.error,
    } as ErrorObject
  }

  const secret = typeof query.secret === 'string' ? query.secret : null

  try {
    const integration =
      (await api.developers.integrations.one(session.token, params.slug)).data
        ?.integration ?? null
    return {
      props: {
        dev: session.dev ?? null,
        integration: integration,
        err,
        secret,
      },
    }
  } catch (e) {
    console.log(e)
    if ((e as any).status === 404) return { notFound: true }
    session.dev = null
    session.token = null
    return { redirect: { statusCode: 302, destination: '/developers/auth' } }
  }
}

const DevelopersIntegrationsSlug: React.FC<{
  integration: Integration & {
    owner: Developer
    credentials: IntegrationCredentials[]
  }
  err?: ErrorObject
  secret: string | null
}> = ({ integration: intg, err = null, secret }) => {
  const [integration, setIntegration] = React.useState(intg)
  const [formError, setFormError] = React.useState<ErrorObject | null>(err)
  const [loading, setLoading] = React.useState<boolean>(false)
  const [clientSecret, setClientSecret] = React.useState<string | null>(secret)

  React.useEffect(() => {
    // clear query string
    window.history.replaceState({}, '', `/developers/integrations/${intg.id}`)
  }, [])

  async function saveIntegration(fd: FormData) {
    const integration: any = {}
    for (const [key, value] of fd.entries()) {
      integration[key] = value
    }

    setLoading(true)
    const res = await fetch(
      '/api/developers/integrations/' + intg.id + '/update',
      {
        method: 'PUT',
        body: JSON.stringify(integration),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
    setLoading(false)

    const data = await res.json()
    if (res.status === 200) setIntegration(data.integration)
    else setFormError(data)

    console.log(data)
  }

  return (
    <React.Fragment>
      <div className="mx-auto max-w-screen-lg py-12">
        <h1 className="my-4 text-center text-5xl font-bold">
          {integration.name}
        </h1>
        <p className="my-4 text-center font-mono text-gray-500">
          {integration.id}
        </p>
        <form
          method="POST"
          action={`/api/developers/integrations/${integration.id}/update`}
          onSubmit={handleForm(saveIntegration)}
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
              {loading ? '...' : 'Save'}
            </button>
          </p>

          <h2 className="my-4 text-3xl font-medium">Basic information</h2>
          <ErrorAlert
            error={formError ?? undefined}
            dismissable
            onDismiss={() => setFormError(null)}
          />
          <div className="mt-12">
            <p className="mt-4">
              {/* TODO: Extract these to a class (maybe a component) */}
              <label htmlFor="name" className="my-1 block text-lg font-medium">
                Integration name
              </label>
              <input
                type="text"
                className="w-[80%] rounded border border-gray-700 bg-gray-600 px-2 py-1 font-mono text-white outline-none focus:border-gray-300"
                defaultValue={integration.name}
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
                defaultValue={integration.id}
                disabled
                title="To change the integration ID, you need to get it verified."
                id="id"
              />
              <small className="mt-1 block text-sm">
                We're working on an automated verification process. You can
                change the ID once your integration is verified.
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
                defaultValue={integration.baseUrl}
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
                defaultValue={integration.addUrl}
                id="addUrl"
                name="addUrl"
              />
              <small className="mt-1 block text-sm">
                This is the URL users will visit to add your integration.
              </small>
            </p>
            <input
              type="hidden"
              name="redirect"
              value={`/developers/integrations/${integration.id}`}
            />
            <p className="mt-4">
              <button
                type="submit"
                className="button mr-2 bg-blue-500"
                disabled={loading}
              >
                {loading ? '...' : 'Save'}
              </button>
              <button
                type="reset"
                className="button bg-gray-500"
                disabled={loading}
              >
                Reset
              </button>
            </p>
          </div>
        </form>
        <h2 className="mt-8 mb-4 text-3xl font-medium">Credentials</h2>
        <p className="my-4 text-xl font-medium">
          Key:{' '}
          <span className="font-mono text-gray-400">{integration.key}</span>
        </p>
        <h3 className="my-4 text-2xl">Client credentials</h3>
        <p className="my-4 text-lg">
          Use these credentials to interact with the Telescope API
        </p>
        {clientSecret && (
          <div className="my-4 rounded border border-white bg-success px-3 py-1 text-white">
            Your client secret is{' '}
            <strong className="font-mono font-medium brightness-90">
              {clientSecret}
            </strong>
            . It won't be displayed again.
          </div>
        )}
        <div className="my-4 mx-auto flex max-w-screen-lg flex-col gap-4 py-12">
          <div className="flex flex-col gap-2 rounded-xl bg-[#333] px-8 py-4">
            <p className="flex items-center justify-between text-2xl font-medium">
              Create credentials
              <a
                href={`/api/developers/integrations/${intg.id}/credentials?redirect=%2Fdevelopers%2Fintegrations%2F${intg.id}`}
                className="button bg-success text-base font-normal"
              >
                <Plus /> Create
              </a>
            </p>
          </div>
          {integration.credentials.map((c) => (
            <div
              key={c.id}
              className="flex flex-col gap-2 rounded-xl bg-[#333] px-8 py-4"
            >
              <p className="flex items-center justify-between text-2xl font-medium">
                <span className="text-medium font-mono">{c.id}</span>
                <a
                  href={`/api/developers/integrations/${intg.id}/credentials?id=${c.id}&redirect=%2Fdevelopers%2Fintegrations%2F${intg.id}`}
                  className="button bg-error text-base font-normal"
                >
                  <Trash /> Delete
                </a>
              </p>
              <p className="mt-2 flex items-center justify-between text-lg">
                <span className="font-mono">{c.uses} uses</span>
                <span className="text-gray-500">
                  Created on{' '}
                  {dayjs(integration.createdAt).format('YYYY, MMM DD')}
                </span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </React.Fragment>
  )
}

export default DevelopersIntegrationsSlug
