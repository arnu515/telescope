import { GetServerSideProps } from "next"
import React from "react"

export const getServerSideProps: GetServerSideProps = async () => {
	return { redirect: { destination: "/calls", permanent: true } }
}

const CallIndex: React.FC = () => {
	return <></>
}

export default CallIndex
