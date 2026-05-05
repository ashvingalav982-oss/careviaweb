import { pgTable, serial, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const spApplications = pgTable("sp_applications", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  address: text("address"),
  education: text("education"),
  status: text("status").notNull().default("Pending Review"),
  spId: text("sp_id"),
  verifiedBy: text("verified_by"),
  createdAt: timestamp("created_at").defaultNow(),
  isVerified: boolean("is_verified").default(false),
  aadhaarBlobKey: text("aadhaar_blob_key"),
  panBlobKey: text("pan_blob_key"),
});
