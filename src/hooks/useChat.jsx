import { createContext, useContext, useEffect, useState } from "react";
import BASE_URL from "../Util/configApi";

const backendUrl =
  "https://rec-eng-new-dialog-flow-uat-test-dot-in-gcp-apa-svc-af576-npd-1.wl.r.appspot.com/detect_intent";
const avatarUrl = `${BASE_URL}/getAvatarResponse`;

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [textValues, setTextValues] = useState([]);
  const [audioQuestion, setAudioQuestion] = useState([]);
  const [quesToHighlight, setQuesToHighlight] = useState(null);

  const chat = async (request) => {
    // opening message
    if (
      request.queryInput.text.text ===
      `Hi ${sessionStorage.getItem("firstName")}, How is your day going?`
    ) {
      const token = localStorage.getItem("access_token");
      const avatardata = await fetch(`${avatarUrl}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: request.queryInput.text.text }),
      });
      const resp = (await avatardata.json()).messages;
      // console.log("Responce", resp);
      if (resp) {
        setTextMessage(request?.queryInput?.text?.text);
        setMessages((messages) => [...messages, ...resp]);
      }
      setLoading(false);
    } else {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      // console.log("ELSE", token);
      const data = await fetch(`${backendUrl}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(request),
      });
      const jsonResponse = await data.json();
      const responseMessages = jsonResponse?.queryResult?.responseMessages;
      const textArray = responseMessages?.map((msg) => msg?.text?.text);
      const textString = textArray;
      const firstArrayAsString =
        textString && textString[0] !== undefined
          ? JSON.stringify(textString[0])
          : "";
      setTextValues(firstArrayAsString);
      setAudioQuestion(jsonResponse?.queryResult?.parameters?.question);
      setQuesToHighlight(
        jsonResponse?.queryResult?.parameters?.ques_to_highlight
      );
      setTextMessage(jsonResponse);
      setLoading(false);
    }
  };
  const [disableInput, setDisableInput] = useState(true);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState();
  const [textMessage, setTextMessage] = useState();
  const [loading, setLoading] = useState(false);
  const [cameraZoomed, setCameraZoomed] = useState(true);
  const [timerForAudio, setTimerForAudio] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const onMessagePlayed = () => {
    setMessages((messages) => messages.slice(1));
  };

  const requetText = {
    message: audioQuestion ? audioQuestion : textValues,
  };

  const avatarResponse = async (requetText) => {
    setLoading(true);
    const token = localStorage.getItem("access_token");
    if (requetText.message.length > 0) {
      const data = await fetch(`${avatarUrl}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requetText),
      });
      const resp = (await data.json()).messages;
      setMessages((messages) => [...messages, ...resp]);
      setDisplayText(resp[0].text);
      setLoading(false);
    }
    // else {
    //   const data = await fetch(`${avatarUrl}`, {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({
    //       message: `Hi ${sessionStorage.getItem(
    //         "firstName"
    //       )}, thanks for submitting your application! We're reviewing resumes for the position of ${sessionStorage.getItem(
    //         "candidateDesignation"
    //       )} and your resume caught our eye. How’s your day going?`,
    //     }),
    //   });
    //   const resp = (await data.json()).messages;
    //   setMessages((messages) => [...messages, ...resp]);
    //   setDisplayText(resp[0].text);
    //   setLoading(false);
    // }
  };

  useEffect(() => {
    avatarResponse(requetText);
  }, [textValues]);

  useEffect(() => {
    if (messages.length > 0) {
      setMessage(messages[0]);
    } else {
      setMessage(null);
    }
  }, [messages]);

  return (
    <ChatContext.Provider
      value={{
        chat,
        message,
        timerForAudio,
        setTimerForAudio,
        onMessagePlayed,
        loading,
        cameraZoomed,
        setCameraZoomed,
        textMessage,
        displayText,
        quesToHighlight,
        disableInput,
        setDisableInput,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
