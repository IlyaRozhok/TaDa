import { baseApi } from "@/store/api/baseApi";

/**
 * The shape `toUserResponse` on the backend actually returns: the admin list
 * and the admin mutations all go through it, so no nested profile arrives here.
 * The app has several other `User` types; unifying them is step 5.2, not this
 * one, so this stays next to the endpoints that produce it.
 */
export interface AdminUser {
  id: string;
  email: string;
  role: string;
  status: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string | null;
  provider?: string;
  google_id?: string;
  email_verified?: boolean;
  created_at: string;
  updated_at: string;
  is_private_landlord?: boolean | null;
}

/** `GET /users` is paginated and answers with this envelope. */
export interface UsersPage {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetUsersArgs {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  sortBy?: string;
  order?: "ASC" | "DESC";
}

export interface CreateUserArgs {
  full_name: string;
  email: string;
  role: string;
  password: string;
  is_private_landlord?: boolean;
}

export interface UpdateUserArgs {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_private_landlord?: boolean;
}

/**
 * Every endpoint here is `@Roles("admin")` on the backend. The operator
 * dropdowns in the property and building modals call the same list, which is
 * why it is a query rather than an admin-only helper.
 */
export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<UsersPage, GetUsersArgs | void>({
      query: (args) => ({
        url: "/users",
        params: args ?? undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.users.map(({ id }) => ({ type: "User" as const, id })),
              { type: "User" as const, id: "LIST" },
            ]
          : [{ type: "User" as const, id: "LIST" }],
    }),

    createUser: builder.mutation<AdminUser, CreateUserArgs>({
      query: ({ is_private_landlord, role, ...rest }) => ({
        url: "/users",
        method: "POST",
        body: {
          ...rest,
          role,
          // The flag only exists for operators; sending it for anyone else
          // would be a field the DTO does not expect.
          ...(role === "operator"
            ? { is_private_landlord: is_private_landlord ?? false }
            : {}),
        },
      }),
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),

    updateUser: builder.mutation<AdminUser, UpdateUserArgs>({
      query: ({ id, is_private_landlord, role, ...rest }) => ({
        url: `/users/${id}`,
        method: "PUT",
        body: {
          ...rest,
          role,
          ...(role === "operator"
            ? { is_private_landlord: is_private_landlord ?? false }
            : {}),
        },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
      ],
    }),

    deleteUser: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/users/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useLazyGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = usersApi;
