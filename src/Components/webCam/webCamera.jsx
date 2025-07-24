import React, { useRef, useState } from "react";
import Webcam from "react-webcam";
import Swal from "sweetalert2";
import { FaCamera, FaUpload } from "react-icons/fa";
import { IoMdInformationCircle, IoMdCloseCircle } from "react-icons/io";
import axios from "axios";

// ====== Replace this with your API base URL ======
const BASE_URL = "https://example.com/api"; // <- <<< Set your API base here

const WebCamera = () => {
  const [photoSrc, setPhotoSrc] = useState(null);
  const [idFile, setIdFile] = useState(null);
  const [idPreview, setIdPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);

  // 1. Take photo from camera
  const handleCapture = () => {
    if (webcamRef.current) {
      setPhotoSrc(webcamRef.current.getScreenshot());
    }
  };

  // 2a. Remove captured photo
  const handleRemovePhoto = () => setPhotoSrc(null);

  // 2b. Select and preview ID file
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIdFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setIdPreview(ev.target.result);
    if (file.type.startsWith("image/")) reader.readAsDataURL(file);
    else setIdPreview(null);
  };

  // 2c. Remove ID file
  const handleRemoveId = () => {
    setIdFile(null);
    setIdPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 3. Upload both files
  const handleSubmit = async () => {
    if (!photoSrc || !idFile) {
      Swal.fire("Error", "Capture your photo and upload your government ID.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const applicationID = sessionStorage.getItem("applicationID") || "test-app-id";
      // Photo upload
      const photoRes = await axios.post(`${BASE_URL}/uploadPhotograph`, {
        application_id: applicationID,
        photo: photoSrc,
      }, {headers: {"Content-Type": "application/json"}});
      // ID upload
      const fd = new FormData();
      fd.append("application_id", applicationID);
      fd.append("govt_id", idFile);
      await axios.post(`${BASE_URL}/uploadGovtId`, fd, {
        headers: {"Content-Type": "multipart/form-data"},
      });
      Swal.fire("Success", "Photo & Government ID uploaded successfully!", "success");
      setPhotoSrc(null);
      setIdFile(null);
      setIdPreview(null);
    } catch (e) {
      Swal.fire("Upload Failed", "Please try again.", "error");
    }
    setSubmitting(false);
  };

  // ======= UI starts here =======
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f8fd",
        padding: 0,
        margin: 0,
        fontFamily: "Open Sans, sans-serif",
      }}
    >
      <div style={{
        maxWidth: 1100,
        margin: "40px auto",
        background: "#fff",
        borderRadius: 20,
        boxShadow: "0 8px 32px rgba(85,125,160,0.08)",
        padding: "35px 40px",
      }}>
        <h2 style={{
          textAlign: "center", letterSpacing: 0.5, color: "#223356",
          marginBottom: 32, fontWeight: 700 }}>Photo & Government ID Upload</h2>
        
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 32, justifyContent: "center",
          alignItems: "flex-start",
        }}>
          {/* Left: Webcam/photo */}
          <div style={{
            flex: 1, minWidth: 300, maxWidth: 420, background: "#fafcff",
            borderRadius: 12, padding: 30, boxShadow: "0 2px 20px 0 #e6f0ff",
            display: "flex", flexDirection: "column", alignItems: "center"
          }}>
            <div style={{fontWeight: 600, fontSize: 18, color: "#318214", marginBottom: 18}}>
              1. Capture Your Photo
            </div>
            {photoSrc ? (
              <>
                <img src={photoSrc} alt="Your Portrait"
                  style={{
                    width: "100%", maxWidth: 320, borderRadius: 8,
                    marginBottom: 16, border: "2px solid #26890D",
                  }}/>
                <button
                  onClick={handleRemovePhoto}
                  style={{
                    marginBottom: 8,
                    background: "#c2c2c2", color: "#fff", border: "none",
                    borderRadius: 6, padding: "8px 23px", fontWeight: 600,
                    cursor: "pointer"
                  }}>Remove</button>
              </>
            ) : (
              <div style={{ marginBottom: 18 }}>
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  width={320}
                  height={220}
                  style={{
                    borderRadius: 12, border: "2px solid #bfe8c8",
                    marginBottom: 10,
                  }}
                />
                <br />
                <button
                  onClick={handleCapture}
                  style={{
                    background: "#26890D", color: "#fff", border: "none",
                    padding: "12px 30px", fontWeight: 600, borderRadius: 6,
                    fontSize: 16, cursor: "pointer",
                    boxShadow: "0 2px 12px rgba(38,137,13,0.1)"
                  }}><FaCamera style={{marginRight: 8}}/>Capture Photo</button>
              </div>
            )}
            <div style={{
              display: "flex", alignItems: "center", color: "#4675e0",
              background: "#e7f4fa", borderRadius: 7, marginTop: 9,
              fontSize: 14, padding: "7px 10px"
            }}>
              <IoMdInformationCircle style={{marginRight: 6}}/> Please capture a clear, front-facing portrait photo.
            </div>
          </div>
          
          {/* Right: Gov. ID upload */}
          <div style={{
            flex: 1, minWidth: 300, maxWidth: 420, background: "#fafcff",
            borderRadius: 12, padding: 30, boxShadow: "0 2px 20px 0 #e6f0ff",
            display: "flex", flexDirection: "column", alignItems: "center"
          }}>
            <div style={{
              fontWeight: 600, fontSize: 18, color: "#2953d2", marginBottom: 18
            }}>2. Upload Government ID</div>
            {idPreview ? (
              <>
                {/* Only preview if image file is chosen */}
                {idFile.type.startsWith("image/") ? (
                  <img src={idPreview} alt="ID Preview"
                       style={{
                         width: "100%", maxWidth: 320, borderRadius: 8,
                         marginBottom: 16, border: "2px solid #2953d2"
                       }}/>
                ) : (
                  <div style={{
                    width: 180, height: 200, background: "#e7f1fd",
                    border: "1.5px dashed #2953d2", borderRadius: 9,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#2953d2", fontWeight: 600, fontSize: 16, marginBottom: 18
                  }}>
                    <FaUpload size={44} style={{ marginRight: 8 }}/>PDF Uploaded
                  </div>
                )}
                <div style={{ display: "flex", gap: 12 }}>
                  <button onClick={handleRemoveId}
                          style={{
                            background: "#dc3545", color: "#fff", border: "none",
                            padding: "8px 18px", borderRadius: 6, cursor: "pointer", fontWeight: 600,
                          }}>Remove</button>
                  <button onClick={() => fileInputRef.current.click()}
                          style={{
                            background: "#495057", color: "#fff", border: "none",
                            padding: "8px 18px", borderRadius: 6, cursor: "pointer", fontWeight: 600
                          }}>Choose Different</button>
                </div>
              </>
            ) : (
              <div
                onClick={() => fileInputRef.current.click()}
                style={{
                  border: "2px dashed #2953d2", borderRadius: 9, background: "#e7f1fd",
                  width: "100%", maxWidth: 330, textAlign: "center",
                  minHeight: 170, cursor: "pointer", padding: "30px 10px 12px"
                }}
              >
                <FaUpload size={38} color="#2953d2"/>
                <p style={{ margin: "18px 0 7px", color: "#2953d2", fontSize: 16 }}>
                  Click to upload your ID (JPG, PNG, PDF)
                </p>
                <small style={{fontSize:12, color:"#444"}}>Maximum 5MB file</small>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              style={{ display:"none" }}
              onChange={handleFileSelect}
            />
            <div style={{
              display: "flex", alignItems: "center", color: "#2953d2",
              background: "#e5ecfa", borderRadius: 7, marginTop: 13,
              fontSize: 14, padding: "7px 10px"
            }}>
              <IoMdInformationCircle style={{marginRight: 6}}/>
              Upload a valid government-issued photo ID (front side).
            </div>
          </div>
        </div>
        
        {/* Submit Button */}
        <div style={{textAlign:"center", marginTop:40}}>
          <button
            disabled={!photoSrc || !idFile || submitting}
            onClick={handleSubmit}
            style={{
              background: (!photoSrc || !idFile || submitting) ? "#adb5bd" : "#26890D",
              color: "#fff", border: "none", fontWeight: 700,
              fontSize: 18, borderRadius: 7, minWidth: 210, padding: "15px 55px",
              cursor: (!photoSrc || !idFile || submitting) ? "not-allowed" : "pointer",
              boxShadow: (!photoSrc || !idFile || submitting) ? "none" : "0 4px 22px #c4fad4"
            }}
          >
            {submitting ? "Uploading..." : "Submit"}
          </button>
          {!(photoSrc && idFile) && (
            <div style={{marginTop:16, color:"#666", fontSize:14}}>
              Please {photoSrc ? "" : "capture your photo"}{!(photoSrc && idFile) && !photoSrc && !idFile ? " and" : ""}{idFile ? "" : " upload your government ID"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebCamera;
