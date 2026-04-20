import { pgEnum, pgTable as createTable } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { usersTable } from "./users.sql";


// Conversation table
export const conversationsTable = createTable(
    "conversations",
    {
        id: t.uuid().primaryKey().defaultRandom().notNull(),
        ownerId: t.integer("user_id").references(() => usersTable.id).notNull(),
        title: t.varchar({ length: 100 }).notNull(),
        updatedAt: t.timestamp("updated_at").defaultNow().notNull(),
        createdAt: t.timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [
        t.index("idx_conversations_user_id").on(table.ownerId),
        t.index("idx_conversations_updated_at").on(table.updatedAt),
    ]
);


// Files table
export const filesTable = createTable(
    "files",
    {
        id: t.uuid().primaryKey().defaultRandom().notNull(),
        ownerId: t.integer("user_id").references(() => usersTable.id).notNull(),
        messageId: t.uuid("message_id").references(() => messagesTable.id).notNull(),
        filePath: t.varchar("file_path", { length: 255 }).notNull(),
        metadata: t.jsonb(),
        createdAt: t.timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [
        t.index("idx_files_message_id").on(table.messageId),
        t.index("idx_files_user_id").on(table.ownerId),
    ]
);


// Messages table
export const rolesEnum = pgEnum("roles", ["user", "assistant"]);
export const statusEnum = pgEnum("status", ["pending", "completed", "failed"]);

export const messagesTable = createTable(
    "messages",
    {
        id: t.uuid().primaryKey().defaultRandom().notNull(),
        conversationId: t.uuid("conversation_id").references(() => conversationsTable.id).notNull(),
        role: rolesEnum().default("user").notNull(),
        content: t.jsonb().notNull(),
        status: statusEnum().default("pending").notNull(),
        metadata: t.jsonb(),
        createdAt: t.timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [
        t.index("idx_messages_conversation_id").on(table.conversationId),
    ]
);