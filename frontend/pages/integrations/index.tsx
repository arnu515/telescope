import React from 'react'
import type { GetServerSideProps } from 'next'
import api from '../../lib/util/api'
import { Integration } from '../../lib/util/types'
import { MoreHoriz, Plus } from 'iconoir-react'
import Link from 'next/link'

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const { data } = await api.integrations.public()
  console.log(data.integrations)

  return {
    props: { integrations: data.integrations },
  }
}

const IntegrationCard: React.FC<{ integration: Integration }> = ({
  integration,
}) => {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-[#333] px-8 py-4">
      <p className="flex items-center justify-between text-2xl font-medium">
        {integration.name}
        <span className="font-mono text-xl font-normal text-gray-500">
          {integration.id}
        </span>
      </p>
      <p className="mt-4">
        <a href={integration.addUrl} className="button mr-2 bg-success">
          <Plus /> Add
        </a>
        <Link href={`/integrations/${integration.id}`}>
          <a className="button bg-gray-500">
            <MoreHoriz /> Details
          </a>
        </Link>
      </p>
    </div>
  )
}

const IntegrationsIndex: React.FC<{ integrations: Integration[] }> = ({
  integrations,
}) => {
  return (
    <React.Fragment>
      <div className="mx-auto max-w-screen-lg py-12">
        <h1 className="my-4 text-center text-5xl font-bold">
          Explore integrations
        </h1>
        <p className="mt-8 mb-4 text-center text-3xl font-medium">
          Explore verified integrations built by us and the community.
        </p>
        <p className="mt-12 text-center">
          <Link href="/">
            <a className="button mr-4 bg-success">Homepage</a>
          </Link>
          <Link href="/meeting">
            <a className="button bg-gray-500">Connect to a call</a>
          </Link>
        </p>
      </div>
      <div className="my-4 mx-auto flex max-w-screen-lg flex-col gap-4 py-12">
        {integrations.map((x, y) => (
          <IntegrationCard integration={x} key={y} />
        ))}
      </div>
    </React.Fragment>
  )
}

export default IntegrationsIndex
