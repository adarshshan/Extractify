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
-   **Job Queue:** Redis with BullMQ
-   **File Upload:** `multer`
-   **HTTP Client:** `axios`

## Features

-   **Frontend:**
    -   Upload multi-page PDF files.
    -   Trigger the extraction process.
    -   Display basic processing status (uploading, processing, completed).
    -   View a list of previous uploads and download their Excel reports.
    -   Download the generated Excel (.xlsx) file.
-   **Backend:**
    -   Secure PDF upload endpoint.
    -   Asynchronous PDF processing using job queues and workers (Redis/BullMQ).
    -   Conversion of each PDF page into an image.
    -   Sending each image to the NanoNets OCR API.
    -   Parsing NanoNets response into structured JSON with confidence scores.
    -   Storing extracted structured data in MongoDB.
    -   Storing generated Excel file names in the database for later retrieval.
    -   Generating a structured Excel file from MongoDB records.
    -   Providing an endpoint to list all previously processed records.
    -   Providing an endpoint to download the Excel file.
-   **Accuracy & Data Handling:**
    -   Handles repetitive structured fields across pages.
    -   Ignores or nullifies fields with low confidence (< 0.8).
    -   Normalizes extracted text (trimming).
    -   Ensures structured field mapping consistency.

## Architecture

The application follows a clean architecture with clear separation of concerns. A key enhancement is the introduction of a job queue system:

-   **Controllers:** Handle incoming requests and delegate to services. For PDF extraction, they add jobs to a Redis-backed queue.
-   **Services:** Contain the core business logic, interacting with external APIs and the database.
-   **Job Queues & Workers (Redis/BullMQ):** PDF processing (image conversion, OCR, Excel generation) is offloaded to background workers managed by BullMQ, using Redis as the message broker. This ensures that long-running tasks do not block the main API thread, improving responsiveness and scalability.
-   **Routes:** Define API endpoints.
-   **Models:** Define database schemas.
-   **Utils:** Helper functions for common tasks (e.g., file handling, text normalization).
-   **Config:** Manages environment variables.

Asynchronous operations are heavily utilized with `async/await` and robust error handling throughout the system.

## Setup Instructions

### Prerequisites

-   Node.js (v18 or higher recommended)
-   npm (Node Package Manager)
-   MongoDB instance (local or cloud-hosted)
-   Redis server (local or cloud-hosted)
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

    # Redis (for Job Queue)
    REDIS_HOST=127.0.0.1
    REDIS_PORT=6379
    ```
    -   Replace `YOUR_NANONETS_API_KEY` and `YOUR_NANONETS_MODEL_ID` with your actual NanoNets credentials.
    -   Ensure your MongoDB instance is running and accessible at `MONGO_URI`.
    -   Ensure your Redis server is running and accessible at `REDIS_HOST`:`REDIS_PORT`.

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

1.  Ensure both the backend and frontend servers are running, along with a Redis server.
2.  Open your web browser and navigate to `http://localhost:4200`.

### Uploading a New PDF

1.  On the "Upload" page, click on the "Upload your PDF" area or drag and drop a PDF file.
2.  Once a file is selected, the processing will begin automatically.
3.  The status area will update to "Uploading and processing PDF...", showing progress.
4.  Once the job is completed, the status will show "Extraction complete!" and a "Download Excel Report" button will become active.
5.  Click "Download Excel Report" to download the generated `.xlsx` file directly.

### Accessing Previous Uploads

1.  Navigate to the "Previous Uploads" page using the navigation link.
2.  Here you will see a list of all previously processed PDF files.
3.  Each entry will show the original file name and the upload date.
4.  Click the "Download" button next to any record to download its associated Excel report.

## Explanation of OCR Flow and Accuracy Handling (Asynchronous Processing)

1.  **PDF Upload & Job Creation:** The user uploads a multi-page PDF file via the Angular frontend. The backend receives the PDF and immediately creates a new job in the Redis-backed BullMQ queue, returning a job ID to the frontend for status tracking.
2.  **Worker Processing:** A dedicated background worker picks up the job from the queue.
3.  **PDF to Image Conversion:** The worker uses `pdf2pic` to convert each page of the PDF into a high-resolution PNG image. These images are stored temporarily.
4.  **NanoNets OCR:** Each generated image is sent to the NanoNets OCR API. The API processes the image and returns structured data (labels, OCR text, and confidence scores).
5.  **Data Parsing & Filtering:** The worker parses the NanoNets response. For each extracted field, it checks its confidence score. Fields with confidence below `0.8` (configurable via `CONFIDENCE_THRESHOLD` in `pdfExtraction.worker.ts`) are ignored to maintain accuracy. Text is also normalized (trimmed).
6.  **Data Storage:** The structured and filtered data, along with the original file name and the generated Excel filename, is saved into a MongoDB collection using Mongoose.
7.  **Excel Generation:** From the data stored in MongoDB, `exceljs` is used to generate a clean, structured Excel file. Each row in the Excel sheet represents an extracted record.
8.  **File Download:** The generated Excel file is saved in the `uploads` directory on the backend, and its filename is stored in the database, allowing the frontend to retrieve and download it later.

**Accuracy Target:** The system aims for 90-95% accuracy by leveraging the specialized NanoNets OCR API and implementing confidence-based filtering and text normalization. The accuracy is heavily dependent on the quality of the NanoNets model trained for the specific document type.

## Known Limitations

-   **Error Reporting:** Frontend error messages are basic. More detailed error handling and user feedback mechanisms could be implemented.
-   **NanoNets Model Dependency:** The system relies entirely on a pre-trained NanoNets custom model. The structure and accuracy of the extracted data are directly dependent on the quality and training of this model.
-   **No User Authentication/Authorization:** This project does not include user authentication or authorization. It's intended as a proof-of-concept for data extraction and should not be used in production environments without adding proper security measures.
-   **Limited Document Types:** The system is optimized for structured documents with tables, particularly those for which the NanoNets model has been trained. Its performance on highly unstructured or different document types may vary.
## Running with Docker

This project is fully containerized and can be run using Docker and Docker Compose. This is the recommended way to run the application as it handles all dependencies and services automatically.

### Prerequisites

-   Docker Desktop (or Docker Engine and Docker Compose) installed on your machine.
-   NanoNets account and API Key. You will also need a custom model ID from NanoNets configured for your document type.

### 1. Create Environment File

Create a `.env` file in the `backend` directory and add your environment variables:

```
# MongoDB
MONGO_URI=mongodb://localhost:27017/document-extraction

# NanoNets API
NANONETS_API_KEY=YOUR_NANONETS_API_KEY
NANONETS_MODEL_ID=YOUR_NANONETS_MODEL_ID

# Server Port
PORT=3000

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
```

-   Replace `YOUR_NANONETS_API_KEY` and `YOUR_NANONETS_MODEL_ID` with your actual NanoNets credentials.

### 2. Build and Run the Application

Open a terminal at the root of the project and run the following command:

```bash
docker-compose up --build
```

This command will:
- Build the Docker images for the frontend and backend services.
- Start the frontend, backend, and redis containers.

### 3. Access the Application

-   The frontend will be accessible at `http://localhost:4200`.
-   The backend API will be running on `http://localhost:3000`.

The frontend is configured to proxy API requests to the backend, so you can use the application seamlessly.

### How to Stop the Application

To stop the application, press `Ctrl + C` in the terminal where `docker-compose` is running. To remove the containers, run:

```bash
docker-compose down
```
