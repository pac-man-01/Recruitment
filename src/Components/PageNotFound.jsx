import React from "react";

const PageNotFound = () => {
  return (
    <>
      <div className="flex flex-col items-start justify-start min-h-screen bg-gray-100 p-36">
        <h1 className="text-4xl font-bold text-black">Interview Closed</h1>
        <p className="text-base text-black mt-2">
          Your interview session has been closed upon your request. You can
          attempt it again using the link received in the original invitation.
        </p>
        <p className="text-base text-black ">
          Kindly ensure to finish the interview within 48 hours of receiving the
          invitation.
        </p>
      </div>
    </>
  );
};

export default PageNotFound;
