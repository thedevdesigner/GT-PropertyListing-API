import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import propertyDetails from './routes/propertyDetails.js'
import followups from './routes/followups.js'
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
// Mount routes with a prefix
app.use('/api/v1/followups',followups);
// Express endpoint on your backend
app.get('/api/v1/rightmove/typeahead', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.json({ typeAheadLocations: [] });
    }

    const targetUrl = `https://los.rightmove.co.uk/typeahead?query=${encodeURIComponent(query)}&limit=10&exclude=STREET`;
    
    // Server-to-server request bypasses browser CORS restrictions
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error("Typeahead proxy error:", error);
    return res.status(500).json({ error: "Failed to fetch typeahead suggestions" });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`)
});