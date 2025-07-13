import { Router } from "express";
import {
  getCustomers,
  getGenderSummary,
  getUniqueFilterValues,
  getGenderAgeSummary,
  getBrandDeviceSummary,
  getLoginTrends,
} from "../controllers/customerController";

const router = Router();

router.get("/customers", getCustomers);
router.get("/customers/summary/gender", getGenderSummary);
router.get("/customers/summary/gender-age", getGenderAgeSummary);
router.get("/customers/summary/brand-device", getBrandDeviceSummary);
router.get("/customers/trends/login", getLoginTrends);
router.get("/customers/filters/:field", getUniqueFilterValues);

export default router;
