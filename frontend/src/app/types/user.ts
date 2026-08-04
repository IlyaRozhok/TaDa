/**
 * The flat shape the profile form edits and `PUT /users/profile` accepts.
 * Moved from the deleted `src/types` tree (step 5.2); the phantom
 * `occupation` field went with the move — no column on `users`, no reader.
 */
export interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  address?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  nationality?: string;
  avatar_url?: string;
}
