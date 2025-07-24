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
  const [showIdUpload, setShowIdUpload] = useState(false);      // NEW: Step 2
  const [idFile, setIdFile] = useState(null);                   // NEW: File Upload
  const [idFilePreview, setIdFilePreview] = useState(null);     // For preview
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

  //new form Q&A
  const applicationID = sessionStorage.getItem("applicationID");
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/getPreInterviewQuestions`);
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
    const applicationID = sessionStorage.getItem("applicationID");
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

  // ====[ STEPS FOR CAPTURING/UPLOADING ]=====
  const handleTakeSnapshot = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImageSrc(imageSrc);
    setShowSnapshot(true);
  };

  const handleRetakeSnapshot = () => {
    setImageSrc(null);
    setShowSnapshot(false);
    setShowWebcam(true);
  };

  // ---- Step 2: ID Upload ----
  const handleGoToIDUpload = () => {
    setShowSnapshot(false);
    setShowIdUpload(true); // go to ID upload step
  };
  const handleIdFileChange = (e) => {
    const file = e.target.files[0];
    setIdFile(file);
    setIdFilePreview(URL.createObjectURL(file));
  };
  const handleRemoveIDFile = () => {
    setIdFile(null);
    setIdFilePreview(null);
  };

  // ---- Upload both selfie and ID to backend ----
  const uploadPhotographAndID = async () => {
    const applicationID = sessionStorage.getItem("applicationID");
    const formData = new FormData();
    formData.append("application_id", applicationID);
    formData.append("photo", imageSrc); // base64 string
    formData.append("govt_id", idFile); // file

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
    // Validate both images
    if (!imageSrc) {
      Swal.fire({ icon: "warning", text: "Please take a selfie first." });
      return;
    }
    if (!idFile) {
      Swal.fire({ icon: "warning", text: "Please upload your Government ID." });
      return;
    }

    // Upload both images
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

  // ====== Pre-interview Submission & Form =======
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
            {questionsPopup ? (
              // --- PRESCREENING QUESTIONS -- [UNCHANGED]
              <div className="pop_up_last">
                <div className="container mx-auto">
                  <form onSubmit={AfterQuestionSubmit}>
                    <div className="flex justify-center ">
                      <h3 className="text-center text-2xl font-semibold text-gray-800 flex-grow">
                        Prescreening Interview Questions & Answers
                      </h3>
                      <IoMdCloseCircle
                        onClick={handleNavigate}
                        fontSize="20px"
                        color="gray"
                        cursor="pointer"
                      />
                    </div>

                    <div className="overflow-y-auto max-h-[21rem] bg-[#EDF9F0] p-4">
                      <>
                        {questions &&
                          questions?.map((item, index) => {
                            if (item.questionType === "confirmation") {
                              return (
                                <div key={index} className="relative mb-4">
                                  <label className="block text-[#63666a] font-semibold mb-2 text-sm">
                                    {item.question}
                                  </label>
                                  <div className="flex gap-4">
                                    {item.values.map((value, idx) => (
                                      <div
                                        className="flex items-center mb-2"
                                        key={idx}
                                      >
                                        <input
                                          className="form-radio h-4 w-4 accent-[#26890D] transition duration-150 ease-in-out"
                                          type="radio"
                                          required
                                          name={`radioOption${index}`}
                                          value={value}
                                          checked={
                                            formData[`radioOption${index}`] ===
                                            value
                                          }
                                          onChange={handleInputChange}
                                        />
                                        <label className="ml-2 block text-[#63666a] text-base">
                                          {value}
                                        </label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            } else if (item.questionType === "dropdown") {
                              return (
                                <div key={index} className="mb-4">
                                  <label className="block text-[#63666a] font-semibold mb-2 text-sm">
                                    {item.question}
                                  </label>
                                  <select
                                    className="form-select mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    id={`dropdownOption${index}`}
                                    name={`dropdownOption${index}`}
                                    value={
                                      formData[`dropdownOption${index}`] || ""
                                    }
                                    onChange={handleInputChange}
                                    required
                                  >
                                    <option value="">Select an option</option>
                                    {item.values.map((value, idx) => (
                                      <option key={idx} value={value}>
                                        {value}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              );
                            } else if (item.questionType === "option") {
                              return (
                                <div key={index} className="mb-4">
                                  <label className="block text-[#63666a] font-semibold mb-2 text-sm">
                                    {item.question}
                                  </label>
                                  <div className="flex gap-2">
                                    {item.values.map((value, idx) => (
                                      <button
                                        key={idx}
                                        className={`py-2 px-4  ${
                                          formData[`radioOption${index}`] ===
                                          value
                                            ? "bg-[#26890D] text-white"
                                            : "bg-gray-200 text-black"
                                        }`}
                                        value={value}
                                        name={`radioOption${index}`}
                                        onClick={handleInputChange}
                                      >
                                        {value}
                                      </button>
                                    ))}
                                    {errors[`radioOption${index}`] && (
                                      <div className="text-red-500 text-sm">
                                        Please select a value.
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            } else if (item.questionType === "inputText") {
                              return (
                                <div key={index} className="mb-4">
                                  <label className="block text-[#63666a] font-semibold mb-2 text-sm">
                                    {item.question}
                                  </label>
                                  <input
                                    type="text"
                                    className="form-input mt-1 block w-full py-2 px-3 border border-gray-300 rounded-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    id="textInput"
                                    required
                                    name="textInput"
                                    placeholder="Enter your answer"
                                    value={formData.textInput || ""}
                                    onChange={handleInputChange}
                                  />
                                </div>
                              );
                            } else {
                              return null;
                            }
                          })}
                      </>
                    </div>
                    <div className="form_submit_btn_final">
                      <button
                        type="button"
                        className="px-4 mt-4 py-1 border border-[#26890D] text-[#26890D]  text-lg outline_custom"
                        onClick={handleReset}
                      >
                        Reset
                      </button>
                      <button
                        type="submit"
                        className="px-4 mt-4 py-1 bg-[#26890D] text-white text-lg outline_custom"
                      >
                        Submit
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : showWebcam ? (
              // ---- Step 1: PHOTO CAPTURE ----
              <div className="webcam_container">
                <div className="text_close_btn">
                  <p>
                    Capture a clear photograph of yourself (Selfie)
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
                    />
                  </div>
                </div>
                <div className="disclaimer_text">
                  <IoMdInformationCircle color="#316BDE" />
                  <small>
                    Please make sure your face is well-lit and centered in the frame.
                  </small>
                </div>
              </div>
            ) : showSnapshot ? (
              // ---- Step 1b: PREVIEW PHOTO; proceed to ID upload ----
              <div className="snapshot_container">
                <div className="snapshot_content">
                  <div className="top_section">
                    <div className="text_close_btn_top">
                      <p>
                        Preview your selfie
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
                      Please capture a clear, front-facing portrait photo of yourself.<br />
                      Make sure your face is well-lit and centered in the frame.
                    </small>
                  </div>
                </div>
              </div>
            ) : showIdUpload ? (
              // ---- Step 2: ID Upload ----
              <div className="snapshot_container">
                <div className="snapshot_content">
                  <div className="top_section">
                    <div className="text_close_btn_top">
                      <p>
                        Upload your Government Issued ID
                      </p>
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
                      <AiOutlineCheck fontSize="20px" color="#ffff" />
                    </div>
                  </div>
                  <div className="disclaimer_text_final">
                    <IoMdInformationCircle color="#316BDE" />
                    <small>
                      Please upload a clear scan/photo of your government-issued ID. <br />
                      Accepted formats: JPG, PNG, PDF.
                    </small>
                  </div>
                </div>
              </div>
            ) : showDisclaimer ? (
              // --- DISCLAIMER (as before) ---
              <div className="pop_up">
                <div className="modal_content">
                  <div className="text_modal">
                    <h2 style={{ fontFamily: "'Open Sans', sans-serif" }}>
                      Disclaimer
                    </h2>
                    <p style={{ fontFamily: "'Open Sans', sans-serif" }}>
                      This virtual interview application that has been developed
                      is exclusively owned by Deloitte Shared Services India LLP
                      (DSSILLP). ...
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
              // --- INSTRUCTIONS (as before) ---
              showInstructions && (
                <div className="pop_up">
                  <div className="modal_content">
                    <div className="text_modal">
                      <h2>Interview Instructions</h2>
                      <p>
                        Thank you for your interest in <b>{sessionStorage.getItem("jobTitle")}</b> role at
                        Deloitte. ...
                      </p>
                      <p style={{
                        paddingBottom: 0,
                        fontWeight: 600,
                        fontFamily: "'Open Sans', sans-serif",
                        color: "#63666a",
                      }}>
                        Here's what to expect:
                      </p>
                      <ul style={{ fontFamily: "'Open Sans', sans-serif" }}>
                        <li>
                          <b>Disclaimer</b>: Briefly review the information about data privacy and usage.
                        </li>
                        <li>
                          <b>Step 1: Photo (selfie) verification:</b> Take a clear, well-lit selfie. <br /><b>Step 2: Upload your Government ID:</b> Select an image or PDF of your ID from your device.
                        </li>
                        <li>
                          <b>Virtual interview:</b> A virtual recruiter will guide you through pre-recorded questions.
                        </li>
                        <li>
                          <b>Duration:</b> The interview typically takes 10-15 minutes to complete.
                        </li>
                        <li>
                          <b>No live interaction:</b> There will be no live interaction during this initial interview.
                        </li>
                      </ul>
                      <p
                        style={{
                          paddingBottom: 0,
                          fontWeight: 600,
                          fontFamily: "'Open Sans', sans-serif",
                          color: "#63666a",
                        }}>
                        Important tips:
                      </p>
                      {/* ... (additional tips, unchanged) */}
                      <p
                        style={{
                          paddingBottom: 0,
                          marginBottom: 0,
                          fontWeight: 600,
                          fontFamily: "'Open Sans', sans-serif",
                          color: "#63666a",
                        }}>
                        What happens next?
                      </p>
                      <p
                        style={{
                          marginTop: 0,
                          fontFamily: "'Open Sans', sans-serif",
                        }}>
                        Based on your responses, ... <br />
                        By clicking "Start Interview," you acknowledge that you have read and understood these instructions.
                      </p>
                    </div>
                    <div className="disclaimer-footer">
                      <button
                        className="btn col-12 mt-3 mb-3 outline_custom"
                        style={{
                          backgroundColor: "#CCCCCC",
                          width: "200px",
                          color: "#26890D",
                        }}>
                        Cancel
                      </button>
                      <button
                        className="btn col-12 mt-3 mb-3 ml-6"
                        onClick={handleStartInterview}
                        style={{
                          width: "200px",
                          backgroundColor: "#26890d",
                          color: "white",
                        }}>
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
