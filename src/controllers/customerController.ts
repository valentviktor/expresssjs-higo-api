import { Request, Response } from "express";
import Customer, { ICustomer } from "../models/Customer";
import { FilterQuery, SortOrder } from "mongoose";

export const getCustomers = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "Number",
      sortOrder = "asc",
      search = "",
      gender,
      locationType,
      brandDevice,
      digitalInterest,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const query: FilterQuery<ICustomer> = {};

    if (search) {
      query.$or = [
        { Name: { $regex: search, $options: "i" } },
        { Email: { $regex: search, $options: "i" } },
        { "Name of Location": { $regex: search, $options: "i" } },
        { "Brand Device": { $regex: search, $options: "i" } },
      ];
    }

    if (gender) query.gender = gender as string;
    if (locationType) query["Location Type"] = locationType as string;
    if (brandDevice) query["Brand Device"] = brandDevice as string;
    if (digitalInterest) query["Digital Interest"] = digitalInterest as string;

    const sort: { [key: string]: SortOrder } = {};
    sort[sortBy as string] = sortOrder === "desc" ? -1 : 1;

    const [customers, totalCustomers] = await Promise.all([
      Customer.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .setOptions({ allowDiskUse: true }),
      Customer.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: customers,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCustomers / limitNum),
        totalItems: totalCustomers,
        limit: limitNum,
      },
    });
  } catch (error: any) {
    console.error("Error fetching customers:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

export const getGenderSummary = async (req: Request, res: Response) => {
  try {
    const genderData = await Customer.aggregate([
      {
        $group: {
          _id: "$gender",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          gender: "$_id",
          count: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: genderData,
    });
  } catch (error: any) {
    console.error("Error fetching gender summary:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

export const getUniqueFilterValues = async (req: Request, res: Response) => {
  const { field } = req.params;
  try {
    const validFields = [
      "gender",
      "Location Type",
      "Brand Device",
      "Digital Interest",
    ];

    if (!validFields.includes(field)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid filter field" });
    }

    const values = await Customer.distinct(field);
    res
      .status(200)
      .json({
        success: true,
        data: values.filter((v) => v !== null && v !== ""),
      });
  } catch (error: any) {
    console.error(`Error fetching unique values for ${field}:`, error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

export const getGenderAgeSummary = async (req: Request, res: Response) => {
  try {
    const currentYear = new Date().getFullYear();
    const summaryData = await Customer.aggregate([
      {
        $addFields: {
          calculatedAge: { $subtract: [currentYear, "$Age"] },
        },
      },
      {
        $addFields: {
          ageGroup: {
            $switch: {
              branches: [
                {
                  case: {
                    $and: [
                      { $gte: ["$calculatedAge", 0] },
                      { $lte: ["$calculatedAge", 19] },
                    ],
                  },
                  then: "0-19",
                },
                {
                  case: {
                    $and: [
                      { $gte: ["$calculatedAge", 20] },
                      { $lte: ["$calculatedAge", 29] },
                    ],
                  },
                  then: "20-29",
                },
                {
                  case: {
                    $and: [
                      { $gte: ["$calculatedAge", 30] },
                      { $lte: ["$calculatedAge", 39] },
                    ],
                  },
                  then: "30-39",
                },
                {
                  case: {
                    $and: [
                      { $gte: ["$calculatedAge", 40] },
                      { $lte: ["$calculatedAge", 49] },
                    ],
                  },
                  then: "40-49",
                },
                {
                  case: {
                    $and: [
                      { $gte: ["$calculatedAge", 50] },
                      { $lte: ["$calculatedAge", 59] },
                    ],
                  },
                  then: "50-59",
                },
                { case: { $gte: ["$calculatedAge", 60] }, then: "60+" },
              ],
              default: "Unknown",
            },
          },
        },
      },
      {
        $group: {
          _id: { gender: "$gender", ageGroup: "$ageGroup" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          gender: "$_id.gender",
          ageGroup: "$_id.ageGroup",
          count: 1,
        },
      },
      {
        $sort: {
          gender: 1,
          ageGroup: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: summaryData,
    });
  } catch (error: any) {
    console.error("Error fetching gender-age summary:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

export const getBrandDeviceSummary = async (req: Request, res: Response) => {
  try {
    const brandData = await Customer.aggregate([
      {
        $group: {
          _id: "$Brand Device",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          brand: "$_id",
          count: 1,
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: brandData,
    });
  } catch (error: any) {
    console.error("Error fetching brand device summary:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

export const getLoginTrends = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;

    let targetDateFrontendFormat: string;
    let targetDateDbFormat: string;

    if (date) {
      targetDateFrontendFormat = date as string;
      const [year, month, day] = targetDateFrontendFormat.split('-');
      targetDateDbFormat = `${parseInt(month)}/${parseInt(day)}/${year}`;
    } else {
      const latestCustomer = await Customer.findOne().sort({ 'Date': -1 }).limit(1);
      if (latestCustomer && latestCustomer['Date']) {
        targetDateDbFormat = latestCustomer['Date'];
        const [month, day, year] = targetDateDbFormat.split('/');
        targetDateFrontendFormat = `${year}-${parseInt(month).toString().padStart(2, '0')}-${parseInt(day).toString().padStart(2, '0')}`;
      } else {
        return res.status(200).json({
          success: true,
          data: [],
          defaultDate: null
        });
      }
    }

    res.setHeader('X-Default-Date', targetDateFrontendFormat);

    const trends = await Customer.aggregate([
      {
        $match: { 'Date': targetDateDbFormat },
      },
      {
        $addFields: {
          parsedDate: {
            $dateFromString: {
              dateString: '$Date',
              format: "%m/%d/%Y",
              onError: null,
              onNull: null
            }
          }
        }
      },
      {
        $addFields: {
          formattedDateISO: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: '$parsedDate'
            }
          },
          cleanLoginHour: {
            $cond: {
              if: { $eq: [{ $substrBytes: ['$Login Hour', { $subtract: [{ $strLenBytes: '$Login Hour' }, 1] }, 1] }, 'Z'] },
              then: { $substrBytes: ['$Login Hour', 0, { $subtract: [{ $strLenBytes: '$Login Hour' }, 1] }] },
              else: '$Login Hour'
            }
          }
        }
      },
      {
        $addFields: {
          loginDateTime: {
            $dateFromString: {
              dateString: { $concat: ['$formattedDateISO', 'T', '$cleanLoginHour', 'Z'] },
              format: '%Y-%m-%dT%H:%M:%SZ',
              onError: null,
              onNull: null
            }
          },
          hourOfDay: { $hour: { $toDate: { $concat: ['$formattedDateISO', 'T', '$cleanLoginHour', 'Z'] } } }
        }
      },
      {
        $group: {
          _id: {
            hour: '$hourOfDay',
          },
          loginCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          hour: '$_id.hour',
          loginCount: 1,
        },
      },
      {
        $sort: {
          hour: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: trends,
      defaultDate: targetDateFrontendFormat
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};