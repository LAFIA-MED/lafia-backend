# Lafia Backend API Documentation

## Base URL

All endpoints are relative to your server root (e.g., `http://localhost:3000/`).

---

## Health Check

### `GET /health`

- **Description:** Check if the server is running.
- **Query Parameters:** None
- **Response:**
  - `200 OK`
  - Example:
    ```json
    {
      "status": "OK",
      "timestamp": "2025-08-01T23:00:00.000Z"
    }
    ```

---

## Authentication & User Management

Base path: `/auth`

The authentication system now uses a **two-step process**:

1. **Step 1:** Email verification (submit email + role → verify with OTP)
2. **Step 2:** Profile completion (create role-specific profile with all details)

---

### Step 1: Email Verification

#### `POST /auth/submit-email`

- **Description:** Start user registration by submitting an email and role, triggers OTP generation.
- **Body Parameters:**
  - `email` (string, required): Valid email address.
  - `role` (string, required): Must be "PATIENT", "DOCTOR", or "HOSPITAL".
- **Example Body:**
    ```json
    {
      "email": "user@example.com",
      "role": "PATIENT"
    }
    ```
- **Response:**
  - `201 Created` (new user created)
  - `200 OK` (existing unverified user, OTP resent)
  - Example:
    ```json
    {
      "success": true,
      "message": "Email submitted successfully, OTP sent",
      "data": {
        "userId": "user_123",
        "email": "user@example.com",
        "role": "PATIENT"
      },
      "otp": "1234"
    }
    ```
  - **Error Responses:**
    - `400 Bad Request`: Invalid email or role, or email already verified and registered.

---

#### `POST /auth/verify-email`

- **Description:** Verify OTP to confirm user email.
- **Body Parameters:**
  - `userId` (string, required): User ID from `/submit-email`.
  - `otp` (string, required): 4-digit OTP received via email.
- **Example Body:**
    ```json
    {
      "userId": "user_123",
      "otp": "1234"
    }
    ```
- **Response:**
  - `200 OK`
  - Example:
    ```json
    {
      "success": true,
      "message": "Email verified successfully",
      "data": {
        "userId": "user_123",
        "email": "user@example.com",
        "role": "PATIENT",
        "isVerified": true
      }
    }
    ```
  - **Error Responses:**
    - `400 Bad Request`: Invalid or expired OTP, or email already verified.
    - `404 Not Found`: User not found.

---

#### `POST /auth/resend-otp`

- **Description:** Resend OTP to an unverified user.
- **Body Parameters:**
  - `userId` (string, required): User ID from `/submit-email`.
  - `method` (string, optional, default: "email"): Delivery method ("email").
- **Example Body:**
    ```json
    {
      "userId": "user_123",
      "method": "email"
    }
    ```
- **Response:**
  - `200 OK`
  - Example:
    ```json
    {
      "success": true,
      "message": "OTP resent successfully",
      "otp": "654321"
    }
    ```
  - **Error Responses:**
    - `400 Bad Request`: Email already verified.
    - `404 Not Found`: User not found.

---

### Step 2: Profile Completion

#### `POST /auth/create-patient`

- **Description:** Create a complete patient profile after email verification.
- **Authentication:** Requires email verification (userId must be verified).
- **Body Parameters:**
  - `userId` (string, required): Verified user ID.
  - `email` (string, required): Verified email address.
  - `password` (string, required): Minimum 8 characters, must include uppercase, lowercase, number, and special character.
  - `first_name` (string, required): Minimum 2 characters, maximum 50.
  - `last_name` (string, required): Minimum 2 characters, maximum 50.
  - `gender` (string, required): "MALE" or "FEMALE".
  - `phone` (string, required): Valid international phone number.
  - `date_of_birth` (string, required): ISO date (e.g., "1990-01-01").
  - `profile_picture` (string, optional): URL to profile picture.
  - `role` (string, required): Must be "PATIENT".
  - `allergies` (array of strings, optional): List of allergies.
- **Example Body:**
    ```json
    {
      "userId": "user_123",
      "email": "patient@example.com",
      "password": "SecurePass123!",
      "first_name": "Jane",
      "last_name": "Doe",
      "gender": "FEMALE",
      "phone": "+2348012345678",
      "date_of_birth": "1990-01-01",
      "profile_picture": "https://example.com/pic.jpg",
      "role": "PATIENT",
      "allergies": ["penicillin"]
    }
    ```
- **Response:**
  - `201 Created`
  - Example:
    ```json
    {
      "success": true,
      "message": "Patient profile created successfully",
      "data": {
        "userId": "user_123",
        "email": "patient@example.com",
        "role": "PATIENT",
        "status": "VERIFIED",
        "isVerified": true
      }
    }
    ```
  - **Error Responses:**
    - `400 Bad Request`: Invalid input data or role mismatch.
    - `403 Forbidden`: Email not verified.
    - `404 Not Found`: User not found.

---

#### `POST /auth/create-doctor`

- **Description:** Create a complete doctor profile after email verification.
- **Authentication:** Requires email verification (userId must be verified).
- **Body Parameters:**
  - `userId` (string, required): Verified user ID.
  - `email` (string, required): Verified email address.
  - `password` (string, required): Minimum 8 characters, must include uppercase, lowercase, number, and special character.
  - `first_name` (string, required): Minimum 2 characters, maximum 50.
  - `last_name` (string, required): Minimum 2 characters, maximum 50.
  - `gender` (string, required): "MALE" or "FEMALE".
  - `phone` (string, required): Valid international phone number.
  - `date_of_birth` (string, required): ISO date (e.g., "1985-05-10").
  - `profile_picture` (string, optional): URL to profile picture.
  - `role` (string, required): Must be "DOCTOR".
  - `specialization` (string, required): Minimum 3 characters, maximum 100.
  - `experience` (number, required): Years of experience (integer, 0-50).
  - `license` (string, required): License number (e.g., "AB123456", two uppercase letters followed by six digits).
  - `hospitalId` (string, required): Hospital ID (hospital must exist).
- **Example Body:**
    ```json
    {
      "userId": "user_456",
      "email": "doctor@example.com",
      "password": "SecurePass123!",
      "first_name": "John",
      "last_name": "Smith",
      "gender": "MALE",
      "phone": "+2348098765432",
      "date_of_birth": "1985-05-10",
      "profile_picture": "https://example.com/docpic.jpg",
      "role": "DOCTOR",
      "specialization": "Cardiology",
      "experience": 10,
      "license": "AB123456",
      "hospitalId": "hospital_123"
    }
    ```
- **Response:**
  - `201 Created`
  - Example:
    ```json
    {
      "success": true,
      "message": "Doctor profile created successfully",
      "data": {
        "userId": "user_456",
        "email": "doctor@example.com",
        "role": "DOCTOR",
        "status": "PENDING_APPROVAL",
        "isVerified": true
      }
    }
    ```
  - **Error Responses:**
    - `400 Bad Request`: Invalid input data, role mismatch, or hospital not found.
    - `403 Forbidden`: Email not verified.
    - `404 Not Found`: User not found.

---

#### `POST /auth/create-hospital`

- **Description:** Create a new hospital (separate from hospital user creation).
- **Body Parameters:**
  - `name` (string, required): Hospital name (minimum 2 characters, maximum 100).
  - `address` (string, required): Hospital address (minimum 10 characters, maximum 500).
  - `license` (string, required): Hospital license (minimum 5 characters, maximum 50).
  - `phone` (string, required): Valid international phone number.
  - `email` (string, required): Valid email address.
- **Example Body:**
    ```json
    {
      "name": "General Hospital",
      "address": "123 Main Street, City, State 12345",
      "license": "HOSP123456",
      "phone": "+2348012345678",
      "email": "info@generalhospital.com"
    }
    ```
- **Response:**
  - `201 Created`
  - Example:
    ```json
    {
      "success": true,
      "message": "Hospital created successfully",
      "data": {
        "hospitalId": "hospital_123",
        "name": "General Hospital",
        "email": "info@generalhospital.com",
        "phone": "+2348012345678"
      }
    }
    ```
  - **Error Responses:**
    - `400 Bad Request`: Invalid input data or hospital with same email/phone/name already exists.

---

#### `POST /auth/create-hospital-user`

- **Description:** Create a hospital user profile after email verification.
- **Authentication:** Requires email verification (userId must be verified).
- **Body Parameters:**
  - `userId` (string, required): Verified user ID.
  - `email` (string, required): Verified email address.
  - `password` (string, required): Minimum 8 characters, must include uppercase, lowercase, number, and special character.
  - `first_name` (string, required): Minimum 2 characters, maximum 50.
  - `last_name` (string, required): Minimum 2 characters, maximum 50.
  - `gender` (string, required): "MALE" or "FEMALE".
  - `phone` (string, required): Valid international phone number.
  - `date_of_birth` (string, required): ISO date.
  - `profile_picture` (string, optional): URL to profile picture.
  - `role` (string, required): Must be "HOSPITAL".
  - `hospitalId` (string, required): Hospital ID (hospital must exist).
- **Example Body:**
    ```json
    {
      "userId": "user_789",
      "email": "admin@hospital.com",
      "password": "SecurePass123!",
      "first_name": "Hospital",
      "last_name": "Admin",
      "gender": "MALE",
      "phone": "+2348012345678",
      "date_of_birth": "1980-01-01",
      "role": "HOSPITAL",
      "hospitalId": "hospital_123"
    }
    ```
- **Response:**
  - `201 Created`
  - Example:
    ```json
    {
      "success": true,
      "message": "Hospital user profile created successfully",
      "data": {
        "userId": "user_789",
        "email": "admin@hospital.com",
        "role": "HOSPITAL",
        "status": "VERIFIED",
        "isVerified": true
      }
    }
    ```
  - **Error Responses:**
    - `400 Bad Request`: Invalid input data, role mismatch, or hospital not found.
    - `403 Forbidden`: Email not verified.
    - `404 Not Found`: User not found.

---

#### `POST /auth/login`

- **Description:** Login with email and password.
- **Body Parameters:**
  - `email` (string, required): Verified email address.
  - `password` (string, required): User password.
- **Example Body:**
    ```json
    {
      "email": "patient@example.com",
      "password": "SecurePass123!"
    }
    ```
- **Response:**
  - `200 OK`
  - Example:
    ```json
    {
      "success": true,
      "message": "Login successful",
      "token": "jwt_token_here",
      "user": {
        "id": "user_123",
        "email": "patient@example.com",
        "role": "PATIENT"
      }
    }
    ```
  - **Error Responses:**
    - `401 Unauthorized`: Invalid credentials or profile incomplete.
    - `403 Forbidden`: Email not verified.

---

#### `GET /auth/profile-status/:userId`

- **Description:** Check if a user has completed their profile.
- **Route Parameters:**
  - `userId` (string, required): User ID.
- **Response:**
  - `200 OK`
  - Example:
    ```json
    {
      "success": true,
      "data": {
        "isComplete": true
      }
    }
    ```
  - **Error Responses:**
    - `404 Not Found`: User not found.

---

## User Management

Base path: `/users`

### `GET /users/profile`

- **Description:** Get authenticated user's profile.
- **Authentication:** Required (Bearer token).
- **Response:**
  - `200 OK`
  - Example:
    ```json
    {
      "success": true,
      "message": "User profile retrieved successfully",
      "data": {
        "id": "user_123",
        "email": "patient@example.com",
        "first_name": "Jane",
        "last_name": "Doe",
        "role": "PATIENT",
        "status": "VERIFIED",
        "isVerified": true,
        "Patient": {
          "allergies": ["penicillin"]
        }
      }
    }
    ```

### `PUT /users/profile`

- **Description:** Update authenticated user's profile.
- **Authentication:** Required (Bearer token).
- **Body Parameters:** Varies by role (see validation schemas).
- **Response:**
  - `200 OK`
  - Example:
    ```json
    {
      "success": true,
      "message": "User profile updated successfully",
      "data": {
        "id": "user_123",
        "email": "patient@example.com",
        "first_name": "Jane",
        "last_name": "Doe",
        "role": "PATIENT"
      }
    }
    ```

### `GET /users/:userId` (Admin only)

- **Description:** Get user by ID (admin only).
- **Authentication:** Required (Bearer token with ADMIN role).
- **Response:**
  - `200 OK`
  - Example:
    ```json
    {
      "success": true,
      "message": "User retrieved successfully",
      "data": {
        "id": "user_123",
        "email": "patient@example.com",
        "role": "PATIENT"
      }
    }
    ```

### `PUT /users/:userId` (Admin only)

- **Description:** Update user by ID (admin only).
- **Authentication:** Required (Bearer token with ADMIN role).
- **Body Parameters:** Varies by role (see validation schemas).
- **Response:**
  - `200 OK`
  - Example:
    ```json
    {
      "success": true,
      "message": "User updated successfully",
      "data": {
        "id": "user_123",
        "email": "patient@example.com",
        "role": "PATIENT"
      }
    }
    ```

---

## Hospital Management

Base path: `/hospitals`

### `GET /hospitals`

- **Description:** Get all hospitals.
- **Response:**
  - `200 OK`
  - Example:
    ```json
    {
      "success": true,
      "message": "Hospitals retrieved successfully",
      "data": [
        {
          "id": "hospital_123",
          "name": "General Hospital",
          "address": "123 Main Street",
          "phone": "+2348012345678",
          "email": "info@generalhospital.com"
        }
      ]
    }
    ```

### `GET /hospitals/:hospitalId`

- **Description:** Get hospital by ID.
- **Response:**
  - `200 OK`
  - Example:
    ```json
    {
      "success": true,
      "message": "Hospital retrieved successfully",
      "data": {
        "id": "hospital_123",
        "name": "General Hospital",
        "address": "123 Main Street",
        "phone": "+2348012345678",
        "email": "info@generalhospital.com",
        "license": "HOSP123456"
      }
    }
    ```

### `POST /hospitals` (Admin only)

- **Description:** Create a new hospital (admin only).
- **Authentication:** Required (Bearer token with ADMIN role).
- **Body Parameters:** Same as `/auth/create-hospital`.
- **Response:**
  - `201 Created`
  - Example:
    ```json
    {
      "success": true,
      "message": "Hospital created successfully",
      "data": {
        "id": "hospital_123",
        "name": "General Hospital",
        "address": "123 Main Street",
        "phone": "+2348012345678",
        "email": "info@generalhospital.com",
        "license": "HOSP123456"
      }
    }
    ```

### `PUT /hospitals/:hospitalId` (Admin only)

- **Description:** Update hospital (admin only).
- **Authentication:** Required (Bearer token with ADMIN role).
- **Body Parameters:** Same as create, but all fields optional.
- **Response:**
  - `200 OK`
  - Example:
    ```json
    {
      "success": true,
      "message": "Hospital updated successfully",
      "data": {
        "id": "hospital_123",
        "name": "Updated Hospital Name",
        "address": "123 Main Street",
        "phone": "+2348012345678",
        "email": "info@generalhospital.com",
        "license": "HOSP123456"
      }
    }
    ```

### `DELETE /hospitals/:hospitalId` (Admin only)

- **Description:** Delete hospital (admin only).
- **Authentication:** Required (Bearer token with ADMIN role).
- **Response:**
  - `200 OK`
  - Example:
    ```json
    {
      "success": true,
      "message": "Hospital deleted successfully"
    }
    ```

---

## Error Handling

- All endpoints may return standard error responses.
- Common error responses:
  - `400 Bad Request`: Invalid input or validation failure.
  - `401 Unauthorized`: Invalid credentials, incomplete profile, or missing token.
  - `403 Forbidden`: Email not verified or insufficient permissions.
  - `404 Not Found`: Resource (e.g., user, hospital) not found.
  - `409 Conflict`: Resource already exists (e.g., duplicate email).
  - `429 Too Many Requests`: Rate limit exceeded.
  - Example:
    ```json
    {
      "success": false,
      "message": "Email verification required"
    }
    ```
- Any undefined route returns:
  - `404 Not Found`
  - Example:
    ```json
    { "error": "Route not found" }
    ```

---

## Authentication

- JWT tokens are used for authentication.
- Include the token in the Authorization header: `Bearer <token>`
- Tokens expire based on configuration (default: 1 hour).
- Role-based access control is implemented for protected endpoints.

---

## Validation Rules

### Password Requirements
- Minimum 8 characters
- Must contain at least one uppercase letter
- Must contain at least one lowercase letter
- Must contain at least one number
- Must contain at least one special character (!@#$%^&*)

### Phone Number Format
- International format: `+2348012345678`
- Must start with `+` followed by country code and number

### License Format (Doctors)
- Two uppercase letters followed by six digits
- Example: `AB123456`

### Email Verification
- All users must verify their email before completing profile
- OTP is sent to email address
- OTP expires after 10 minutes
- Only one active OTP per user at a time