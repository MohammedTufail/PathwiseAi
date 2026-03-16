"use client";
import React, { useState } from "react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { cn } from "../lib/utils";
import GlowCard from "./ui/glow-card";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  IconArrowLeft,
  IconBrandGoogle,
  IconBrandGithub,
} from "@tabler/icons-react";
import logo from "../assets/PathWiseAILogo.png";

export function SignupFormDemo() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/api/signup", {
        name: `${firstName} ${lastName}`,
        email,
        password,
      });
      alert(response.data.message);
      navigate("/login");
    } catch (error: any) {
      alert(error.response?.data?.message || "Signup failed");
    }
  };

  return (
    <GlowCard className="mx-auto w-full max-w-xl rounded-3xl p-[1px] bg-gradient-to-r from-white/80 via-white to-white/80 shadow-[0_0_10px_rgba(255,255,255,0.9)]">
      <div className="relative rounded-3xl bg-white p-8 md:p-10 bg-gradient-to-br from-black via-gray-900 to-black">
        {/* Logo */}
        <img
          src={logo}
          alt="PathwiseAI Logo"
          className="mx-auto w-auto h-25 mb-6"
        />

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <LabelInputContainer>
              <Label htmlFor="firstname" className="text-base">
                First name
              </Label>
              <Input
                id="firstname"
                placeholder="Mohammed"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-12 text-base"
              />
            </LabelInputContainer>

            <LabelInputContainer>
              <Label htmlFor="lastname" className="text-base">
                Last name
              </Label>
              <Input
                id="lastname"
                placeholder="Tufail"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="h-12 text-base"
              />
            </LabelInputContainer>
          </div>

          <LabelInputContainer>
            <Label htmlFor="email" className="text-base">
              Email Address
            </Label>
            <Input
              id="email"
              placeholder="pathwiseai@gmail.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 text-base"
            />
          </LabelInputContainer>

          <LabelInputContainer>
            <Label htmlFor="password" className="text-base">
              Password
            </Label>
            <Input
              id="password"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 text-base"
            />
          </LabelInputContainer>

          <button
            type="submit"
            className="group/btn relative block h-14 w-full rounded-md bg-green-600 hover:bg-green-500 text-white font-semibold shadow-[0_0_10px_#22c55e] transition"
          >
            Sign up
            <BottomGradient />
          </button>
        </form>

        {/* Divider line */}
        <div className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />

        {/* Social Login */}
        <div className="flex flex-col space-y-4 mt-6">
          <button
            className="group/btn shadow-input relative flex h-14 w-full items-center justify-start space-x-3 rounded-md bg-gray-50 px-6 text-base font-medium text-black dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_#262626]"
            type="button"
          >
            <IconBrandGoogle className="h-5 w-5 text-neutral-800 dark:text-neutral-300" />
            <span className="text-base text-neutral-700 dark:text-neutral-300">
              Continue with Google
            </span>
            <BottomGradient />
          </button>

          <button
            className="group/btn shadow-input relative flex h-14 w-full items-center justify-start space-x-3 rounded-md bg-gray-50 px-6 text-base font-medium text-black dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_#262626]"
            type="button"
          >
            <IconBrandGithub className="h-5 w-5 text-neutral-800 dark:text-neutral-300" />
            <span className="text-base text-neutral-700 dark:text-neutral-300">
              Continue with GitHub
            </span>
            <BottomGradient />
          </button>
        </div>

        {/* Login Link */}
        <p className="text-center text-sm text-neutral-300 mt-4">
          Already have an account?{" "}
          <span
            className="text-green-400 cursor-pointer hover:underline"
            onClick={() => navigate("/login")}
          >
            Log in
          </span>
        </p>
      </div>
    </GlowCard>
  );
}

const BottomGradient = () => (
  <>
    <span className="absolute inset-x-0 -bottom-px h-px w-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0 transition group-hover/btn:opacity-100" />
    <span className="absolute inset-x-10 -bottom-px mx-auto h-px w-1/2 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-0 blur-sm transition group-hover/btn:opacity-100" />
  </>
);

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("flex w-full flex-col space-y-2", className)}>
    {children}
  </div>
);
