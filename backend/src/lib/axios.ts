import Axios from "axios"

const axios = Axios.create({
	validateStatus: () => true
})

export default axios
