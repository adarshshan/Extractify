import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import { config } from "./config";
import { connectToDB } from "./services/db.service";
import extractionRoutes from "./routes/extraction.routes";

const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files for downloads
app.use("/downloads", express.static("uploads"));

// Routes
app.use("/api", extractionRoutes);

// Health check
app.get("/", (req: Request, res: Response) => {
  res.send("PDF Extraction Service is running.");
});

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ message: "Something went wrong!", error: err.message });
});

const startServer = async () => {
  await connectToDB();
  app.listen(config?.port, () => {
    console.log(`Server is running on http://localhost:${config?.port}`);
  });
};

startServer();
