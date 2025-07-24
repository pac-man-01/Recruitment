import React, { useState, useRef, useContext } from "react";
import Webcam from "react-webcam";
import Swal from "sweetalert2";
import { IoMdCloseCircle } from "react-icons/io";
import { FaCamera } from "react-icons/fa";
import { IoMdInformationCircle } from "react-icons/io";
import { AiOutlineCheck } from "react-icons/ai";
import { BsArrowCounterclockwise } from "react-icons/bs";
import "../webCam/webCamera.css";
import { ChatContext, useChat } from "../../hooks/useChat";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../../Util/configApi";

const WebCamera = () => {
  // Step management
  const [step, setStep] = useState("instructions"); // instructions | disclaimer | selfie | selfiePreview | idUpload | questions
  // Selfie
  const [imageSrc, setImageSrc] = useState(null);
  const webcamRef = useRef(null);
  // ID file
  const [idFile, setIdFile] = useState(null);
  const [idFilePreview, setIdFilePreview] = useState(null);

  // Checkbox for disclaimer
  const [isChecked, setIsChecked] = useState(false);

  // Questions
  const { chat } = useChat();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state for prescreen
  const [formData, setFormData] = useState({ radioOption1: "", radioOption2: "", textInput: "" });
  const [errors, setErrors] = useState({});

  // Other flags
  const [questionsPopup, setQuestionsPopup] = useState(false);

  // Helper to go to step
  const goto = (s) => setStep(s);

  // ========================= Steps & Actions ===================
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/getPreInterviewQuestions`);
      setQuestions(response.data.data);
      setLoading(false);
      if (response.data.access_token)
        localStorage.setItem("access_token", response.data.access_token);
    } catch (error) {
      setLoading(false);
    }
  };

  // =========================== Selfie ========================
  const handleTakeSnapshot = () => {
    if (webcamRef.current) {
      const src = webcamRef.current.getScreenshot();
      setImageSrc(src);
      goto("selfiePreview");
    }
  };
  const handleRetakeSnapshot = () => {
    setImageSrc(null);
    goto("selfie");
  };

  // ========================= ID Upload ========================
  const handleIdFileChange = (e) => {
    const file = e.target.files[0];
    setIdFile(file);
    setIdFilePreview(file ? URL.createObjectURL(file) : null);
  };
  const handleRemoveIDFile = () => {
    setIdFile(null);
    setIdFilePreview(null);
  };

  // ======================== API UPLOAD ========================
  const uploadPhotographAndID = async () => {
    const application_id = sessionStorage.getItem("applicationID");
    // Backend: photo - base64 string, govt_id - file
    const formData = new FormData();
    formData.append("application_id", application_id);
    // Remove "data:image/jpeg;base64," for backend (if required)
    formData.append("photo", imageSrc.replace(/^data:image\/[a-z]+;base64,/, ""));
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
      throw error?.response?.data?.message || "Upload failed";
    }
  };

  const handleFinalSubmit = async () => {
    if (!imageSrc) {
      Swal.fire({ icon: "warning", text: "Please take a selfie first." });
      goto("selfie");
      return;
    }
    if (!idFile) {
      Swal.fire({ icon: "warning", text: "Please upload your Government ID." });
      goto("idUpload");
      return;
    }
    try {
      await uploadPhotographAndID();
      setStep("done");
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
    } catch (errText) {
      Swal.fire({
        icon: "error",
        text: errText || "Upload failed. Please try again.",
      });
    }
  };

  // ====================== PRESCREEN FORM ======================
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
      const applicationID = sessionStorage.getItem("applicationID");
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
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (error) {
      // console.error("Error submitting form", error);
    }
  };

  // ==================== FINAL PRESCREEN SUBMIT =================
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

  // Handlers for steps
  const handleCheckboxChange = () => setIsChecked((x) => !x);
  const handleStartInterview = () => {
    fetchQuestions();
    goto("disclaimer");
  };
  const handleInstructionsStart = () => goto("disclaimer");
  const handleDisclaimerConfirm = () => goto("selfie");
  const handleGoToIDUpload = () => goto("idUpload");

  // ================== UI FLOW ==========================
  return (
    <div style={{ fontFamily: "Open Sans, sans-serif" }}>
      <div className="row mt-2">
        <div className="col-md-12 ">
          <div className="img_container">

            {/* 1. Prescreen Questions */}
            {questionsPopup && (
              <div className="pop_up_last">
                <div className="container mx-auto">
                  <form onSubmit={AfterQuestionSubmit}>
                    <div className="flex justify-center ">
                      <h3 className="text-center text-2xl font-semibold text-gray-800 flex-grow">
                        Prescreening Interview Questions & Answers
                      </h3>
                      <IoMdCloseCircle
                        onClick={() => navigate("/pageNotFound")}
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
                                    value={formData[`dropdownOption${index}`] || ""}
                                    onChange={handleInputChange}
                                    required
                                  >
                                    <option value="">Select an option</option>
                                    {item.values.map((value, idx) => (
                                      <option key={idx} value={value}>{value}</option>
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
                        onClick={() => setFormData(formData)}
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
            )}

            {/* 2. Instructions */}
            {step === "instructions" && (
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
                        <b>Disclaimer</b>: Briefly review the information
                        about data privacy and usage.
                      </li>
                      <li>
                        <b>Photo verification:</b> Take a clear, well-lit selfie. <br />
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
                        Find a quiet, well-lit location with a stable internet connection.
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
                        Speak clearly and avoid background noise or distractions.
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
                      Based on your responses, we will be in touch within 5 business days to inform you about the next steps in the interview process.
                      <br />
                      Thank you for your time and interest in Deloitte! <br />
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
                      }}
                      onClick={() => navigate('/')}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn col-12 mt-3 mb-3 ml-6"
                      onClick={handleInstructionsStart}
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
            )}

            {/* 3. Disclaimer */}
            {step === "disclaimer" && (
              <div className="pop_up">
                <div className="modal_content">
                  <div className="text_modal">
                    <h2 style={{ fontFamily: "'Open Sans', sans-serif" }}>
                      Disclaimer
                    </h2>
                    <p style={{ fontFamily: "'Open Sans', sans-serif" }}>
                      {/* --- Your disclaimer text as before --- */}
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
                      onClick={handleDisclaimerConfirm}
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
            )}

            {/* 4. Capture Selfie */}
            {step === "selfie" && (
              <div className="webcam_container">
                <div className="text_close_btn">
                  <p>
                    Capture your photograph (Selfie).<br />
                    <span style={{ fontSize: 14 }}>You will upload your Government ID in the next step.</span>
                  </p>
                  <IoMdCloseCircle
                    onClick={() => goto("instructions")}
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
                      fontSize="24px"
                      color="black"
                      style={{ cursor: "pointer" }}
                    />
                  </div>
                </div>
                <div className="disclaimer_text">
                  <IoMdInformationCircle color="#316BDE" />
                  <small>
                    Please capture a clear, front-facing portrait photo of yourself.<br />
                    Make sure your face is well-lit and centered in the frame.
                  </small>
                </div>
              </div>
            )}

            {/* 5. Preview Selfie */}
            {step === "selfiePreview" && (
              <div className="snapshot_container">
                <div className="snapshot_content">
                  <div className="top_section">
                    <div className="text_close_btn_top">
                      <p>Preview your Selfie</p>
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
                  <div style={{
                    display: 'flex',
                    gap: '16px',
                    margin: '24px 0 0 0',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <button type="button" className="btn_submit back_btn" style={{margin: 0}} onClick={handleRetakeSnapshot}>
                      <BsArrowCounterclockwise fontSize="22px" color="#000" />
                    </button>
                    <button type="button" className="btn_submit final_btn_submit" style={{margin: 0, backgroundColor: "#26890d"}} onClick={handleGoToIDUpload}>
                      <AiOutlineCheck fontSize="22px" color="#fff" />
                    </button>
                  </div>
                  <div className="disclaimer_text_final" style={{marginTop: 20}}>
                    <IoMdInformationCircle color="#316BDE" />
                    <small>
                      Please capture a clear, front-facing portrait photo of yourself.<br />
                      Make sure your face is well-lit and centered in the frame.
                    </small>
                  </div>
                </div>
              </div>
            )}

            {/* 6. Government ID Upload */}
            {step === "idUpload" && (
              <div className="snapshot_container">
                <div className="snapshot_content">
                  <div className="top_section">
                    <div className="text_close_btn_top">
                      <p>Upload your Government Issued ID Card</p>
                      <IoMdCloseCircle
                        onClick={() => goto("selfiePreview")}
                        fontSize="22px"
                        color="gray"
                        cursor="pointer"
                      />
                    </div>
                  </div>
                  <div className="image_section" style={{minHeight: 60}}>
                    {idFilePreview ? (
                      <div style={{textAlign: 'center'}}>
                        <img src={idFilePreview} alt="ID Preview" style={{maxHeight: 180, borderRadius: 4}} />
                        <br />
                        <button
                          className="px-3 py-1 bg-red-500 text-white mt-2"
                          onClick={handleRemoveIDFile}
                          type="button"
                          style={{fontSize: '13px', marginTop: 8}}
                        >Remove</button>
                      </div>
                    ) : (
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleIdFileChange}
                        className="my-2"
                        style={{padding: 6, display: "block", margin: "0 auto"}}
                      />
                    )}
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '16px',
                    margin: '24px 0 0 0',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <button type="button" className="btn_submit back_btn" style={{margin: 0}} onClick={() => goto("selfiePreview")}>
                      <BsArrowCounterclockwise fontSize="22px" color="#000" />
                    </button>
                    <button type="button" className="btn_submit final_btn_submit" style={{margin: 0, backgroundColor: "#26890d"}} onClick={handleFinalSubmit}>
                      <AiOutlineCheck fontSize="22px" color="#fff" />
                    </button>
                  </div>
                  <div className="disclaimer_text_final" style={{marginTop: 20}}>
                    <IoMdInformationCircle color="#316BDE" />
                    <small>
                      Please upload a clear scan/photo of your government-issued ID.<br />
                      Accepted formats: JPG, PNG, PDF.
                    </small>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default WebCamera;
