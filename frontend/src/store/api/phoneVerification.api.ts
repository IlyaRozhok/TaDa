import { baseApi } from "@/store/api/baseApi";

/** `GET /auth/phone/config` — hand-kept in step with the backend controller. */
export interface PhoneVerificationConfig {
  /** ISO codes whose mobiles can be verified (ALLOWED_PHONE_COUNTRIES). */
  allowedCountries: string[];
  verificationRequired: boolean;
}

export interface SendPhoneCodeRequest {
  phone: string;
  country?: string;
  turnstileToken?: string;
}

export interface SendPhoneCodeResponse {
  phone: string;
  country: string;
  resendAfterSeconds: number;
  expiresInSeconds: number;
}

export interface VerifyPhoneCodeRequest {
  phone: string;
  country?: string;
  code: string;
}

export interface VerifyPhoneCodeResponse {
  verified: true;
  phone: string;
  phone_country: string;
  phone_verified_at: string;
}

export const phoneVerificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPhoneVerificationConfig: builder.query<PhoneVerificationConfig, void>({
      query: () => "/auth/phone/config",
    }),
    sendPhoneCode: builder.mutation<SendPhoneCodeResponse, SendPhoneCodeRequest>({
      query: (body) => ({ url: "/auth/phone/send-code", method: "POST", body }),
    }),
    verifyPhoneCode: builder.mutation<VerifyPhoneCodeResponse, VerifyPhoneCodeRequest>({
      query: (body) => ({ url: "/auth/phone/verify-code", method: "POST", body }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const {
  useGetPhoneVerificationConfigQuery,
  useSendPhoneCodeMutation,
  useVerifyPhoneCodeMutation,
} = phoneVerificationApi;
