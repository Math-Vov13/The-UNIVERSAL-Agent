import { integer, varchar, timestamp, pgTable as createTable } from "drizzle-orm/pg-core";
// import { createSchemaFactory } from "drizzle-zod";
// import z from "zod";


// User table
export const usersTable = createTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  username: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// const { createInsertSchema } = createSchemaFactory({ zodInstance: z });
// const insertUserSchema = createInsertSchema(usersTable, {
//   id: (schema) => schema.positive(),
//   email: (schema) => schema.email(),
// });