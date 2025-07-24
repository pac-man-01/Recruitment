import React, { useState, useRef, useContext } from "react";
import Webcam from "react-webcam";
import Swal from "sweetalert2";
import { IoMdCloseCircle } from "react-icons/io";
import { FaCamera, FaUpload } from "react-icons/fa";
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
  const [step, setStep] = useState("instructions"); // instructions, disclaimer, webcam, photo-confirm, id-upload, id-confirm, finished, questions
  const [imageSrc, setImageSrc] = useState(null);
  const [govtIdFile, setGovtIdFile] = useState(null);
  const [govtIdPreview, setGovtIdPreview] = useState(null);
  const [isChecked, setIsChecked] = useState(false);
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);
  const { chat } = useChat();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [showQuestionsPopup, setShowQuestionsPopup] = useState(false);

  const applicationID = sessionStorage.getItem("applicationID");

  // Question fetch logic
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

  // Form for questions
  const handleInputChange = (e, index) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({ ...prevFormData, [name]: value }));
    setErrors((prevErrors) => ({ ...prevErrors, [`radioOption${index}`]: false }));
  };

  // Prescreen
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
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error("Error submitting form", error);
    }
  };

  const handleNavigate = () => navigate("/pageNotFound");
  const handleReset = () => setFormData({
    radioOption1: "",
    radioOption2: "",
    textInput: ""
  });

  // ----- Step transitions -----
  const handleInstructionsNext = () => { setStep("disclaimer"); };
  const handleDisclaimerConfirm = () => { setStep("webcam"); fetchQuestions(); };
  const handleCancelToStart = () => { setStep("instructions"); resetUploadStates(); };

  // Photo capture
  const handleTakeSnapshot = () => {
    setImageSrc(webcamRef.current.getScreenshot());
    setStep("photo-confirm");
  };
  const handleRetakePhoto = () => {
    setImageSrc(null);
    setStep("webcam");
  };
  const handlePhotoConfirm = () => setStep("id-upload");

  // Government ID
  const triggerFileUpload = () => fileInputRef.current.click();
  const handleFileUpload = event => {
    const file = event.target.files[0];
    if (!file) return;
    if (
      file.type.startsWith("image/") ||
      file.type === "application/pdf"
    ) {
      setGovtIdFile(file);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => setGovtIdPreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setGovtIdPreview(null);
      }
    } else {
      Swal.fire({
        icon: "error",
        text: "Please select a valid image or PDF file.",
        confirmButtonColor: "#26890D",
      });
      setGovtIdFile(null);
      setGovtIdPreview(null);
    }
  };
  const handleRemoveGovtId = () => {
    setGovtIdFile(null);
    setGovtIdPreview(null);
  };
  const handleGovtIdConfirm = () => setStep("id-confirm");
  const handleRetakeGovtId = () => {
    setGovtIdFile(null);
    setGovtIdPreview(null);
    setStep("id-upload");
  };

  // File uploads
  const uploadPhotograph = async () => {
    if (!imageSrc) return;
    const obj = { application_id: applicationID, photo: imageSrc };
    const token = localStorage.getItem("access_token");
    const apiUrl = `${BASE_URL}/uploadPhotograph`;
    await axios.post(apiUrl, obj, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  };
  const uploadGovtId = async () => {
    if (!govtIdFile) return;
    const formData = new FormData();
    formData.append("application_id", applicationID);
    formData.append("govt_id", govtIdFile);
    const token = localStorage.getItem("access_token");
    const apiUrl = `${BASE_URL}/uploadGovtId`;
    await axios.post(apiUrl, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });
  };

  // Clear all file-related data when restarting
  const resetUploadStates = () => {
    setImageSrc(null);
    setGovtIdFile(null);
    setGovtIdPreview(null);
  };

  // Final submit after both confirmed
  const handleFinalSubmit = async () => {
    try {
      await uploadPhotograph();
      await uploadGovtId();
      Swal.fire({
        icon: "success",
        text: "Photo and Government ID uploaded successfully.",
        confirmButtonColor: "#26890D",
        confirmButtonText: "Close",
        customClass: { confirmButton: "custom-button-class" },
      }).then((result) => {
        if (result.isConfirmed) setShowQuestionsPopup(true);
      });
      setStep("finished");
    } catch (error) {
      Swal.fire({
        icon: "error",
        text: "Error uploading files. Please try again.",
        confirmButtonColor: "#26890D",
      });
    }
  };

  // Questions logic
  const AfterQuestionSubmit = (e) => {
    e.preventDefault();
    handleFormSubmitOfPrescreen();
    setShowQuestionsPopup(false);
    const request = {
      session: uuidv4(),
      queryInput: {
        text: {
          text: `Hi ${sessionStorage.getItem("firstName")}, How is your day going?`,
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

  // --- UI Render by step ---
  return (
    <div style={{ fontFamily: "Open Sans, sans-serif" }}>
      <div className="row mt-2">
        <div className="col-md-12 ">
          <div className="img_container">
            {/* Instructions */}
            {step === "instructions" && (
              <div className="pop_up">
                <div className="modal_content">
                  <div className="text_modal">
                    <h2>Interview Instructions</h2>
                    <p>Thank you for your interest in <b>{sessionStorage.getItem("jobTitle")}</b> role at Deloitte. We're excited to learn more about you through this virtual interview process.</p>
                    <ul>
                      <li><b>Disclaimer</b>: Briefly review the information about data privacy and usage.</li>
                      <li><b>Photo verification:</b> Take a clear, well-lit selfie and upload your valid photo ID separately. Ensure both your face and ID are fully visible.</li>
                      <li><b>Virtual interview:</b> A virtual recruiter will guide you through questions tailored to this position. Please answer clearly and concisely.</li>
                      <li><b>Duration:</b> The interview typically takes 10-15 minutes to complete.</li>
                      <li><b>No live interaction:</b> There will be no live interaction during this initial interview. Your responses will be recorded for review.</li>
                    </ul>
                    <b>Important tips:</b>
                    <ul>
                      <li>Find a quiet, well-lit location with a stable internet connection.</li>
                      <li>Use a device with a functioning webcam and microphone.</li>
                      <li>Dress professionally and present yourself in a positive manner.</li>
                      <li>Listen carefully to each question and provide thoughtful, complete answers.</li>
                      <li>Speak clearly and avoid background noise or distractions.</li>
                    </ul>
                  </div>
                  <div className="disclaimer-footer">
                    <button className="btn col-12 mt-3 mb-3 outline_custom" onClick={handleCancelToStart}
                      style={{ backgroundColor: "#fff", color: "#26890D", width: "200px" }}>
                      Cancel
                    </button>
                    <button className="btn col-12 mt-3 mb-3 ml-6" onClick={handleInstructionsNext}
                      style={{ width: "200px", backgroundColor: "#26890d", color: "white" }}>
                      Start Interview
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Disclaimer */}
            {step === "disclaimer" && (
              <div className="pop_up">
                <div className="modal_content">
                  <div className="text_modal">
                    <h2>Disclaimer</h2>
                    <p>This virtual interview application that has been developed is exclusively owned by Deloitte... Please read and agree to the terms and conditions.</p>
                  </div>
                  <div className="disclaimer-footer">
                    <label className="custom-checkbox-container">
                      <input type="checkbox" checked={isChecked} className="checkBox" onChange={() => setIsChecked(!isChecked)} />
                      <span className="custom-checkbox"></span>
                      <div className="terms-text">I have read and agreed to the terms and conditions</div>
                    </label>
                    <button
                      disabled={!isChecked}
                      className="btn col-12 mt-3 mb-3"
                      onClick={handleDisclaimerConfirm}
                      style={{
                        backgroundColor: !isChecked ? "#CCCCCC" : "#26890D",
                        border: !isChecked ? "1px solid #CCCCCC" : "1px solid #26890D",
                        color: !isChecked ? "#000" : "#fff",
                        width: "200px"
                      }}>
                      Submit
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Webcam */}
            {step === "webcam" && (
              <div className="webcam_container">
                <div className="text_close_btn">
                  <p>Capture your photograph</p>
                  <IoMdCloseCircle onClick={handleCancelToStart}
                    fontSize="22px" color="gray" cursor="pointer" />
                </div>
                <div className="webcam_container2">
                  <Webcam audio={false} ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    width={515}
                    height={100}
                  />
                  <div className="camera_btn">
                    <FaCamera onClick={handleTakeSnapshot} fontSize="20px" color="black" />
                  </div>
                </div>
                <div className="disclaimer_text">
                  <IoMdInformationCircle color="#316BDE" />
                  <small>
                    Please capture a clear, front-facing portrait photo of yourself.<br />Make sure your face is well-lit and centered in the frame.
                  </small>
                </div>
              </div>
            )}

            {/* Photo Confirm */}
            {step === "photo-confirm" && (
              <div className="snapshot_container">
                <div className="snapshot_content">
                  <div className="top_section">
                    <div className="text_close_btn_top">
                      <p>Confirm your photograph</p>
                      <IoMdCloseCircle onClick={handleRetakePhoto} fontSize="22px" color="gray" cursor="pointer" />
                    </div>
                  </div>
                  <div className="image_section">
                    <img src={imageSrc} alt="Preview" style={{ maxWidth: '400px', maxHeight: '300px', objectFit: 'contain' }} />
                  </div>
                  <div className="btn_submit">
                    <div className="back_btn" onClick={handleRetakePhoto}>
                      <BsArrowCounterclockwise fontSize="20px" color="#000" />
                    </div>
                    <div className="final_btn_submit" onClick={handlePhotoConfirm}>
                      <AiOutlineCheck fontSize="20px" color="#ffff" />
                    </div>
                  </div>
                  <div className="disclaimer_text_final">
                    <IoMdInformationCircle color="#316BDE" />
                    <small>Please ensure your face is clearly visible and well-lit. Click confirm to proceed to ID upload.</small>
                  </div>
                </div>
              </div>
            )}

            {/* Government ID Upload */}
            {step === "id-upload" && (
              <div className="govt_id_container">
                <div className="govt_id_content">
                  <div className="text_close_btn">
                    <p>Upload your Government issued ID card</p>
                    <IoMdCloseCircle onClick={handleCancelToStart} fontSize="22px" color="gray" cursor="pointer" />
                  </div>
                  {!govtIdFile ? (
                    <div className="upload_area" onClick={triggerFileUpload}>
                      <FaUpload fontSize="48px" color="#26890D" />
                      <p>Click to upload your Government ID</p>
                      <small>Supported formats: JPG, PNG, PDF</small>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*,.pdf"
                        style={{ display: 'none' }}
                      />
                    </div>
                  ) : (
                    <div className="preview_area">
                      {govtIdPreview ? (
                        <img src={govtIdPreview} alt="Government ID Preview"
                          style={{ maxWidth: "400px", maxHeight: "300px", objectFit: "contain" }} />
                      ) : (
                        <p style={{ color: "#26890D" }}>PDF file selected: {govtIdFile.name}</p>
                      )}
                      <div className="upload_actions">
                        <button className="btn_secondary" onClick={handleRemoveGovtId}>Remove</button>
                        <button className="btn_primary" onClick={handleGovtIdConfirm}>Confirm</button>
                      </div>
                    </div>
                  )}
                  <div className="disclaimer_text">
                    <IoMdInformationCircle color="#316BDE" />
                    <small>
                      Please upload a clear image or PDF of your valid government-issued photo ID (Driver's License, Passport, National ID, etc.)
                    </small>
                  </div>
                </div>
              </div>
            )}

            {/* ID Confirm */}
            {step === "id-confirm" && (
              <div className="snapshot_container">
                <div className="snapshot_content">
                  <div className="top_section">
                    <div className="text_close_btn_top">
                      <p>Confirm your Government ID</p>
                      <IoMdCloseCircle onClick={handleRetakeGovtId}
                        fontSize="22px" color="gray" cursor="pointer" />
                    </div>
                  </div>
                  <div className="image_section">
                    {govtIdPreview ?
                      <img src={govtIdPreview} alt="Govt ID" style={{ maxWidth: "400px", maxHeight: "300px", objectFit: "contain" }} />
                      :
                      <p style={{ color: "#26890D" }}>PDF file selected: {govtIdFile?.name}</p>
                    }
                  </div>
                  <div className="btn_submit">
                    <div className="back_btn" onClick={handleRetakeGovtId}>
                      <BsArrowCounterclockwise fontSize="20px" color="#000" />
                    </div>
                    <div className="final_btn_submit" onClick={handleFinalSubmit}>
                      <AiOutlineCheck fontSize="20px" color="#ffff" />
                    </div>
                  </div>
                  <div className="disclaimer_text_final">
                    <IoMdInformationCircle color="#316BDE" />
                    <small>
                      Please ensure your Government ID is clear and all details are readable. Click confirm to submit both documents.
                    </small>
                  </div>
                </div>
              </div>
            )}

            {/* Questions Popup */}
            {showQuestionsPopup && (
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
                        {questions && questions.map((item, index) => {
                          if (item.questionType === "confirmation") {
                            return (
                              <div key={index} className="relative mb-4">
                                <label className="block text-[#63666a] font-semibold mb-2 text-sm">
                                  {item.question}
                                </label>
                                <div className="flex gap-4">
                                  {item.values.map((value, idx) => (
                                    <div className="flex items-center mb-2" key={idx}>
                                      <input
                                        className="form-radio h-4 w-4 accent-[#26890D] transition duration-150 ease-in-out"
                                        type="radio"
                                        required
                                        name={`radioOption${index}`}
                                        value={value}
                                        checked={formData[`radioOption${index}`] === value}
                                        onChange={e => handleInputChange(e, index)}
                                      />
                                      <label className="ml-2 block text-[#63666a] text-base">{value}</label>
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
                                  onChange={e => handleInputChange(e, index)}
                                  required
                                >
                                  <option value="">Select an option</option>
                                  {item.values.map((value, idx) => <option key={idx} value={value}>{value}</option>)}
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
                                      className={`py-2 px-4  ${formData[`radioOption${index}`] === value ? "bg-[#26890D] text-white" : "bg-gray-200 text-black"}`}
                                      value={value}
                                      name={`radioOption${index}`}
                                      onClick={e => handleInputChange({ target: { name: `radioOption${index}`, value } }, index)}
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
                                  onChange={e => handleInputChange(e, index)}
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
                      <button type="button" className="px-4 mt-4 py-1 border border-[#26890D] text-[#26890D] text-lg outline_custom" onClick={handleReset}>Reset</button>
                      <button type="submit" className="px-4 mt-4 py-1 bg-[#26890D] text-white text-lg outline_custom">Submit</button>
                    </div>
                  </form>
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
