import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Overview from "./pages/Overview";
import Signup from "./pages/Signup";
import Login from "./pages/Login"; // <-- import login page
import Home from "./pages/Home";
import LearningPath from "./pages/LearningPath";
import WeekDetails from "./pages/WeekDetails";
import Layout from "./components/Layout" // <-- import loader page

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} /> {/* <-- add this route */}
          <Route path="/home" element={<Home />} />
          <Route path="/learning-path" element={<LearningPath />} />
          <Route path="/week/:id" element={<WeekDetails />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
