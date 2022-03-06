import { GetServerSideProps } from "next"
import React from "react"

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
	return {
		redirect: { destination: "/calls/" + params!.slug, permanent: true }
	}
}

const CallIndex: React.FC = () => {
	return <></>
}

export default CallIndex
