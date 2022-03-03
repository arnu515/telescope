import { GetServerSideProps } from "next"
import React from "react"

export const getServerSideProps: GetServerSideProps = async () => {
	return { redirect: { statusCode: 302, destination: "/developers" } }
}

const DevelopersIntegrations: React.FC = () => {
	return <h1>Redirecting...</h1>
}

export default DevelopersIntegrations
