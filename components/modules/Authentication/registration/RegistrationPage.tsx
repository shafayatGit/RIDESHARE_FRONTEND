"use client";

import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { GrainGradient } from "@paper-design/shaders-react";
import { useForm } from "@tanstack/react-form";
import { useRegistration } from "@/hooks/use-registration";
import { registerSchema } from "@/zod/registration";
import type { RegisterPayload } from "@/types/registration";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

function mapErrorMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("email") && lower.includes("already"))
    return "An account with this email already exists. Please try a different email.";
  if (lower.includes("password"))
    return "Please check your password requirements.";
  if (lower.includes("network") || lower.includes("fetch"))
    return "Network error. Please check your connection and try again.";
  return message || "Registration failed. Please try again.";
}

export default function RegistrationPageComponent() {
  const router = useRouter();
  const { mutateAsync, isPending } = useRegistration();

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      gender: "",
      phoneNumber: "",
      password: "",
    },
    validators: {
      onChange: registerSchema,
    },
    onSubmit: async ({ value }) => {
      setServerError(null);
      try {
        const payload: RegisterPayload = {
          ...value,
          gender: value.gender as "MALE" | "FEMALE",
        };
        const result = await mutateAsync(payload);

        if (!result.success) {
          setServerError(
            mapErrorMessage(result.message || "Registration failed."),
          );
          return;
        }

        if (result.redirectPath) {
          router.push(result.redirectPath);
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Unexpected error occurred";
        setServerError(mapErrorMessage(message));
      }
    },
  });

  return (
    <section className="min-h-[calc(100vh-100px)] bg-white p-3 text-black">
      <div className="grid min-h-[calc(100vh-100px)] gap-6 lg:grid-cols-[0.94fr_1.06fr]">
        <div className="flex min-h-190 items-center rounded-md border border-black/20 bg-white px-3 py-12 sm:px-10 lg:min-h-0 lg:px-14 lg:py-28 xl:px-20">
          <div className="mx-auto flex w-full max-w-147.5 flex-col gap-10">
            <div>
              <h1 className="whitespace-nowrap text-center text-2xl font-semibold tracking-[-0.04em] sm:text-4xl lg:text-[42px] lg:leading-[1.05] xl:text-[50px]">
                Create an account
              </h1>
            </div>

            <CardContent className="sm:px-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit();
                }}
                className="space-y-4"
                noValidate
              >
                <form.Field name="name">
                  {(field) => {
                    const hasError =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={hasError}>
                        <FieldLabel htmlFor={field.name}>Full Name</FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="text"
                          value={field.state.value}
                          placeholder="eg. Shafayat Hossain"
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={hasError}
                        />
                        {hasError && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                </form.Field>

                <form.Field name="email">
                  {(field) => {
                    const hasError =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={hasError}>
                        <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="email"
                          value={field.state.value}
                          placeholder="eg. shafayathossain.drmc@gmail.com"
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={hasError}
                        />
                        {hasError && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                </form.Field>

                <form.Field name="gender">
                  {(field) => {
                    const hasError =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={hasError}>
                        <FieldLabel>Gender</FieldLabel>
                        <Select
                          value={field.state.value}
                          onValueChange={(val) =>
                            field.handleChange(val as "MALE" | "FEMALE")
                          }
                        >
                          <SelectTrigger
                            className="w-full"
                            aria-invalid={hasError}
                          >
                            <SelectValue placeholder="Select your gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MALE">Male</SelectItem>
                            <SelectItem value="FEMALE">Female</SelectItem>
                          </SelectContent>
                        </Select>
                        {hasError && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                </form.Field>

                <form.Field name="phoneNumber">
                  {(field) => {
                    const hasError =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={hasError}>
                        <FieldLabel htmlFor={field.name}>
                          Phone Number
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="tel"
                          value={field.state.value}
                          placeholder="e.g. +8801712345678"
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={hasError}
                        />
                        {hasError && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                </form.Field>

                <form.Field name="password">
                  {(field) => {
                    const hasError =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={hasError}>
                        <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                        <div className="relative">
                          <Input
                            id={field.name}
                            name={field.name}
                            type={showPassword ? "text" : "password"}
                            value={field.state.value}
                            placeholder="Choose a password"
                            className="pr-9"
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            aria-invalid={hasError}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-9 w-9"
                            onClick={() => setShowPassword((v) => !v)}
                            aria-label={
                              showPassword ? "Hide password" : "Show password"
                            }
                          >
                            {showPassword ? (
                              <EyeOff className="size-4" />
                            ) : (
                              <Eye className="size-4" />
                            )}
                          </Button>
                        </div>
                        {hasError && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                        <FieldDescription>
                          Must be 8+ characters with uppercase, lowercase,
                          special characters, and a number.
                        </FieldDescription>
                      </Field>
                    );
                  }}
                </form.Field>

                {serverError && (
                  <Alert variant="destructive">
                    <AlertCircle className="size-4" />
                    <AlertDescription>{serverError}</AlertDescription>
                  </Alert>
                )}

                <form.Subscribe
                  selector={(s) => [s.canSubmit, s.isSubmitting] as const}
                >
                  {([canSubmit, isSubmitting]) => (
                    <Button
                      type="submit"
                      className="h-11 w-full text-sm sm:text-base"
                      disabled={!canSubmit || isPending}
                    >
                      {isSubmitting || isPending ? (
                        <>
                          <Spinner />
                          <span>Signing Up...</span>
                        </>
                      ) : (
                        "Sign Up"
                      )}
                    </Button>
                  )}
                </form.Subscribe>
              </form>
            </CardContent>
          </div>
        </div>

        <div className="relative hidden min-h-180 overflow-hidden rounded-md bg-black p-8 text-white sm:p-12 lg:flex lg:min-h-0">
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
