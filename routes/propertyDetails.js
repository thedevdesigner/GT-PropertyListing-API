import { Router } from 'express';
import { z } from 'zod';
import getRandomDelay from '../utils/getRandomDelay.js';
import { getGumTreeListing,getRightMoveListing} from '../functions/getListing.js';

const router = Router()
// GET /api/v1/property/gumtree
router.all('/gumtree', async (req, res,next) => {
  getRandomDelay(10,30)
  try {
    const result = await getGumTreeListing(req)
      if(result.length == 0){
      return  res.status(200).json(
      { success: false,
        filters: req.body,
        data: result
      });   
          
      }
    return res.status(200).json({
      success: true,
      count: result.length,
      filters: req.body,
      data: result
     });
  }catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Validation Error"
      });
    }
    next(error);
  }
});

// POST /api/v1/property/rightmove
router.post('/rightmove', async (req, res,next) => {
  getRandomDelay(5,12)
  try {

    const result = await getRightMoveListing(req)
      if(result.data.length == 0){
        return  res.status(200).json({ success: false,
        message: "Listings does not exist.",
        data: []
      });   
          
      }
    return res.status(200).json({ success: true,
      filters: req.body,
      data: result
     });
  }catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Validation Error"
      });
    }
    next(error);
  }
});

export default router;