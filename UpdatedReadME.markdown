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

---

### `POST /auth/submit-email`

- **Description:** Start user registration by submitting an email and role, triggers OTP generation.
- **Body Parameters:**
  - `email` (string, required): Valid email address.
  - `role` (string, required): Must be "PATIENT" or "DOCTOR".
- **Query Parameters:** None
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
    - `400 Bad Request`: Invalid email or role, or email already verified.
    - `400 Bad Request`: Active OTP already exists for the user.

---

### `POST /auth/verify-email`

- **Description:** Verify OTP to confirm user email.
- **Body Parameters:**
  - `userId` (string, required): User ID from `/submit-email`.
  - `otp` (string, required): 4-digit OTP received via email.
- **Query Parameters:** None
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
    - `400 Bad Request`: Invalid or expired OTP.
    - `400 Bad Request`: Email already verified.
    - `404 Not Found`: User not found.

---

### `POST /auth/resend-otp`

- **Description:** Resend OTP to an unverified user.
- **Body Parameters:**
  - `userId` (string, required): User ID from `/submit-email`.
  - `method` (string, optional, default: "email"): Delivery method ("email").
- **Query Parameters:** None
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

### `POST /auth/register/patient`

- **Description:** Register a new patient with basic information after email verification.
- **Body Parameters:**
  - `userId` (string, required): User ID from `/submit-email`.
  - `email` (string, required): Verified email address.
  - `first_name` (string, required): Minimum 2 characters.
  - `last_name` (string, required): Minimum 2 characters.
  - `gender` (string, required): "MALE" or "FEMALE".
  - `phone` (string, required): Valid phone number (e.g., "+2348012345678").
  - `role` (string, required): Must be "PATIENT".
  - `allergies` (array of strings, optional): List of allergies.
- **Query Parameters:** None
- **Example Body:**
    ```json
    {
      "userId": "user_123",
      "email": "patient@example.com",
      "first_name": "Jane",
      "last_name": "Doe",
      "gender": "FEMALE",
      "phone": "+2348012345678",
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
      "message": "Patient registration initiated",
      "data": {
        "userId": "user_123",
        "email": "patient@example.com",
        "role": "PATIENT",
        "status": "PENDING_VERIFICATION",
        "isVerified": true
      }
    }
    ```
  - **Error Responses:**
    - `400 Bad Request`: Invalid input data.
    - `403 Forbidden`: Email not verified.
    - `404 Not Found`: User not found.

---

### `POST /auth/register/doctor`

- **Description:** Register a new doctor with basic information after email verification.
- **Body Parameters:**
  - `userId` (string, required): User ID from `/submit-email`.
  - `email` (string, required): Verified email address.
  - `first_name` (string, required): Minimum 2 characters.
  - `last_name` (string, required): Minimum 2 characters.
  - `gender` (string, required): "MALE" or "FEMALE".
  - `phone` (string, required): Valid phone number (e.g., "+2348098765432").
  - `role` (string, required): Must be "DOCTOR".
  - `hospitalId` (string, required): Hospital ID.
  - `specialization` (string, required): Minimum 3 characters.
  - `experience` (number, required): Years of experience (integer, minimum 0).
  - `license` (string, required): License number (e.g., "AB123456", two uppercase letters followed by six digits).
- **Query Parameters:** None
- **Example Body:**
    ```json
    {
      "userId": "user_456",
      "email": "doctor@example.com",
      "first_name": "John",
      "last_name": "Smith",
      "gender": "MALE",
      "phone": "+2348098765432",
      "role": "DOCTOR",
      "hospitalId": "hospital_123",
      "specialization": "Cardiology",
      "experience": 10,
      "license": "DOC123456"
    }
    ```
- **Response:**
  - `201 Created`
  - Example:
    ```json
    {
      "success": true,
      "message": "Doctor registration initiated",
      "data": {
        "userId": "user_456",
        "email": "doctor@example.com",
        "role": "DOCTOR",
        "status": "PENDING_VERIFICATION",
        "isVerified": true
      }
    }
    ```
  - **Error Responses:**
    - `400 Bad Request`: Invalid input data.
    - `403 Forbidden`: Email not verified.
    - `404 Not Found`: User not found.

---

### `POST /auth/complete-profile`

- **Description:** Complete user profile after email verification, setting password and additional details.
- **Body Parameters:**
  - `userId` (string, required): User ID from `/submit-email`.
  - `password` (string, required): Minimum 8 characters, must include uppercase, lowercase, number, and special character.
  - `date_of_birth` (string, required): ISO date (e.g., "1990-01-01").
  - `profile_picture` (string, optional): URL to profile picture.
  - **For patients:**
    - `allergies` (array of strings, optional): List of allergies.
  - **For doctors:**
    - `specialization` (string, required): Minimum 3 characters.
    - `experience` (number, required): Years of experience (integer, minimum 0).
    - `license` (string, required): License number (e.g., "DOC123456").
    - `hospitalId` (string, required): Hospital ID.
- **Query Parameters:** None
- **Example Body (Patient):**
    ```json
    {
      "userId": "user_123",
      "password": "SecurePass123!",
      "allergies": ["penicillin"],
      "date_of_birth": "1990-01-01",
      "profile_picture": "https://example.com/pic.jpg"
    }
    ```
- **Example Body (Doctor):**
    ```json
    {
      "userId": "user_456",
      "password": "SecurePass123!",
      "specialization": "Cardiology",
      "experience": 10,
      "license": "DOC123456",
      "hospitalId": "hospital_123",
      "date_of_birth": "1985-05-10",
      "profile_picture": "https://example.com/docpic.jpg"
    }
    ```
- **Response:**
  - `200 OK`
  - Example (Patient):
    ```json
    {
      "success": true,
      "message": "Patient profile completed",
      "data": {
        "id": "user_123",
        "email": "patient@example.com",
        "role": "PATIENT",
        "status": "VERIFIED",
        "isVerified": true
      }
    }
    ```
  - Example (Doctor):
    ```json
    {
      "success": true,
      "message": "Doctor profile submitted for approval",
      "data": {
        "id": "user_456",
        "email": "doctor@example.com",
        "role": "DOCTOR",
        "status": "PENDING_APPROVAL",
        "isVerified": true
      }
    }
    ```
  - **Error Responses:**
    - `400 Bad Request`: Invalid input data or role.
    - `403 Forbidden`: Email not verified.
    - `404 Not Found`: User not found.

---

### `POST /auth/login`

- **Description:** Login with email and password.
- **Body Parameters:**
  - `email` (string, required): Verified email address.
  - `password` (string, required): User password.
- **Query Parameters:** None
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

### `GET /auth/profile-status/:userId`

- **Description:** Check if a user has completed their profile.
- **Route Parameters:**
  - `userId` (string, required): User ID.
- **Query Parameters:** None
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

## Error Handling

- All endpoints may return standard error responses.
- Common error responses:
  - `400 Bad Request`: Invalid input or validation failure.
  - `401 Unauthorized`: Invalid credentials or incomplete profile.
  - `403 Forbidden`: Email not verified or insufficient permissions.
  - `404 Not Found`: Resource (e.g., user) not found.
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