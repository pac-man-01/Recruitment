import React from "react";
// import { NavLink } from 'react-router-dom'
import logoDl from "../../Util/logo.svg";
const Header = () => {
  return (
    <>
      <header
        className={`text-white sm:h-10 sm:pt-2 bg-black transition-colors ease-in-out delay-20 fixed top-0 z-[992] px-3 py-1 w-full min-h-12 flex items-center`}
      >
        <div className="flex w-full items-center leading-5 sm:flex sm:justify-between sm:items-center">
          <div className="flex mr-auto">
            <div to="/">
              <img src={logoDl} alt="" className="max-h-4  mt-0.5" />
            </div>
            <div className="text-[#53565a] mx-3">|</div>
          <div className="appName text-sm font-semibold text-white">
          Virtual Screening - {sessionStorage.getItem('jobTitle')}{' '}{sessionStorage.getItem('candidateDesignation')}
          </div>
            
          </div>
          <div className="flex items-center ml-auto gap-2 cursor-pointer p-2">
            <span className="text-white ">
              Welcome, {sessionStorage.getItem("firstName")}
            </span>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
