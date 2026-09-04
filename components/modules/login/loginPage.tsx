"use client";

import { GrainGradient } from "@paper-design/shaders-react";
import { useState } from "react";
import type { ReactNode } from "react";

const formFields = [
  { label: "First Name", value: "Harshit", type: "text" },
  { label: "Last Name", value: "Sharma", type: "text" },
];

const termsText = (
  <>
    By creating an account, you agree to our{" "}
    <a
      href="#"
      className="font-medium text-black/45 underline underline-offset-2 dark:text-white/45"
    >
      Terms and Services
    </a>{" "}
    and{" "}
    <a
      href="#"
      className="font-medium text-black/45 underline underline-offset-2 dark:text-white/45"
    >
      Privacy Policy
    </a>
  </>
);

export default function LoginPageComponent() {
  return (
    <section className="min-h-[calc(100vh-100px)] bg-white p-3 text-black">
      <div className="grid min-h-[calc(100vh-100px)] gap-6 lg:grid-cols-[0.94fr_1.06fr]">
        <div className="flex min-h-190 items-center rounded-md border border-black/20 bg-white px-6 py-12 sm:px-10 lg:min-h-0 lg:px-14 lg:py-28 xl:px-20">
          <div className="flex flex-col gap-10 mx-auto w-full max-w-147.5">
            <div>
              <h1 className="text-center whitespace-nowrap text-3xl font-semibold tracking-[-0.04em] sm:text-4xl lg:text-[42px] lg:leading-[1.05] xl:text-[50px]">
                Create an account
              </h1>
            </div>

            <form className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                {formFields.map((field) => (
                  <FieldBox
                    key={field.label}
                    label={field.label}
                    value={field.value}
                  />
                ))}
              </div>

              <FieldBox
                label="Email"
                value="harshitlog@gmail.com"
                type="email"
              />
              <FieldBox
                label="Password"
                value="*************"
                type="password"
              />

              <div className="space-y-4 pt-2 text-sm leading-5 text-black/30 dark:text-white/35 sm:text-[15px]">
                <CheckboxLine>
                  I don't want to receive emails about solaceui feature updates
                </CheckboxLine>
                <CheckboxLine>{termsText}</CheckboxLine>
              </div>

              <button
                type="button"
                className="mt-9 flex h-12 w-full items-center justify-center rounded-[10px] border border-black/40 bg-black text-xl font-medium text-white transition-colors hover:bg-black/85 dark:border-white/40 dark:bg-white dark:text-black dark:hover:bg-white/85"
              >
                Submit
              </button>
            </form>
          </div>
        </div>

        <div className="hidden md:flex relative min-h-180 overflow-hidden rounded-md bg-black p-8 text-white sm:p-12 lg:min-h-0">
          <GrainGradient
            speed={1}
            scale={1}
            rotation={0}
            offsetX={0}
            offsetY={0}
            softness={0.5}
            intensity={0.5}
            noise={0.25}
            shape="corners"
            frame={2854.5}
            colors={["#FFFFFF", "#2d6a4c", "#95f8c2", "#FFFFFF"]}
            colorBack="#00000000"
            className="absolute inset-0 bg-black"
          />

          <div className="relative z-10 flex h-full w-full flex-col justify-between">
            <h2 className="max-w-155 pt-0 text-5xl font-medium tracking-tighter text-white sm:text-6xl lg:pt-16 lg:text-[64px] lg:leading-[0.98] xl:text-[70px]">
              Share the Ride
              <br />
              Save the Planet.
            </h2>
          </div>
        </div>
      </div>
    </section>
  );
}

function FieldBox({
  label,
  value,
  type = "text",
}: {
  label: string;
  value: string;
  type?: string;
}) {
  const [inputValue, setInputValue] = useState(value);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <label className="flex h-14 items-center justify-between gap-4 rounded-[10px] border border-black/25 bg-white px-5 text-lg leading-none dark:border-white/15 dark:bg-white/5 xl:text-xl">
      <input
        type={type}
        value={inputValue}
        aria-label={label}
        onFocus={() => {
          if (!isEditing) {
            setInputValue("");
            setIsEditing(true);
          }
        }}
        onChange={(event) => {
          setInputValue(event.target.value);
          setIsEditing(true);
        }}
        className="min-w-0 flex-1 truncate bg-transparent text-black/30 outline-none placeholder:text-black/30 dark:text-white/35 dark:placeholder:text-white/35"
      />
      {!isEditing && (
        <span className="shrink-0 text-black dark:text-white">{label}</span>
      )}
    </label>
  );
}

function CheckboxLine({ children }: { children: ReactNode }) {
  return (
    <label className="flex items-start gap-3">
      <span className="relative mt-1 size-3.5 shrink-0">
        <input
          type="checkbox"
          className="peer size-full appearance-none rounded-xs border border-black/25 bg-white checked:border-black checked:bg-black dark:border-white/30 dark:bg-white/5 dark:checked:border-white dark:checked:bg-white"
        />
        <svg
          viewBox="0 0 12 12"
          className="pointer-events-none absolute inset-0 hidden size-full p-0.5 text-white peer-checked:block dark:text-black"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 6.2 5 8.1 9 3.9"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span>{children}</span>
    </label>
  );
}
