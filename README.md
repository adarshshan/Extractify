# PDF to Structured Excel Extraction System

This project provides a full-stack solution to extract structured data from PDF documents using NanoNets OCR API and convert it into a structured Excel (.xlsx) file.

## Tech Stack

-   **Frontend:** Angular (latest stable) with TypeScript
-   **Styling:** Tailwind CSS
-   **Backend:** Node.js with TypeScript (Express)
-   **Database:** MongoDB with Mongoose
-   **AI OCR:** NanoNets OCR API
-   **Excel Generation:** `exceljs`
-   **PDF Processing:** `pdf2pic`
-   **File Upload:** `multer`
-   **HTTP Client:** `axios`

## Features

-   **Frontend:**
    -   Upload multi-page PDF files.
    -   Trigger the extraction process.
    -   Display basic processing status (uploading, processing, completed).
    -   Download the generated Excel (.xlsx) file.
-   **Backend:**
    -   Secure PDF upload endpoint.
    -   Conversion of each PDF page into an image.
    -   Sending each image to the NanoNets OCR API.
    -   Parsing NanoNets response into structured JSON with confidence scores.
    -   Storing extracted structured data in MongoDB.
    -   Generating a structured Excel file from MongoDB records.
    -   Providing an endpoint to download the Excel file.
-   **Accuracy & Data Handling:**
    -   Handles repetitive structured fields across pages.
    -   Ignores or nullifies fields with low confidence (< 0.8).
    -   Normalizes extracted text (trimming).
    -   Ensures structured field mapping consistency.

## Architecture

The application follows a clean architecture with clear separation of concerns:

-   **Controllers:** Handle incoming requests and delegate to services.
-   **Services:** Contain the core business logic, interacting with external APIs and the database.
-   **Routes:** Define API endpoints.
-   **Models:** Define database schemas.
-   **Utils:** Helper functions for common tasks (e.g., file handling, text normalization).
-   **Config:** Manages environment variables.

Asynchronous operations are handled using `async/await` with proper error handling.

## Setup Instructions

### Prerequisites

-   Node.js (v18 or higher recommended)
-   npm (Node Package Manager)
-   MongoDB instance (local or cloud-hosted)
-   NanoNets account and API Key. You will also need a custom model ID from NanoNets configured for your document type.

### 1. Backend Setup

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Install backend dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the `backend` directory and add your environment variables:
    ```
    # MongoDB
    MONGO_URI=mongodb://localhost:27017/document-extraction

    # NanoNets API
    NANONETS_API_KEY=YOUR_NANONETS_API_KEY
    NANONETS_MODEL_ID=YOUR_NANONETS_MODEL_ID

    # Server Port
    PORT=3000
    ```
    -   Replace `YOUR_NANONETS_API_KEY` and `YOUR_NANONETS_MODEL_ID` with your actual NanoNets credentials.
    -   Ensure your MongoDB instance is running and accessible at `MONGO_URI`.

4.  Build and run the backend:
    ```bash
    npm run build
    npm start
    ```
    For development with automatic restarts:
    ```bash
    npm run dev
    ```
    The backend server will start on `http://localhost:3000`.

### 2. Frontend Setup

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install frontend dependencies:
    ```bash
    npm install
    ```
3.  Run the Angular development server:
    ```bash
    ng serve
    ```
    The frontend application will be accessible at `http://localhost:4200` (or another port if 4200 is in use).

## How to Use

1.  Ensure both the backend and frontend servers are running.
2.  Open your web browser and navigate to `http://localhost:4200`.
3.  Click on the "Upload a file" area or drag and drop a PDF file.
4.  Once a file is selected, click the "Upload & Extract" button.
5.  The status will update to "Uploading and processing PDF...".
6.  Upon successful extraction, the status will show "Processing complete" and a "Download Excel" button will become active.
7.  Click "Download Excel" to download the generated `.xlsx` file.

## Explanation of OCR Flow and Accuracy Handling

1.  **PDF Upload:** The user uploads a multi-page PDF file via the Angular frontend.
2.  **PDF to Image Conversion:** The backend receives the PDF and uses `pdf2pic` to convert each page into a high-resolution PNG image. These images are stored temporarily.
3.  **NanoNets OCR:** Each generated image is sent to the NanoNets OCR API. The API processes the image and returns structured data (labels, OCR text, and confidence scores).
4.  **Data Parsing & Filtering:** The backend parses the NanoNets response. For each extracted field, it checks its confidence score. Fields with confidence below `0.8` (configurable via `CONFIDENCE_THRESHOLD` in `extraction.controller.ts`) are ignored to maintain accuracy. Text is also normalized (trimmed).
5.  **Data Storage:** The structured and filtered data, along with the original file name, is saved into a MongoDB collection using Mongoose.
6.  **Excel Generation:** From the data stored in MongoDB, `exceljs` is used to generate a clean, structured Excel file. Each row in the Excel sheet represents an extracted field with its value and confidence.
7.  **File Download:** The generated Excel file is saved in the `uploads` directory on the backend, and its filename (acting as a `reportId`) is returned to the frontend for download.

**Accuracy Target:** The system aims for 90-95% accuracy by leveraging the specialized NanoNets OCR API and implementing confidence-based filtering and text normalization. The accuracy is heavily dependent on the quality of the NanoNets model trained for the specific document type.

## Known Limitations

-   **Synchronous Processing:** The frontend waits for the entire extraction and Excel generation process to complete on the backend. For very large PDFs, this might lead to a longer waiting time without granular progress updates.
-   **Error Reporting:** Frontend error messages are basic. More detailed error handling and user feedback mechanisms could be implemented.
-   **NanoNets Model Dependency:** The system relies entirely on a pre-trained NanoNets custom model. The structure and accuracy of the extracted data are directly dependent on the quality and training of this model.
-   **No User Authentication/Authorization:** This project does not include user management or authentication.
-   **Temporary Files Cleanup:** Temporary image files and uploaded PDFs are cleaned up after processing. Generated Excel files are kept in the `uploads` directory.
-   **`pdf2pic` Dependencies:** While `pdf2pic` is generally cross-platform, it relies on `GraphicsMagick` or `ImageMagick` being installed on the system where the backend runs. Ensure one of these is installed and configured in your environment PATH.

