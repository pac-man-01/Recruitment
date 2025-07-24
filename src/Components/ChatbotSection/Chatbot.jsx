import { useState, useEffect, useRef, useContext } from "react";
import "./Chatbot.css";
import chatbotLogo from "../../Util/Images/vi_avatar_bot_2.png";
import { v4 as uuidv4 } from "uuid";
import { useAudioRecorder } from "react-audio-voice-recorder";
import Experience from "../Experience";
import { Canvas } from "@react-three/fiber";
import { ChatContext, useChat } from "../../hooks/useChat";
import saveResponses from "../../Util/save-responses";
import endInterview from "../../Util/end-interview";
import { IoMdMic, IoMdMicOff } from "react-icons/io";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

const Chatbot = () => {
  const { transcript, resetTranscript, listening } = useSpeechRecognition();
  const { startRecording, stopRecording, recordingBlob, isRecording } =
    useAudioRecorder();
  const { quesToHighlight, disableInput, setDisableInput } =
    useContext(ChatContext);
  const { chat, textMessage, displayText } = useChat();
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: `Hi ${sessionStorage.getItem("firstName")}, How is your day going?`,
      sender: "bot",
    },
  ]);
  const [userMessage, setUserMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionID, setSessionID] = useState(null);
  const chatContainerRef = useRef(null);
  const [previousBotResponse, setPreviousBotResponse] = useState(
    `Hi ${sessionStorage.getItem("firstName")}, How is your day going?`
  );

  const startAudioTranscript = () => {
    resetTranscript();
    SpeechRecognition.startListening({ continuous: true });
  };

  const stopAudioTranscript = () => {
    SpeechRecognition.stopListening();
  };

  const handleAudioRecording = () => {
    if (isRecording) {
      stopRecording();
      stopAudioTranscript();
    } else {
      startRecording();
      startAudioTranscript();
    }
  };

  const audioBlobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const arrayBuffer = reader.result;
        const base64Audio = btoa(
          new Uint8Array(arrayBuffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ""
          )
        );
        resolve(base64Audio);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });
  };

  const addAudioElement = async (blob) => {
    try {
      const url = URL.createObjectURL(blob);
      const userMsg = {
        id: messages.length + 1,
        audioUrl: url,
        sender: "user",
      };
      setMessages([...messages, userMsg]);
      setIsTyping(true);
      scrollToBottom();

      const base64Audio = await audioBlobToBase64(blob);
      await sendMessage(transcript, base64Audio);
    } catch (error) {
      console.error("Error:", error.message);
    }
  };

  useEffect(() => {
    if (textMessage && displayText) {
      handleBotResponse(textMessage);
    }
  }, [displayText]);

  const handleBotResponse = async (textMessage) => {
    if (textMessage.queryResult && textMessage.queryResult.responseMessages) {
      const responseMessages = textMessage.queryResult.responseMessages;
      let index = 0;

      if (textMessage.queryResult.parameters.endFlow === "true") {
        await endInterview(sessionStorage.getItem("applicationID"));
        const botResponse = {
          id: messages.length + 1,
          text: responseMessages[0].text.text[0],
          sender: "bot",
        };
        setMessages((prevMessages) => [...prevMessages, botResponse]);
        setDisableInput(true);
        setIsTyping(false);
        scrollToBottom();
        setTimeout(() => {
          window.location.href = "/interviewClosePage";
        }, 9400);
        return;
      }

      // Handle multiple bot responses
      const intervalId = setInterval(() => {
        const botResponse = {
          id: messages.length + index + 1,
          text: responseMessages[index].text.text[0],
          sender: "bot",
        };
        setPreviousBotResponse(botResponse?.text);
        setMessages((prevMessages) => [...prevMessages, botResponse]);
        index++;
        if (index >= responseMessages.length) {
          // Disable input only after the last bot response
          setIsTyping(false);
          setDisableInput(true);
          clearInterval(intervalId);
          scrollToBottom();
        }
      }, 500);
    }
  };

  const sendMessage = async (audioTranscript, base64Audio) => {
    if (audioTranscript) {
      setUserMessage("");
      setIsTyping(true);
      setDisableInput(true);
      scrollToBottom();
      const request = {
        session: sessionID,
        queryInput: {
          text: {
            text: audioTranscript,
            languageCode: "en-US",
          },
        },
        queryParams: {
          parameters: JSON.parse(sessionStorage.getItem("queryParams")),
        },
      };
      const saveStatus = await saveResponses(
        "audio_and_text",
        sessionStorage.getItem("applicationID"),
        base64Audio,
        audioTranscript,
        previousBotResponse,
        sessionID,
        quesToHighlight
      );
      if (saveStatus === "success") {
        chat(request);
      }
    }
    if (userMessage.trim() !== "") {
      const userMsg = {
        id: messages.length + 1,
        text: userMessage,
        sender: "user",
      };
      setMessages([...messages, userMsg]);
      setUserMessage("");
      setIsTyping(true);
      scrollToBottom();
      const request = {
        session: sessionID,
        queryInput: {
          text: {
            text: userMessage,
            languageCode: "en-US",
          },
        },
        queryParams: {
          parameters: JSON.parse(sessionStorage.getItem("queryParams")),
        },
      };
      const saveStatus = await saveResponses(
        "text",
        sessionStorage.getItem("applicationID"),
        "",
        userMessage,
        previousBotResponse,
        sessionID,
        quesToHighlight
      );
      if (saveStatus === "success") {
        chat(request);
      }
    }
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      sendMessage();
      setDisableInput(true);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!listening && recordingBlob) {
      const timeout = setTimeout(() => {
        if (transcript.trim() !== "") {
          addAudioElement(recordingBlob);
        }
      }, 500); // wait 500ms after stopping
      return () => clearTimeout(timeout);
    }
  }, [listening, transcript, recordingBlob]);

  useEffect(() => {
    //Session ID Created once user visits for the first time
    setSessionID(uuidv4());
  }, []);

  return (
    <div className="chatbot-container">
      <div className="bg-image-chatbot">
        <div className="flex chatbot-inner">
          <div className="canvas_container">
            <Canvas shadows camera={{ position: [0, 0, 1], fov: 30 }}>
              <Experience />
            </Canvas>
          </div>
          <div>
            <div className="chatbot-window " ref={chatContainerRef}>
              <div className="chat-container">
                {messages.map((message) => (
                  <div key={message.id} className={`message ${message.sender}`}>
                    {message.sender === "bot" && (
                      <img src={chatbotLogo} alt="Bot" className="avatar" />
                    )}
                    {message.audioUrl && (
                      <audio
                        controls
                        src={message.audioUrl}
                        className={`message-audio ${message.sender}`}
                      />
                    )}
                    {message.text && (
                      <div className={`message-text ${message.sender}`}>
                        {message.text}
                      </div>
                    )}

                    {message.sender === "user" && (
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          background: "#353535",
                          borderRadius: 64,
                          justifyContent: "center",
                          alignItems: "center",
                          gap: 10,
                          display: "flex",
                          color: "#fff",
                          minWidth: "40px",
                        }}
                        className="avatar"
                      >
                        {sessionStorage.getItem("lastName")[0]}
                        {sessionStorage.getItem("firstName")[0]}
                      </div>
                    )}
                  </div>
                ))}
                {isTyping && (
                  <div className="message bot">
                    <img src={chatbotLogo} alt="Bot" className="avatar" />
                    <div className="typing-indicator"></div>
                  </div>
                )}

                <div></div>
              </div>
            </div>
            <div className="flex gap-2 mt-3 pb-3 input-div">
              <input
                type="text"
                placeholder="Type your message here"
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                className="w-full lg:w-full px-4 border border-gray-300 focus:outline-none"
                onKeyPress={handleKeyPress}
                disabled={disableInput}
              />
              <div style={{ display: "none" }}>{/* <Speech text="" /> */}</div>
              <button
                className={`bg-gray-50 flex items-center mic-btn`}
                disabled={disableInput}
                onClick={handleAudioRecording}
                style={{
                  backgroundColor: disableInput ? "#a0a0a0" : "",
                  color: disableInput ? "#a0a0a0" : "",
                  cursor: disableInput ? "not-allowed" : "",
                }}
              >
                {isRecording ? (
                  <div>
                    <IoMdMic style={{ color: "#000" }} size={25} />
                  </div>
                ) : (
                  <div>
                    <IoMdMicOff style={{ color: "#000" }} size={25} />
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
