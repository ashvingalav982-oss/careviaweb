CREATE TABLE "sp_applications" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"address" text,
	"education" text,
	"status" text DEFAULT 'Pending Review' NOT NULL,
	"sp_id" text,
	"verified_by" text,
	"created_at" timestamp DEFAULT now(),
	"is_verified" boolean DEFAULT false
);
