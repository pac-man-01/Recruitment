import axios from "axios";
import BASE_URL from "./configApi";

const endInterview = async (applicationId) => {
    try {
        const token = localStorage.getItem('access_token');
        const request = {application_id: applicationId}
        const response = await axios.patch(
            `${BASE_URL}/completeInterview`,
            request, {headers:{
                'Authorization':`Bearer ${token}`
              }}
        );
    } catch (error) {
        console.error(error);
    }

}

export default endInterview