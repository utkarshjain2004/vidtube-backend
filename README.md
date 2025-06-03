# Vidtube Backend

**Vidtube** is a Node.js + Express backend for a YouTube-like video-sharing platform. It supports:

- User registration & login (with JWT access/refresh tokens in HTTP-only cookies)
- Uploading avatar & cover images to Cloudinary
- Secure password hashing (bcrypt)
- Refresh-token flow and protected routes
- Aggregated data endpoints (e.g., channel profiles, watch history)
- MongoDB (Mongoose) for user, video, comment, subscription, playlist, and like data
- Multer for temporary file storage prior to Cloudinary upload

---

## Table of Contents

1. [Features](#features)  
2. [Prerequisites](#prerequisites)  
3. [Installation](#installation)  
4. [Environment Variables](#environment-variables)  
5. [Running the Server](#running-the-server)  
6. [API Endpoints](#api-endpoints)  
7. [Folder Structure](#folder-structure)  
8. [License](#license)

---

## Features

- **Authentication & Authorization**  
  - Register with avatar + optional cover image  
  - Login via email or username  
  - JWT-based access tokens (short-lived) and refresh tokens (longer-lived), stored in secure HTTP-only cookies  
  - Protected routes with middleware to verify JWT  
  - Refresh endpoint to obtain new access token using refresh token

- **User Profiles**  
  - Update avatar / cover image  
  - Change password  
  - View other user’s channel with subscriber counts and subscription-status

- **Video & Watch History**  
  - “Watch history” endpoint returns an array of video documents with owner info  
  - Mongoose aggregation pipelines for populating nested documents  
  - Video model includes title, description, duration, views, owner, etc.

- **Cloudinary Integration**  
  - Multer temporarily stores uploads under `public/temp`  
  - Utility functions upload local files to Cloudinary, delete them afterward   
  - Automatic cleanup of old Cloudinary resources when updating avatar or cover

- **Error Handling & Responses**  
  - Centralized `ApiError` class and error-handling middleware  
  - Consistent `ApiResponse` wrapper for JSON responses (`{ statusCode, success, data, message }`)

---

## Prerequisites

- Node.js ≥ v14  
- npm or Yarn  
- MongoDB Atlas cluster or local MongoDB  
- Cloudinary account (for client API key/secret)

---

## Installation

1. **Clone the repository**  
   ```bash
   git clone https://github.com/utkarshjain2004/vidtube-backend.git
   cd vidtube-backend
