import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/mongodb.js';
import { clerkWebhooks, stripeWebhooks } from './controllers/webhooks.js';
import educatorRouter from './routes/educatorRoutes.js';
import { clerkMiddleware } from '@clerk/express';
import connectCloudinary from './configs/cloudinary.js';
import courseRouter from './routes/courseRoute.js';
import userRouter from './routes/userRoutes.js';

// Initialize Express
const app = express();

const allowedOrigins = ['https://lms1-frontend-five.vercel.app'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true)

      if (allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        console.log(`Origin ${origin} not allowed by CORS`)
        // Don't throw an error, just don't allow the request
        callback(null, false)
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true,
  }),
)


// Connect to Database
await connectDB();
await connectCloudinary();

// Middleware
app.use(express.json()); // Ensure JSON parsing middleware is applied
app.use(clerkMiddleware());

// Routes
app.get('/', (req, res) => res.send('API Working'));
app.post('/clerk', clerkWebhooks);
app.use('/api/educator', educatorRouter);
app.use('/api/course', courseRouter);
app.use('/api/user', userRouter);
app.post('/stripe', express.raw({ type: 'application/json' }), stripeWebhooks);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
