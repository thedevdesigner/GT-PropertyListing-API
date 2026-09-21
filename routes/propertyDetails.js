import { Router } from 'express';
import { z } from 'zod';
import { getGumTreeListing } from '../functions/getListing.js';
import { getVendorNumber } from '../functions/getVendorNumber.js'

const router = Router()
// GET /api/v1/property
router.get('/', async (req, res,next) => {
  try {

    const result = await getGumTreeListing(req)
      if(result.length == 0){
        return  res.status(200).json({ success: false,
        filters: req.body,
        data: result
      });   
          
      }
    return res.status(200).json({ success: true,
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
router.post('/', async (req, res,next) => {
  try {

    const result = await getGumTreeListing(req)
      if(result.length == 0){
        return  res.status(200).json({ success: false,
        filters: req.body,
        data: result
      });   
          
      }
    return res.status(200).json({ success: true,
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


export default router;