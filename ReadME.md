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

## Chat System

The chat system provides real-time communication between doctors and patients using Socket.IO for WebSocket connections and REST APIs for chat management.

### Chat REST API Endpoints

Base path: `/chat`

#### `POST /chat/create`
- **Description:** Create a new chat between a doctor and a patient
- **Authentication:** Required (Bearer token)
- **Body Parameters:**
  - `participantId` (string, required): ID of the user to chat with (if you're a doctor, this should be a patient's ID, and vice versa)
- **Example Request:**
  ```json
  {
    "participantId": "user_123"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Chat created successfully",
    "data": {
      "id": "chat_456",
      "status": "ACTIVE",
      "doctor": {
        "id": "doctor_789",
        "first_name": "John",
        "last_name": "Smith",
        "role": "DOCTOR"
      },
      "patient": {
        "id": "patient_123",
        "first_name": "Jane",
        "last_name": "Doe",
        "role": "PATIENT"
      }
    }
  }
  ```

#### `GET /chat`
- **Description:** Get all chats for the authenticated user
- **Authentication:** Required (Bearer token)
- **Response:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "chat_456",
        "status": "ACTIVE",
        "created_at": "2025-09-12T13:42:51.472Z",
        "updated_at": "2025-09-12T13:55:12.538Z",
        "last_message_at": "2025-09-12T13:55:12.536Z",
        "doctor": {
          "id": "doctor_789",
          "first_name": "John",
          "last_name": "Smith",
          "role": "DOCTOR"
        },
        "patient": {
          "id": "patient_123",
          "first_name": "Jane",
          "last_name": "Doe",
          "role": "PATIENT"
        },
        "lastMessage": {
          "content": "Hello",
          "sender": {
            "first_name": "John",
            "last_name": "Smith"
          }
        },
        "unreadCount": 2
      }
    ]
  }
  ```

### WebSocket Chat Implementation

#### Connection Setup
```javascript
// Initialize Socket.IO connection with authentication
const socket = io('http://localhost:3000 ', { //use base backend url in production
  auth: {
    token: 'YOUR_JWT_TOKEN'  // Same token used for REST API
  }
});

// Connection event handlers
socket.on('connect', () => {
  console.log('Connected to chat server');
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});

socket.on('disconnect', () => {
  console.log('Disconnected from chat server');
});
```

#### Joining a Chat Room
```javascript
// Join a specific chat room
socket.emit('joinChat', chatId);
```

#### Sending Messages
```javascript
// Send a message
socket.emit('sendMessage', {
  chatId: 'chat_456',
  content: 'Hello, how are you?',
  messageType: 'TEXT'
});
```

#### Receiving Messages
```javascript
// Listen for new messages
socket.on('newMessage', (message) => {
  console.log('New message received:', {
    content: message.content,
    sender: message.sender,  // Contains sender's name and role
    timestamp: message.created_at
  });
});

// Listen for read receipts
socket.on('messagesRead', ({ chatId, userId }) => {
  console.log(`Messages in chat ${chatId} were read by user ${userId}`);
});
```

### Example Implementation

Here's a complete example of a basic chat client:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Lafia Chat Client</title>
    <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
</head>
<body>
    <!-- Connection Section -->
    <div>
        <input type="text" id="token" placeholder="Enter JWT token">
        <button onclick="connect()">Connect</button>
    </div>

    <!-- Chat Creation -->
    <div>
        <input type="text" id="participantId" placeholder="Enter Participant ID">
        <button onclick="createChat()">Create Chat</button>
    </div>

    <!-- Chat List -->
    <div id="chatsList"></div>

    <!-- Chat Interface -->
    <div>
        <input type="text" id="chatId" placeholder="Enter Chat ID">
        <button onclick="joinChat()">Join Chat</button>
        <input type="text" id="messageInput" placeholder="Type a message">
        <button onclick="sendMessage()">Send</button>
    </div>

    <!-- Messages Display -->
    <div id="messages"></div>

    <script>
        let socket;
        let currentToken;

        // Connect to Socket.IO server
        function connect() {
            currentToken = document.getElementById('token').value;
            socket = io('http://localhost:3000', {
                auth: { token: currentToken }
            });

            socket.on('connect', () => {
                console.log('Connected to server');
                getUserChats();
            });

            socket.on('newMessage', (message) => {
                displayMessage(message);
            });
        }

        // Create a new chat
        async function createChat() {
            const participantId = document.getElementById('participantId').value;
            const response = await fetch('http://localhost:3000/chat/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify({ participantId })
            });
            const data = await response.json();
            if (data.success) {
                getUserChats();
            }
        }

        // Join a chat room
        function joinChat() {
            const chatId = document.getElementById('chatId').value;
            socket.emit('joinChat', chatId);
        }

        // Send a message
        function sendMessage() {
            const chatId = document.getElementById('chatId').value;
            const content = document.getElementById('messageInput').value;
            
            socket.emit('sendMessage', {
                chatId: chatId,
                content: content,
                messageType: 'TEXT'
            });

            document.getElementById('messageInput').value = '';
        }

        // Display a message
        function displayMessage(message) {
            const messagesDiv = document.getElementById('messages');
            const messageElement = document.createElement('div');
            messageElement.innerHTML = `
                <strong>${message.sender.first_name} ${message.sender.last_name}</strong>
                (${message.sender.role}): ${message.content}
            `;
            messagesDiv.appendChild(messageElement);
        }
    </script>
</body>
</html>
```

### Chat Features and Capabilities

1. **Authentication & Security**
   - All chat operations require JWT authentication
   - Same token used for both REST API and WebSocket connections
   - Users can only access their own chats
   - Messages are persisted in the database

2. **Roles and Permissions**
   - Only DOCTOR and PATIENT roles can participate in chats
   - Users can only chat with users of the opposite role (doctors with patients and vice versa)
   - Each chat is strictly between one doctor and one patient

3. **Message Management**
   - **Types**: Supports TEXT and SYSTEM messages
   - **File Attachments**: Supported via file_url parameter (implementation required for file upload)
   - **Editing**: 
     - Users can edit their own messages
     - Only within 5 minutes of sending
     - Messages are marked as edited
   - **Deletion**: 
     - Users can delete their own messages
     - Only within 5 minutes of sending
     - Soft deletion (message content replaced with "This message was deleted")

4. **Real-time Features**
   - Instant message delivery
   - Read receipts
   - Unread message counts
   - Last message tracking
   - Message timestamps

5. **Chat Management**
   - Automatic chat creation between doctor and patient
   - Prevention of duplicate chats between same participants
   - Chat history with pagination
   - Last message preview in chat list

### Message Operations

#### Edit Message
```http
PUT /chat/message/:messageId
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "content": "Updated message content"
}
```
Response:
```json
{
  "success": true,
  "data": {
    "id": "message_id",
    "content": "Updated message content",
    "is_edited": true,
    "sender": {
      "first_name": "John",
      "last_name": "Smith",
      "role": "DOCTOR"
    }
  }
}
```

#### Delete Message
```http
DELETE /chat/message/:messageId
Authorization: Bearer YOUR_JWT_TOKEN
```
Response:
```json
{
  "success": true,
  "data": {
    "id": "message_id",
    "content": "This message was deleted",
    "message_type": "SYSTEM",
    "sender": {
      "first_name": "John",
      "last_name": "Smith",
      "role": "DOCTOR"
    }
  }
}
```

### Current Limitations

1. **Group Chats**: Not supported - chats are strictly one-to-one between doctor and patient

2. **File Attachments**: 
   - Backend structure supports file URLs
   - File upload implementation required
   - No file size or type restrictions implemented yet

3. **Message Management**:
   - 5-minute time limit for editing/deleting messages
   - No message threading or replies
   - No message reactions

4. **Real-time Features** (Coming Soon):
   - Typing indicators
   - Online/offline status
   - Message delivery status

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