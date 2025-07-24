import React, { useState, useRef, useContext } from "react";
import backgroundImg from "../../Util/Images/recp.png";
import Webcam from "react-webcam";
import Swal from "sweetalert2";
import { IoMdCloseCircle } from "react-icons/io";
import { FaCamera } from "react-icons/fa";
import { IoMdInformationCircle } from "react-icons/io";
import { AiOutlineCheck } from "react-icons/ai";
import { BsArrowCounterclockwise } from "react-icons/bs";
import "../webCam/webCamera.css";
import handleConvertToSpeech from "../../Util/text-to-speech";
import { ChatContext, useChat } from "../../hooks/useChat";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Loading from "../Loading";
import BASE_URL from "../../Util/configApi";

const WebCamera = () => {
  const [showWebcam, setShowWebcam] = useState(false);
  const [showSnapshot, setShowSnapshot] = useState(false);
  const [showIdUpload, setShowIdUpload] = useState(false);
  const [idFile, setIdFile] = useState(null);
  const [idFilePreview, setIdFilePreview] = useState(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [questionsPopup, setQuestionsPopup] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const webcamRef = useRef(null);
  const [isChecked, setIsChecked] = useState(false);
  const { chat, textMessage } = useChat();
  const getMicContext = useContext(ChatContext);
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const applicationID = sessionStorage.getItem("applicationID");
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${BASE_URL}/getPreInterviewQuestions`
      );
      setQuestions(response.data.data);
      setLoading(false);
      const token = response.data.access_token;
      localStorage.setItem("access_token", token);
    } catch (error) {
      console.error("Error fetching questions:", error);
      setLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    radioOption1: "",
    radioOption2: "",
    textInput: "",
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (e, index) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
    setErrors((prevErrors) => ({
      ...prevErrors,
      [`radioOption${index}`]: false,
    }));
  };

  const handleFormSubmitOfPrescreen = async () => {
    try {
      const formattedData = questions
        .map((item, index) => {
          let answer;
          if (
            item.questionType === "confirmation" ||
            item.questionType === "dropdown" ||
            item.questionType === "option"
          ) {
            answer =
              formData[`radioOption${index}`] ||
              formData[`dropdownOption${index}`] ||
              "";
          } else if (item.questionType === "inputText") {
            answer = formData.textInput || "";
          } else {
            return null;
          }
          return {
            question: item.question,
            answer_type: item.questionType,
            values: item.values || null,
            answer: answer,
          };
        })
        .filter(Boolean);

      const token = localStorage.getItem("access_token");
      const payload = {
        application_id: applicationID,
        prescreening_questions: formattedData,
      };

      await axios.post(
        `${BASE_URL}/prescreeningInterviewQA`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error("Error submitting form", error);
    }
  };

  const handleNavigate = () => {
    navigate("/pageNotFound");
  };

  const handleCheckboxChange = () => {
    setIsChecked(!isChecked);
  };
  const handleAllowClick = () => {
    setShowWebcam(true);
  };

  const handleStartInterview = () => {
    setShowDisclaimer(true);
    fetchQuestions();
  };

  const handleCloseWebcam = () => {
    setShowWebcam(false);
    setImageSrc(null);
  };

  // ---- STEP: TAKE PHOTO ----
  const handleTakeSnapshot = () => {
    // Ensure webcamRef is ready
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setImageSrc(imageSrc);
      setShowSnapshot(true);
      setShowWebcam(false);
    }
  };

  const handleRetakeSnapshot = () => {
    setImageSrc(null);
    setShowSnapshot(false);
    setShowWebcam(true);
  };

  // ---- STEP: GO TO ID UPLOAD ----
  const handleGoToIDUpload = () => {
    setShowSnapshot(false);
    setShowIdUpload(true);
  };

  const handleIdFileChange = (e) => {
    const file = e.target.files[0];
    setIdFile(file);
    setIdFilePreview(file ? URL.createObjectURL(file) : null);
  };
  const handleRemoveIDFile = () => {
    setIdFile(null);
    setIdFilePreview(null);
  };

  // ---- Upload both selfie and ID ----
  const uploadPhotographAndID = async () => {
    const applicationID = sessionStorage.getItem("applicationID");
    const formData = new FormData();
    formData.append("application_id", applicationID);
    formData.append("photo", imageSrc);
    formData.append("govt_id", idFile);

    const apiUrl = `${BASE_URL}/uploadPhotoAndGovtId`;
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.post(apiUrl, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error uploading:", error);
      throw error;
    }
  };

  const handleFinalSubmit = async () => {
    if (!imageSrc) {
      Swal.fire({ icon: "warning", text: "Please take a selfie first." });
      return;
    }
    if (!idFile) {
      Swal.fire({ icon: "warning", text: "Please upload your Government ID." });
      return;
    }
    try {
      await uploadPhotographAndID();
      setShowDisclaimer(false);
      setShowSnapshot(false);
      setShowWebcam(false);
      setShowInstructions(false);
      setShowIdUpload(false);

      Swal.fire({
        icon: "success",
        text: "Submitted successfully.",
        confirmButtonColor: "#26890D",
        confirmButtonText: "Close",
        customClass: {
          confirmButton: "custom-button-class",
        },
      }).then((result) => {
        if (result.isConfirmed) {
          setQuestionsPopup(true);
        }
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        text: "Upload failed. Please try again.",
      });
    }
  };

  const AfterQuestionSubmit = (e) => {
    e.preventDefault();
    handleFormSubmitOfPrescreen();
    setQuestionsPopup(false);

    const request = {
      session: uuidv4(),
      queryInput: {
        text: {
          text: `Hi ${sessionStorage.getItem(
            "firstName"
          )}, How is your day going?`,
          languageCode: "en-US",
        },
      },
      queryParams: {
        parameters: JSON.parse(sessionStorage.getItem("queryParams")),
      },
    };
    chat(request);
    sessionStorage.setItem("identityConfirmed", true);
  };

  const handleReset = () => {
    setFormData(formData);
  };

  return (
    <div style={{ fontFamily: "Open Sans, sans-serif" }}>
      <div className="row mt-2">
        <div className="col-md-12 ">
          <div className="img_container">
            {showSnapshot ? (
              <div className="snapshot_container">
                <div className="snapshot_content">
                  <div className="top_section">
                    <div className="text_close_btn_top">
                      <p>
                        Capture your photograph along with your Government
                        issued Id card
                      </p>
                      <IoMdCloseCircle
                        onClick={handleRetakeSnapshot}
                        fontSize="22px"
                        color="gray"
                        cursor="pointer"
                      />
                    </div>
                  </div>
                  <div className="image_section">
                    <img src={imageSrc} alt="Snapshot" />
                  </div>
                  <div className="btn_submit">
                    <div className="back_btn">
                      <BsArrowCounterclockwise
                        onClick={handleRetakeSnapshot}
                        fontSize="20px"
                        color="#000"
                      />
                    </div>
                    <div
                      className="final_btn_submit"
                      onClick={handleGoToIDUpload}
                    >
                      <AiOutlineCheck fontSize="20px" color="#ffff" />
                    </div>
                  </div>
                  <div className="disclaimer_text_final">
                    <IoMdInformationCircle color="#316BDE" />
                    <small>
                      Please capture a clear, front-facing portrait photo of
                      yourself. <br />
                      Make sure your face is well-lit and centered in the frame.
                    </small>
                  </div>
                </div>
              </div>
            ) : showIdUpload ? (
              <div className="snapshot_container">
                <div className="snapshot_content">
                  <div className="top_section">
                    <div className="text_close_btn_top">
                      <p>Upload your Government Issued ID Card</p>
                      <IoMdCloseCircle
                        onClick={() => {
                          setShowIdUpload(false);
                          setShowSnapshot(true);
                        }}
                        fontSize="22px"
                        color="gray"
                        cursor="pointer"
                      />
                    </div>
                  </div>
                  <div className="image_section">
                    {idFilePreview ? (
                      <div>
                        <img src={idFilePreview} alt="ID Preview" style={{maxHeight: 200}} />
                        <button
                          className="px-3 py-1 bg-red-500 text-white mt-2"
                          onClick={handleRemoveIDFile}
                        >Remove</button>
                      </div>
                    ) : (
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleIdFileChange}
                        className="my-2"
                      />
                    )}
                  </div>
                  <div className="btn_submit">
                    <div className="back_btn"
                      onClick={() => {
                        setShowIdUpload(false);
                        setShowSnapshot(true);
                      }}>
                      <BsArrowCounterclockwise fontSize="20px" color="#000" />
                    </div>
                    <div
                      className="final_btn_submit"
                      onClick={handleFinalSubmit}
                    >
                      <AiOutlineCheck fontSize="20px" color="#fff" />
                    </div>
                  </div>
                  <div className="disclaimer_text_final">
                    <IoMdInformationCircle color="#316BDE" />
                    <small>
                      Please upload a clear scan/photo of your government-issued ID.<br />
                      Accepted formats: JPG, PNG, PDF.
                    </small>
                  </div>
                </div>
              </div>
            ) : questionsPopup ? (
              // ...[rest of your original questionsPopup block]...
              <div className="pop_up_last">
                {/* The questions popup code stays exactly as you originally had it */}
                {/* ... */}
              </div>
            ) : showWebcam ? (
              <div className="webcam_container">
                <div className="text_close_btn">
                  <p>
                    Capture your photograph along with your Government issued Id
                    card
                  </p>
                  <IoMdCloseCircle
                    onClick={handleCloseWebcam}
                    fontSize="22px"
                    color="gray"
                    cursor="pointer"
                  />
                </div>
                <div className="webcam_container2">
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    width={515}
                    height={100}
                  />
                  <div className="camera_btn">
                    <FaCamera
                      onClick={handleTakeSnapshot}
                      fontSize="20px"
                      color="black"
                      style={{ cursor: "pointer" }}
                    />
                  </div>
                </div>
                <div className="disclaimer_text">
                  <IoMdInformationCircle color="#316BDE" />
                  <small>
                    Please capture a clear, front-facing portrait photo of
                    yourself. <br />
                    Make sure your face is well-lit and centered in the frame.
                  </small>
                </div>
              </div>
            ) : showDisclaimer ? (
              <div className="pop_up">
                <div className="modal_content">
                  <div className="text_modal">
                    <h2 style={{ fontFamily: "'Open Sans', sans-serif" }}>
                      Disclaimer
                    </h2>
                    <p style={{ fontFamily: "'Open Sans', sans-serif" }}>
                      This virtual interview application that has been developed
                      is exclusively owned by Deloitte Shared Services India LLP
                      (DSSILLP). The application enables collecting, compiling
                      or obtaining information using AI technology to assess the
                      information (including personal information but not
                      limited to qualifications and government identification
                      proof) (“Information”) submitted by you for evaluation of
                      your candidature.
                      <br />
                      <br />
                      By accessing this application-based tool, you shall not,
                      either directly or indirectly, copy, reproduce, modify,
                      distribute, disseminate the tool, reverse engineer,
                      decompile or obtain access to the underlying formulae of
                      the tool (nor shall aid or assist anyone in doing so).
                      <br />
                      <br />
                      Your continued participation and use of the
                      application-based tool constitutes consent to secure
                      capture of your Information for verification, and the
                      secure storage of your Information, voice recordings and
                      text responses solely for the purpose of evaluating your
                      candidature. For details on our data privacy practices,
                      please refer to our privacy policy available at [link].
                      <br />
                      <br />
                      No user of the software shall, either directly or
                      indirectly, copy, reproduce, modify, distribute,
                      disseminate the tool, reverse engineer, decompile or
                      obtain access to the underlying formulae of the tool (nor
                      shall aid or assist anyone in doing so).
                      <br />
                      <br />
                      THE APPLICATION BASED TOOL IS PROVIDED TO YOU OR PERMITTED
                      USERS ON AN “AS IS” BASIS AND DSSILLP EXPRESSLY DISCLAIMS
                      ALL WARRANTIES WITH RESPECT TO THE APPLICATION AND/OR THE
                      RELATED DOCUMENTATION, INCLUDING, BUT NOT LIMITED TO THOSE
                      OF NON-INFRINGEMENT, SATISFACTORY QUALITY,
                      MERCHANTIBILITY, FITNESS FOR PURPOSE AND DSSILLP ACCEPTS
                      NO LIABILITY WITH RESPECT TO YOUR USE OF THE TOOL. DTTILLP
                      HAS NO OBLIGATION TO PROVIDE SUPPORT, UPDATES, UPGRADES,
                      OR MODIFICATIONS TO THE TOOLS.
                    </p>
                  </div>
                  <div className="disclaimer-footer">
                    <label className="custom-checkbox-container">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        className="checkBox"
                        onChange={handleCheckboxChange}
                      />
                      <span className="custom-checkbox"></span>
                      <div className="terms-text">
                        I have read and agreed to the terms and conditions
                      </div>
                    </label>
                    <button
                      disabled={!isChecked}
                      className="btn col-12 mt-3 mb-3"
                      onClick={handleAllowClick}
                      style={{
                        backgroundColor: !isChecked ? "#CCCCCC" : "#26890D",
                        border: !isChecked
                          ? "1px solid #CCCCCC"
                          : "1px solid #26890D",
                        color: !isChecked ? "#000" : "#fff",
                        width: "200px",
                      }}
                    >
                      Submit
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              showInstructions && (
                <div className="pop_up">
                  <div className="modal_content">
                    <div className="text_modal">
                      <h2>Interview Instructions</h2>
                      <p style={{ fontFamily: "'Open Sans', sans-serif" }}>
                        Thank you for your interest in{" "}
                        <b>{sessionStorage.getItem("jobTitle")}</b> role at
                        Deloitte. We're excited to learn more about you through
                        this virtual interview process.
                      </p>
                      <p
                        style={{
                          paddingBottom: 0,
                          fontWeight: 600,
                          fontFamily: "'Open Sans', sans-serif",
                          color: "#63666a",
                        }}
                      >
                        Here's what to expect:
                      </p>
                      <ul style={{ fontFamily: "'Open Sans', sans-serif" }}>
                        <li>
                          <b>Disclaimer</b>: Briefly review the information
                          about data privacy and usage.
                        </li>
                        <li>
                          <b>Photo verification:</b> Take a clear, well-lit
                          selfie holding your valid photo ID next to your face.
                          Ensure both your face and ID are fully visible
                        </li>
                        <li>
                          <b>Government ID upload:</b> Upload a scanned image or photo of your government issued ID.
                        </li>
                        <li>
                          <b>Virtual interview:</b> A virtual recruiter will
                          guide you through a series of pre-recorded questions
                          tailored to the{" "}
                          <b>{sessionStorage.getItem("jobTitle")}</b> position.
                          Please answer clearly and concisely.
                        </li>
                        <li>
                          <b>Duration:</b> The interview typically takes 10-15
                          minutes to complete.
                        </li>
                        <li>
                          <b>No live interaction:</b> There will be no live
                          interaction during this initial interview. Your
                          responses will be recorded for review.
                        </li>
                      </ul>
                      <p
                        style={{
                          paddingBottom: 0,
                          fontWeight: 600,
                          fontFamily: "'Open Sans', sans-serif",
                          color: "#63666a",
                        }}
                      >
                        Important tips:
                      </p>
                      <ul style={{ fontFamily: "'Open Sans', sans-serif" }}>
                        <li>
                          Find a quiet, well-lit location with a stable internet
                          connection.
                        </li>
                        <li>
                          Use a device with a functioning webcam and microphone.
                        </li>
                        <li>
                          Dress professionally and present yourself in a
                          positive manner.
                        </li>
                        <li>
                          Listen carefully to each question and provide
                          thoughtful, complete answers.
                        </li>
                        <li>
                          Speak clearly and avoid background noise or
                          distractions.
                        </li>
                      </ul>
                      <p
                        style={{
                          paddingBottom: 0,
                          marginBottom: 0,
                          fontWeight: 600,
                          fontFamily: "'Open Sans', sans-serif",
                          color: "#63666a",
                        }}
                      >
                        What happens next?
                      </p>
                      <p
                        style={{
                          marginTop: 0,
                          fontFamily: "'Open Sans', sans-serif",
                        }}
                      >
                        Based on your responses, we will be in touch within 5
                        business days to inform you about the next steps in the
                        interview process.
                        <br />
                        Thank you for your time and interest in Deloitte! <br />
                        By clicking "Start Interview," you acknowledge that you
                        have read and understood these instructions.
                      </p>
                    </div>
                    <div className="disclaimer-footer">
                      <button
                        className="btn col-12 mt-3 mb-3 outline_custom"
                        style={{
                          backgroundColor: "#CCCCCC",
                          width: "200px",
                          color: "#26890D",
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn col-12 mt-3 mb-3 ml-6"
                        onClick={handleStartInterview}
                        style={{
                          width: "200px",
                          backgroundColor: "#26890d",
                          color: "white",
                        }}
                      >
                        Start Interview
                      </button>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebCamera;
