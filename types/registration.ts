export interface RegisterPayload {
  name: string;
  email: string;
  gender: "MALE" | "FEMALE";
  phoneNumber: string;
  password: string;
}

export interface RegisterResponse {
  success: boolean;
  message?: string;
  redirectPath?: string;
}
