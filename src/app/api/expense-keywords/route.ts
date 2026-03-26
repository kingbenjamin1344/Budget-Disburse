import { NextResponse } from 'next/server';

/**
 * API endpoint that returns keywords mapping for expense categories
 * This enables dynamic keyword detection without hardcoding in the component
 */

// Keyword mapping for LGU categorization
// Maps category names (PS, MOOE, CO) to their associated keywords
const CATEGORY_KEYWORDS = {
  PS: {
    name: "Personal Services",
    keywords: [
      "personal services",
      "salary",
      "wage",
      "honorarium",
      "compensation",
      "allowance",
      "benefit",
      "payroll",
      "employee",
      "staff",
      "personnel",
      "remuneration",
    ],
  },
  MOOE: {
    name: "Maintenance and Other Operating Expenses",
    keywords: [
      "maintenance",
      "repair",
      "repairs",
      "utilities",
      "office supplies",
      "consumables",
      "transportation",
      "travel",
      "communication",
      "internet",
      "electricity",
      "water",
      "security",
      "janitorial",
      "cleaning",
      "supplies",
      "operating",
      "expense",
      "mooe",
    ],
  },
  CO: {
    name: "Capital Outlay",
    keywords: [
      "capital outlay",
      "equipment",
      "construction",
      "purchase",
      "asset",
      "capital",
      "building",
      "infrastructure",
      "machine",
      "property",
      "facility",
      "improvement",
      "vehicle",
      "computer",
      "hardware",
      "fixture",
      "demolition",
      "rehabilitation",
    ],
  },
};

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      keywords: CATEGORY_KEYWORDS,
    });
  } catch (error) {
    console.error("[Expense Keywords API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch keywords" },
      { status: 500 }
    );
  }
}
