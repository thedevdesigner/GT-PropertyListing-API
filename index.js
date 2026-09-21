import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import propertyDetails from './routes/propertyDetails.js'
import dotenv  from "dotenv";
dotenv.config()
const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())

// Request logger middleware
app.use((req, res, next) => {
console.log(`${req.method} request to ${req.url}`);
 next();
});


// Mount routes with a prefix
app.use('/api/v1/property', propertyDetails);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`)
});