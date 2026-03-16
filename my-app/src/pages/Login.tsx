import { LoginFormDemo } from "../components/LoginFormDemo";
import { IconArrowLeft } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-black via-gray-900 via-gray-950 to-green-950">
      {/* Back button fixed top-left */}
      <button
        className="fixed top-4 left-4 z-50 text-white hover:text-green-400"
        onClick={() => navigate(-1)}
      >
        <IconArrowLeft className="h-6 w-6" />
      </button>

      <LoginFormDemo />
    </div>
  );
}
