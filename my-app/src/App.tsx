import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import LearningPath from "./pages/LearningPath";
import WeekDetails from "./pages/WeekDetails";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/learning-path" element={<LearningPath />} />
        <Route path="/week/:id" element={<WeekDetails />} />
      </Routes>
    </Router>
  );
}

export default App;




