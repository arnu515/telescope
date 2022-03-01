import Link from 'next/link'
import React from 'react'

const Index: React.FC = () => {
  return (
    <React.Fragment>
      <div className="bg-[#121212]">
        <div className="mx-auto max-w-screen-lg py-12">
          <h1 className="my-4 text-center text-5xl font-bold">Telescope</h1>
          <p className="mt-8 mb-4 text-center text-3xl font-medium">
            Meetings integrated everywhere
          </p>
          <p className="mt-12 text-center">
            <Link href="/integrations">
              <a className="button mr-4 bg-success">Explore integrations</a>
            </Link>
            <Link href="/meeting">
              <a className="button bg-gray-500">Connect to a call</a>
            </Link>
          </p>
        </div>
      </div>
      <div className="py-12">
        <h2 className="my-4 text-center text-4xl font-bold">It's simple</h2>
        <p className="mt-8 text-center text-2xl font-medium">
          1. Use an integration to call somebody else
          <br />
          2. Connect to the call while knowing that nobody else can interrupt
          you
        </p>
      </div>
      <div className="bg-[#121212] py-12">
        <h2 className="my-4 text-center text-4xl font-bold">
          Create your own integration
        </h2>
        <p className="mt-8 text-center text-2xl font-medium">
          If you're tech savvy enough, you can create your own integration.
        </p>
        <p className="mt-8 text-center">
          <a href="/developers" className="button mr-4 bg-success">
            Get started
          </a>
          <a href="/developers/docs" className="button bg-gray-500">
            Read the docs
          </a>
        </p>
      </div>
    </React.Fragment>
  )
}

export default Index
