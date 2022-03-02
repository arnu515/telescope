import { GetServerSideProps } from 'next'
import React from 'react'
import { getSession } from '../../lib/session'
import { Developer } from '../../lib/util/types'

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const session = await getSession(req, res)
  if (!session.dev)
    return { redirect: { statusCode: 302, destination: '/developers/auth' } }

  return { props: { dev: session.dev ?? null } }
}

const DevelopersIndex: React.FC<{ dev: Developer }> = ({ dev }) => {
  return (
    <React.Fragment>
      <div className="mx-auto max-w-screen-lg py-12">
        <h1 className="my-4 text-center text-5xl font-bold">
          Hello, {dev.name}!
        </h1>
        <p className="mt-12 text-center font-medium">
          Signed in as{' '}
          <a
            href={`https://github.com/${dev.username}`}
            className="text-success hover:underline"
          >
            {dev.username}
          </a>
          .{' '}
          <a
            href="/api/developers/logout"
            className="text-success hover:underline"
          >
            Logout
          </a>
        </p>
      </div>
    </React.Fragment>
  )
}

export default DevelopersIndex
