ALTER TABLE "files" RENAME COLUMN "conversation_id" TO "message_id";--> statement-breakpoint
ALTER TABLE "models" DROP CONSTRAINT "models_keyName_unique";--> statement-breakpoint
ALTER TABLE "files" DROP CONSTRAINT "files_conversation_id_conversations_id_fk";
--> statement-breakpoint
DROP INDEX "idx_files_conversation_id";--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_conversations_updated_at" ON "conversations" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "idx_files_message_id" ON "files" USING btree ("message_id");--> statement-breakpoint
ALTER TABLE "models" ADD CONSTRAINT "models_key_name_unique" UNIQUE("key_name");