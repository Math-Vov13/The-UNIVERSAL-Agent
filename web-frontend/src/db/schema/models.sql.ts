import { pgTable as createTable } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
// import { createSelectSchema } from "drizzle-zod";


// User table
export const modelsTable = createTable(
    "models",
    {
        id: t.uuid().primaryKey().defaultRandom().notNull(),
        keyName: t.varchar("key_name", { length: 255 }).notNull().unique(),
        name: t.varchar({ length: 255 }).notNull(),
        provider: t.varchar({ length: 100 }).notNull(),
        description: t.varchar({ length: 255 }).notNull(),
        tools: t.jsonb(),
        capabilities: t.jsonb(),
        createdAt: t.timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [
        t.index("idx_models_key_name").on(table.keyName),
        t.index("idx_models_provider").on(table.provider),
    ]
);

// export const modelsSchema = createSelectSchema(modelsTable);