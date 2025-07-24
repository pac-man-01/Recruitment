import React from "react";

const InterViewClosePopUp = () => {
  const handleClose = () => {
    window.close();
  };

  return (
    <>
      <div className="flex flex-col items-start justify-start min-h-screen bg-gray-100 p-36">
        <h1 className="text-4xl font-bold text-black">Thank You</h1>
        <p className="text-sm font-semibold mt-2">
          Your responses have been submitted. We will get back to you soon.
        </p>
        <p className="text-sm font-semibold ">
          Keep an eye on your inbox for further communications.
        </p>
      </div>
    </>
  );
};

export default InterViewClosePopUp;
