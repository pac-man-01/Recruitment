import axios from "axios";
import BASE_URL from "./configApi";



const saveResponses = async (answerMode, applicationId, candidateAudio, candidateText, interviewerQues, sessionId,quesToHighlight) => {
    try {
        const token = localStorage.getItem('access_token');
        const request = {
            answer_reply_mode: answerMode,
            application_id: applicationId,
            candidate_answer_audio: candidateAudio,
            candidate_answer_txt: candidateText,
            interviewer_question: interviewerQues,
            session_id: sessionId,
            ques_to_highlight:quesToHighlight || 0,
        }
        const response = await axios.post(
            `${BASE_URL}/setConversation`,
            request, {headers:{
                'Authorization':`Bearer ${token}`
              }}
        );
        return response.data.message
    } catch (error) {
        console.error(error);
    }

}

export default saveResponses