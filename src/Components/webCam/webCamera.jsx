import React, { useState, useRef, useContext } from "react";
import backgroundImg from "../../Util/Images/recp.png";
import Webcam from "react-webcam";
import Swal from "sweetalert2";
import { IoMdCloseCircle } from "react-icons/io";
import { FaCamera, FaUpload } from "react-icons/fa";
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
  const [showSideBySide, setShowSideBySide] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [questionsPopup, setQuestionsPopup] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [govtIdFile, setGovtIdFile] = useState(null);
  const [govtIdPreview, setGovtIdPreview] = useState(null);
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);
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

      const response = await axios.post(
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
    setShowSideBySide(true);
    setShowDisclaimer(false);
  };

  const handleStartInterview = () => {
    setShowDisclaimer(true);
    fetchQuestions();
  };

  const handleCloseWebcam = () => {
    setShowWebcam(false);
    setImageSrc(null);
  };

  const handleTakeSnapshot = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImageSrc(imageSrc);
  };

  const handleRetakeSnapshot = () => {
    setImageSrc(null);
  };

  // Government ID file handling
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setGovtIdFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setGovtIdPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBrowseFiles = () => {
    fileInputRef.current.click();
  };

  const handleRemoveGovtId = () => {
    setGovtIdFile(null);
    setGovtIdPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadPhotograph = async () => {
    const applicationID = sessionStorage.getItem("applicationID");

    const obj = {
      application_id: applicationID,
      photo: imageSrc,
    };

    const apiUrl = `${BASE_URL}/uploadPhotograph`;

    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.post(apiUrl, obj, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error uploading photograph:", error);
      throw error;
    }
  };

  const uploadGovtId = async () => {
    const applicationID = sessionStorage.getItem("applicationID");

    const formData = new FormData();
    formData.append('application_id', applicationID);
    formData.append('govt_id', govtIdFile);

    const apiUrl = `${BASE_URL}/uploadGovtId`;

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
      console.error("Error uploading government ID:", error);
      throw error;
    }
  };

  const handleFinalSubmit = async () => {
    if (!imageSrc || !govtIdFile) {
      Swal.fire({
        icon: "warning",
        text: "Please capture your photo and upload your government ID.",
        confirmButtonColor: "#26890D",
        confirmButtonText: "Close",
      });
      return;
    }

    try {
      await uploadPhotograph();
      await uploadGovtId();

      setShowSideBySide(false);
      setShowInstructions(false);

      Swal.fire({
        icon: "success",
        text: "Photo and Government ID submitted successfully.",
        confirmButtonColor: "#26890D",
        confirmButtonText: "Close",
        customClass: {
          confirmButton: "custom-button-class",
        },
      })
        .then((result) => {
          if (result.isConfirmed) {
            setQuestionsPopup(true);
          }
        })
        .catch((error) => {
          console.error("Error occurred:", error);
        });
    } catch (error) {
      Swal.fire({
        icon: "error",
        text: "Error uploading files. Please try again.",
        confirmButtonColor: "#26890D",
        confirmButtonText: "Close",
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
        <div className="col-md-12">
          <div className="img_container">
            {showSideBySide ? (
              // Side-by-side layout with high z-index to override CSS conflicts
              <div style={{
                position: 'fixed !important',
                top: '0 !important',
                left: '0 !important',
                width: '100vw !important',
                height: '100vh !important',
                backgroundColor: '#f8f9fa !important',
                zIndex: '9999 !important',
                padding: '20px',
                boxSizing: 'border-box',
                overflow: 'auto',
                transform: 'none !important'
              }}>
                {/* Close button */}
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  right: '30px',
                  zIndex: '10000'
                }}>
                  <IoMdCloseCircle
                    onClick={() => setShowSideBySide(false)}
                    fontSize="28px"
                    color="#666"
                    cursor="pointer"
                    style={{ backgroundColor: 'white', borderRadius: '50%' }}
                  />
                </div>

                <div style={{
                  maxWidth: '1200px',
                  margin: '0 auto',
                  paddingTop: '60px'
                }}>
                  <h2 style={{
                    textAlign: 'center',
                    marginBottom: '40px',
                    color: '#333',
                    fontSize: '28px',
                    fontWeight: '600'
                  }}>
                    📷 Photo & Government ID Verification
                  </h2>

                  <div style={{
                    display: 'flex',
                    flexDirection: window.innerWidth < 992 ? 'column' : 'row',
                    gap: '40px',
                    justifyContent: 'center',
                    alignItems: 'flex-start'
                  }}>
                    {/* Photo Capture Section */}
                    <div style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '15px',
                      padding: '30px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                      width: window.innerWidth < 992 ? '100%' : '500px',
                      textAlign: 'center',
                      border: '2px solid #e9ecef'
                    }}>
                      <h3 style={{
                        marginBottom: '25px',
                        color: '#2c5aa0',
                        fontSize: '22px',
                        fontWeight: '600'
                      }}>
                        📸 Capture Your Photo
                      </h3>

                      <div style={{
                        border: imageSrc ? '2px solid #26890D' : '2px dashed #26890D',
                        borderRadius: '12px',
                        padding: '25px',
                        marginBottom: '25px',
                        backgroundColor: imageSrc ? '#f8fff9' : '#f8fff9',
                        minHeight: '350px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}>
                        {imageSrc ? (
                          <div style={{ width: '100%' }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginBottom: '15px',
                              color: '#26890D',
                              fontSize: '16px',
                              fontWeight: '600'
                            }}>
                              ✅ Photo Captured Successfully
                            </div>
                            <img
                              src={imageSrc}
                              alt="Captured Photo"
                              style={{
                                width: '100%',
                                maxWidth: '300px',
                                height: 'auto',
                                borderRadius: '10px',
                                border: '2px solid #26890D',
                                marginBottom: '20px'
                              }}
                            />
                            <button
                              onClick={handleRetakeSnapshot}
                              style={{
                                backgroundColor: '#6c757d',
                                color: 'white',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '16px',
                                fontWeight: '500'
                              }}
                            >
                              🔄 Retake Photo
                            </button>
                          </div>
                        ) : (
                          <div style={{ width: '100%' }}>
                            <div style={{
                              marginBottom: '20px',
                              color: '#666',
                              fontSize: '16px'
                            }}>
                              Position yourself in the camera view
                            </div>
                            <Webcam
                              audio={false}
                              ref={webcamRef}
                              screenshotFormat="image/jpeg"
                              width="100%"
                              height={280}
                              style={{
                                borderRadius: '10px',
                                marginBottom: '20px',
                                maxWidth: '400px',
                                border: '1px solid #ddd'
                              }}
                            />
                            <button
                              onClick={handleTakeSnapshot}
                              style={{
                                backgroundColor: '#26890D',
                                color: 'white',
                                border: 'none',
                                padding: '15px 30px',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                fontSize: '18px',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                margin: '0 auto',
                                boxShadow: '0 4px 12px rgba(38,137,13,0.3)'
                              }}
                            >
                              <FaCamera /> Capture Photo
                            </button>
                          </div>
                        )}
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        color: '#316BDE',
                        fontSize: '14px',
                        backgroundColor: '#e3f2fd',
                        padding: '10px',
                        borderRadius: '8px'
                      }}>
                        <IoMdInformationCircle />
                        <small>Please capture a clear, front-facing portrait photo.</small>
                      </div>
                    </div>

                    {/* Government ID Upload Section */}
                    <div style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '15px',
                      padding: '30px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                      width: window.innerWidth < 992 ? '100%' : '500px',
                      textAlign: 'center',
                      border: '2px solid #e9ecef'
                    }}>
                      <h3 style={{
                        marginBottom: '25px',
                        color: '#2c5aa0',
                        fontSize: '22px',
                        fontWeight: '600'
                      }}>
                        🆔 Upload Government ID
                      </h3>

                      <div style={{
                        border: govtIdFile ? '2px solid #007bff' : '2px dashed #007bff',
                        borderRadius: '12px',
                        padding: '25px',
                        marginBottom: '25px',
                        backgroundColor: govtIdFile ? '#f8f9ff' : '#f8f9ff',
                        minHeight: '350px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}>
                        {govtIdPreview ? (
                          <div style={{ width: '100%' }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginBottom: '15px',
                              color: '#007bff',
                              fontSize: '16px',
                              fontWeight: '600'
                            }}>
                              ✅ Government ID Uploaded Successfully
                            </div>
                            <img
                              src={govtIdPreview}
                              alt="Government ID"
                              style={{
                                width: '100%',
                                maxWidth: '300px',
                                height: 'auto',
                                borderRadius: '10px',
                                border: '2px solid #007bff',
                                marginBottom: '20px'
                              }}
                            />
                            <div style={{
                              display: 'flex',
                              gap: '12px',
                              justifyContent: 'center',
                              flexWrap: 'wrap'
                            }}>
                              <button
                                onClick={handleRemoveGovtId}
                                style={{
                                  backgroundColor: '#dc3545',
                                  color: 'white',
                                  border: 'none',
                                  padding: '10px 20px',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  fontSize: '16px'
                                }}
                              >
                                🗑️ Remove
                              </button>
                              <button
                                onClick={handleBrowseFiles}
                                style={{
                                  backgroundColor: '#6c757d',
                                  color: 'white',
                                  border: 'none',
                                  padding: '10px 20px',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  fontSize: '16px'
                                }}
                              >
                                📁 Choose Different
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={handleBrowseFiles}
                            style={{
                              cursor: 'pointer',
                              textAlign: 'center',
                              width: '100%',
                              padding: '50px 20px'
                            }}
                          >
                            <FaUpload
                              style={{
                                fontSize: '60px',
                                color: '#007bff',
                                marginBottom: '20px'
                              }}
                            />
                            <p style={{
                              margin: '15px 0',
                              color: '#007bff',
                              fontSize: '18px',
                              fontWeight: '600'
                            }}>
                              Click to browse and select your Government ID
                            </p>
                            <small style={{ 
                              color: '#6c757d',
                              fontSize: '14px'
                            }}>
                              Supported formats: JPG, PNG, PDF (Max 5MB)
                            </small>
                          </div>
                        )}
                      </div>

                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*,.pdf"
                        style={{ display: 'none' }}
                      />

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        color: '#316BDE',
                        fontSize: '14px',
                        backgroundColor: '#e3f2fd',
                        padding: '10px',
                        borderRadius: '8px'
                      }}>
                        <IoMdInformationCircle />
                        <small>Upload a valid government-issued photo ID.</small>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div style={{
                    textAlign: 'center',
                    marginTop: '50px',
                    paddingBottom: '40px'
                  }}>
                    <button
                      onClick={handleFinalSubmit}
                      disabled={!imageSrc || !govtIdFile}
                      style={{
                        backgroundColor: (!imageSrc || !govtIdFile) ? "#ccc" : "#26890D",
                        color: "#fff",
                        fontWeight: '700',
                        border: "none",
                        borderRadius: '12px',
                        fontSize: '20px',
                        padding: "18px 60px",
                        cursor: (!imageSrc || !govtIdFile) ? "not-allowed" : "pointer",
                        minWidth: '300px',
                        boxShadow: (!imageSrc || !govtIdFile) ? 'none' : '0 6px 20px rgba(38,137,13,0.4)',
                        transform: (!imageSrc || !govtIdFile) ? 'none' : 'translateY(-2px)',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {(!imageSrc || !govtIdFile) ? "Complete Both Steps to Continue" : "✅ Submit Both Documents"}
                    </button>

                    {(!imageSrc || !govtIdFile) && (
                      <p style={{
                        marginTop: '20px',
                        fontSize: '16px',
                        color: '#666',
                        fontStyle: 'italic'
                      }}>
                        Please {!imageSrc && !govtIdFile ? 'capture your photo and upload your government ID' :
                               !imageSrc ? 'capture your photo to continue' : 'upload your government ID to continue'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : showSnapshot ? (
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
                      onClick={handleFinalSubmit}
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
            ) : questionsPopup ? (
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
                      proof) ("Information") submitted by you for evaluation of
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
                      USERS ON AN "AS IS" BASIS AND DSSILLP EXPRESSLY DISCLAIMS
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
                          selfie for identity verification.
                        </li>
                        <li>
                          <b>ID upload:</b> Upload a clear image of your valid photo ID.
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
                          backgroundColor: "#fff",
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
