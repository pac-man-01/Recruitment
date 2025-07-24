import React from "react";
import Header from "../Header/Header";
import SideMenu from "../SideMenu/SideMenu";
import JobDesc from "../JobDesc/JobDesc";
import Chatbot from "../ChatbotSection/Chatbot";
import WebCamera from "../webCam/webCamera";
import { UI } from "../UI";
import Experience from "../Experience";
import { Canvas } from "@react-three/fiber";
import CryptoJS from "crypto-js";
import { isExpired, decodeToken } from "react-jwt";
import { useState, useEffect } from "react";

const VirtualInterview = () => {
  // const url = window.location.href?.split("?")[1].toString();
  // console.log('url1', url);
  const url =
    "token=quE9AQ/fEJC1f/Qwz38A203EqSw9OAY24bjq1CTjwYaBspStljMYs5+KyzVHE8Uso0FH0QHnzetlKyIM7h4VAYKNp5Jf4b3/xYn6rbgIgiVHrCKpcTzrr916dKnacFBmEMxcKcNXY1BDIE107o2PmZhqdZA13x8dCyzR/fYTy2hgCtRnhjDN0yC7g24dkzz5bWUFJwRrXOlm9UN99G+N9fdtf9XXMLxApaWQi6sJYHMn+IVnRiOOhs/Hld0eUUMytFNoyVXX1dTfmLHpol0C9Enr16R48ArKrOouLKw5+TAbsolTuNKJ5AkJu0aJtJ0bXrPfwbfjlZgDk2t7mmdPUKYt7qLhxYehte9/cTPwlBAHh+4jbx+iIF942pweZkNiMwxkqOyDLaxZ1r97/bETuujgoyr2a9PgjE7dS9MkiT5liC4nRwLQKsNHXgm4AiqyUOXtplJKQD9PJOxhEbHj2bsEiOxas0Ho9qXvVqBsXRzKBpKDsuLdfY48CIz3LvsXT10E5TArW5TCLOkqSdDjhzFoUlmuYL3nbD/QLQDIuQRdMOtZij3cmRJ5IKZi3nYJgIbwTI6cNt7Ss6t2aTj1qltTvvtpkH634diDoCg/ZCWUTllHIfwO3+fffDJnsKHtDQSfGKHWRUotQSmBFqDnsp3o1JLuSNGJY0nfs8JnF9PTBISP1iPOVedkW3bCLYDPL6H1bgiqiZOzufHHE2w5/wwGI3Wna7b8lwJ/Lr6t8La0/biSN3F/g7eM+e/smwpkrYnhxvaEkkOyBHjsBuZ752kKNpkcimswALdlGQ4GmeG/yUXmyBba9QE86UyaY+zoYyBq5FmjUrlY+QKS0Z90VybIPNRpJ2xclUDnqfQ6qt8=";

  let decrypt_iv = CryptoJS.enc.Utf8.parse(process.env.REACT_APP_DECRYPT_IV);
  let decrypt_secretKey = CryptoJS.enc.Utf8.parse(
    process.env.REACT_APP_DECRYPT_SECRET_KEY
  );
  const [decryptedTokenValue, setDecryptedTokenValue] = useState("");
  const [isDecrypted, setIsDecrypted] = useState(false);
  const [isMyTokenExpired, setIsTokenExpired] = useState(false);
  var decodedTokenValue;
  if (url.includes("token") === true || url.includes("signature") === true) {
    var token =
      url.slice(url.indexOf("token=") + "token=".length) ||
      url.slice(url.indexOf("signature=") + "signature=".length);
    var Base64CBC = token.slice(0, token.length);
    // console.log("************",url,token);
  } else {
    var urlPath = new URL(url).pathname;
    var token = urlPath.slice(urlPath.indexOf("/") + "/".length);
  }
  const [publicKey, setPublicKey] = useState("");
  useEffect(() => {
    setPublicKey(process.env.REACT_APP_PUBLIC_KEY);
  }, []);

  const decryptToken = (Base64CBC, iv, secretKey) => {
    let decrypted = CryptoJS?.AES?.decrypt(Base64CBC, secretKey, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
    });
    decrypted = decrypted?.toString(CryptoJS.enc.Utf8);
    return decrypted;
  };

  useEffect(() => {
    setDecryptedTokenValue(
      decryptToken(Base64CBC, decrypt_iv, decrypt_secretKey)
    );
    decodedTokenValue = decodeToken(decryptedTokenValue, publicKey);
    setIsTokenExpired(false);
    if (decodedTokenValue && decodedTokenValue.application_id) {
      delete decodedTokenValue.exp;
      sessionStorage.setItem("queryParams", JSON.stringify(decodedTokenValue));
      sessionStorage.setItem("firstName", decodedTokenValue.first_name);
      sessionStorage.setItem("lastName", decodedTokenValue.last_name);
      sessionStorage.setItem("jobTitle", decodedTokenValue.job_title);
      sessionStorage.setItem(
        "candidateDesignation",
        decodedTokenValue.designation
      );
      sessionStorage.setItem("applicationID", decodedTokenValue.application_id);
      setIsDecrypted(true);
    }
  }, [decryptedTokenValue, decodedTokenValue, isDecrypted, isMyTokenExpired]);
  return (
    <>
      <Header />
      {/* <SideMenu /> */}
      {/* <JobDesc /> */}
      {isDecrypted ? (
        !isMyTokenExpired ? (
          <>
            <Chatbot />
            <WebCamera />
          </>
        ) : (
          <div
            style={{
              height: "100vh",
              marginTop: "10vh",
              marginLeft: "auto",
            }}
            className="token-expiry-screen"
          >
            <div
              style={{
                textAlign: "center",
                marginTop: "25vh",
                fontSize: "20px",
                fontWeight: "bolder",
                color: "rgb(233, 78, 45)",
              }}
            >
              Your virtual interview link has expired. Please reach out to admin
              team for support.
            </div>
          </div>
        )
      ) : (
        <></>
      )}
    </>
    // <>
    //   <Header />
    //   {/* <SideMenu /> */}
    //   {/* <JobDesc /> */}

    //   <>
    //     <Chatbot />
    //     <WebCamera />
    //   </>
    // </>
  );
};

export default VirtualInterview;
