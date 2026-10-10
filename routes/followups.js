import { Router } from "express";
import Joi from "joi";
import { db } from "../db/index.js";
import { followUps } from "../db/schema.js";
import { eq } from "drizzle-orm";

const router = Router();

// Define allowed status values to keep validation schemas DRY
const ALLOWED_STATUSES = [
  "pending",
  "no_answer",
  "callback",
  "sa_pending",
  "sa_allowed",
  "viewing_booked",
  "rejected",
  "not_interested"
];

// Validation Schema for Creating/Upserting a Follow-Up
const createFollowUpSchema = Joi.object({
  id: Joi.string().required(),
  title: Joi.string().required(),
  price: Joi.string().allow("").default("POA"),
  location: Joi.string().allow("").default("UK"),
  phone: Joi.string().allow("").default(""),
  url: Joi.string().uri().allow("").default(""),
  imageUrl: Joi.string().uri().allow("").default(""),
  status: Joi.string().valid(...ALLOWED_STATUSES).default("pending"),
  attempts: Joi.number().min(0).max(3).default(0),
  notes: Joi.string().allow("").default(""),
  dateAdded: Joi.string().default(() => new Date().toISOString()),
});

// Validation Schema for Patching CRM Fields
const updateFollowUpSchema = Joi.object({
  status: Joi.string().valid(...ALLOWED_STATUSES),
  attempts: Joi.number().min(0).max(3),
  notes: Joi.string().allow("")
}).min(1);

// Root Collection Routes: GET & POST
// GET: Recovery layer when localStorage is cleared
router.get('/', async (req, res, next) => {
  try {
    // 1. Inspect what tables actually exist in THIS connection
    const tableCheck = await db.run("SELECT name FROM sqlite_master WHERE type='table';");
    console.log("--> TABLES CURRENTLY IN THIS TURSO INSTANCE:", tableCheck.rows);
    const records = await db.select().from(followUps);
    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    console.error("--> DETAILED QUERY ERROR:", error);
    next(error);
  }
});

// POST: Background sync from Local Storage to Turso
router.post('/', async (req, res, next) => {
  try {
    const { error, value } = createFollowUpSchema.validate(req.body, { abortEarly: false });

    if (error) {
      return res.status(400).json({
        success: false,
        error: "Validation Error",
        details: error.details.map((d) => d.message),
      });
    }

    // Ensure dateAdded is populated explicitly
    const insertPayload = {
      id: value.id,
      title: value.title,
      price: value.price,
      location: value.location,
      phone: value.phone,
      url: value.url,
      imageUrl: value.imageUrl,
      status: value.status,
      attempts: value.attempts,
      notes: value.notes,
      dateAdded: value.dateAdded || new Date().toISOString(),
    };

    const result = await db
      .insert(followUps)
      .values(insertPayload)
      .onConflictDoUpdate({
        target: followUps.id,
        set: {
          status: insertPayload.status,
          attempts: insertPayload.attempts,
          notes: insertPayload.notes,
        },
      })
      .returning();

    return res.status(201).json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    next(error);
  }
});

// PATCH Route: Update CRM fields for a specific property ID
router.patch("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Validate payload
    const { error, value } = updateFollowUpSchema.validate(req.body, { abortEarly: false });

    if (error) {
      return res.status(400).json({
        success: false,
        error: "Validation Error",
        details: error.details.map((d) => d.message),
      });
    }

    // 2. Perform database update
    const updated = await db
      .update(followUps)
      .set(value)
      .where(eq(followUps.id, id))
      .returning();

    // 3. Handle non-existent ID
    if (updated.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Follow-up record not found",
      });
    }

    // 4. Return updated record
    return res.status(200).json({
      success: true,
      data: updated[0],
    });
  } catch (error) {
    next(error);
  }
});

// DELETE: Remove record from CRM
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await db
      .delete(followUps)
      .where(eq(followUps.id, id))
      .returning();

    if (deleted.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Follow-up record not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Record removed successfully",
    });
  } catch (error) {
    next(error);
  }
});

export default router;