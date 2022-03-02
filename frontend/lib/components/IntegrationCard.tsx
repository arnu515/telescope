import { MoreHoriz, Plus } from 'iconoir-react'
import Link from 'next/link'
import { Integration } from '../util/types'

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

export default IntegrationCard
