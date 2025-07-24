import logo from "./logo.svg";
import "./App.css";
import { Routes, Route } from "react-router-dom";
import VirtualInterview from "./Components/VirtualInterview/VirtualInterview";
import InterViewClosePopUp from "./Components/InterViewClosePopUp";
import PageNotFound from "./Components/PageNotFound";

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<VirtualInterview />} />
        <Route path="/interviewClosePage" element={<InterViewClosePopUp />} />
        <Route path="/pageNotFound" element={<PageNotFound />} />
      </Routes>
      {/* <VirtualInterview /> */}
    </div>
  );
}

export default App;
