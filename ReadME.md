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
      "timestamp": "2024-07-08T12:00:00.000Z"
    }
    ```

---

## Authentication & User Management

Base path: `/auth`

---

POST /auth/start-registration

Description: Start user registration by submitting an email and role, triggers OTP generation.

Body Parameters:

email (string, required)
role (string, required: "PATIENT" or "DOCTOR")
Query Parameters: None

Example Body:
{
  "email": "user@example.com",
  "role": "PATIENT"
}

Response:
201 Created

Example:
{
  "success": true,
  "message": "Registration started, OTP sent",
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "role": "PATIENT",
    "status": "PENDING_VERIFICATION",
    "isVerified": false
  },
  "otp": "123456"
}


<!-- ### `POST /auth/register/patient`

- **Description:** Register a new patient (step 1: base info, triggers OTP).
- **Body Parameters:**
  - `email` (string, required)
  - `first_name` (string, required)
  - `last_name` (string, required)
  - `gender` (string, required: "MALE" or "FEMALE")
  - `phone` (string, required)
- **Query Parameters:** None
- **Example Body:**
    ```json
    {
      "email": "patient@example.com",
      "first_name": "Jane",
      "last_name": "Doe",
      "gender": "FEMALE",
      "phone": "+2348012345678",
    }
    ```
- **Response:**
  - `201 Created`
  - Returns user info and OTP send status.

---

### `POST /auth/register/doctor`

- **Description:** Register a new doctor (step 1: base info, triggers OTP).
- **Body Parameters:**
  - `email` (string, required)
  - `first_name` (string, required)
  - `last_name` (string, required)
  - `gender` (string, required: "MALE" or "FEMALE")
  - `phone` (string, required)
  - `hospitalId` (string, required)
- **Query Parameters:** None
- **Example Body:**
    ```json
    {
      "email": "doctor@example.com",
      "first_name": "John",
      "last_name": "Smith",
      "gender": "MALE",
      "phone": "+2348098765432",
      "hospitalId": "hospital_123"
    }
    ```
- **Response:**
  - `201 Created`
  - Returns user info and OTP send status. -->

---

### `POST /auth/verify-otp`

- **Description:** Verify OTP for user registration.
- **Body Parameters:**
  - `userId` (string, required)
  - `otp` (string, required)
- **Query Parameters:** None
- **Example Body:**
    ```json
    {
      "userId": "user_123",
      "otp": "123456"
    }
    ```
- **Response:**
  - `200 OK`
  - Returns user info after verification.

---

### `POST /auth/resend-otp`

- **Description:** Resend OTP to user.
- **Body Parameters:**
  - `userId` (string, required)
  - `method` (string, optional, default: "email")
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
  - Returns OTP send status.

---

### `POST /auth/login`

- **Description:** Login with email and password.
- **Body Parameters:**
  - `email` (string, required)
  - `password` (string, required)
- **Query Parameters:** None
- **Example Body:**
    ```json
    {
      "email": "patient@example.com",
      "password": "yourPassword123"
    }
    ```
- **Response:**
  - `200 OK`
  - Returns JWT token and user info.

---

POST /auth/complete-profile

Description: Complete user profile after OTP verification.

Body Parameters:
userId (string, required)
email (string, required)
password (string, required)
first_name (string, required)
last_name (string, required)
gender (string, required: "MALE" or "FEMALE")
phone (string, required)
role (string, required: "PATIENT" or "DOCTOR")
profile_picture (string, optional)
date_of_birth (string, ISO date, optional)

For patients:
allergies (array of strings, optional)

For doctors:
specialization (string, required)
experience (number, required)
license (string, required)
hospitalId (string, required)
Query Parameters: None

Example Body (Patient):

{
  "userId": "cmdqrsqvd0000upqg7tqzny1p",
  "email": "user@example.com",
  "password": "SecurePass123!",
  "first_name": "Jane",
  "last_name": "Doe",
  "gender": "FEMALE",
  "phone": "+2348012345678",
  "role": "PATIENT",
  "allergies": ["penicillin"],
  "date_of_birth": "1990-01-01",
  "profile_picture": "https://example.com/pic.jpg"
}

Example Body (Doctor):

{
   "userId": "cmdqrsqvd0000upqg7tqzny1p",
  "email": "doctor@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Smith",
  "gender": "MALE",
  "phone": "+2348098765432",
  "role": "DOCTOR",
  "specialization": "Cardiology",
  "experience": 10,
  "license": "DOC123456",
  "hospitalId": "hospital_123",
  "date_of_birth": "1985-05-10",
  "profile_picture": "https://example.com/docpic.jpg"
}

Response:
200 OK

Example (Patient):
{
  "success": true,
  "message": "Patient profile completed",
  "data": {
    "id": "patient_123",
    "userId": "user_123",
    "allergies": ["penicillin"],
    "created_at": "2025-07-28T12:00:00.000Z",
    "updated_at": "2025-07-28T12:00:00.000Z"
  }
}



Example (Doctor):

{
  "success": true,
  "message": "Doctor profile submitted for approval",
  "data": {
    "id": "doctor_456",
    "userId": "user_456",
    "specialization": "Cardiology",
    "experience": 10,
    "license": "DOC123456",
    "hospitalId": "hospital_123",
    "isActive": false,
    "isAvailable": false,
    "created_at": "2025-07-28T12:00:00.000Z",
    "updated_at": "2025-07-28T12:00:00.000Z"
  }
}

<!-- - **Description:** Complete user profile after OTP verification.
- **Body Parameters:**
  - `userId` (string, required)
  - `password` (string, required)
  - For patients:
    - `allergies` (array of strings, optional)
    - `date_of_birth` (string, ISO date, optional)
    - `profile_picture` (string, optional)
  - For doctors:
    - `specialization` (string, required)
    - `experience` (number, required)
    - `license` (string, required)
    - `date_of_birth` (string, ISO date, optional)
    - `profile_picture` (string, optional)
    - `hospitalId` (string, required)
- **Query Parameters:** None
- **Example Body (Patient):**
    ```json
    {
      "userId": "user_123",
      "password": "securePassword",
      "allergies": ["penicillin"],
      "date_of_birth": "1990-01-01",
      "profile_picture": "https://example.com/pic.jpg"
    }
    ```
- **Example Body (Doctor):**
    ```json
    {
      "userId": "user_456",
      "password": "securePassword",
      "specialization": "Cardiology",
      "experience": 10,
      "license": "DOC123456",
      "date_of_birth": "1985-05-10",
      "profile_picture": "https://example.com/docpic.jpg",
      "hospitalId": "hospital_123"
    }
    ```
- **Response:**
  - `200 OK`
  - Returns updated user data.

---

### `GET /auth/profile-status/:userId`

- **Description:** Check if a user has completed their profile.
- **Route Parameters:**
  - `userId` (string, required)
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
    ``` -->

---

## Error Handling

- All endpoints may return standard error responses.
- Any undefined route returns:
  - `404 Not Found`
  - Example:
    ```json
    { "error": "Route not found" }