CREATE TYPE "public"."roles" AS ENUM('user', 'assistant');
CREATE TYPE "public"."status" AS ENUM('pending', 'completed', 'failed');
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer NOT NULL,
	"title" varchar(100) NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer NOT NULL,
	"message_id" uuid NOT NULL,
	"file_path" varchar(255) NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"role" "roles" DEFAULT 'user' NOT NULL,
	"content" jsonb NOT NULL,
	"status" "status" DEFAULT 'pending' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key_name" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"provider" varchar(100) NOT NULL,
	"description" varchar(255) NOT NULL,
	"tools" jsonb,
	"capabilities" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "models_key_name_unique" UNIQUE("key_name")
);

CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"username" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "files" ADD CONSTRAINT "files_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "files" ADD CONSTRAINT "files_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;
CREATE INDEX "idx_conversations_user_id" ON "conversations" USING btree ("user_id");
CREATE INDEX "idx_conversations_updated_at" ON "conversations" USING btree ("updated_at");
CREATE INDEX "idx_files_message_id" ON "files" USING btree ("message_id");
CREATE INDEX "idx_files_user_id" ON "files" USING btree ("user_id");
CREATE INDEX "idx_messages_conversation_id" ON "messages" USING btree ("conversation_id");
CREATE INDEX "idx_models_key_name" ON "models" USING btree ("key_name");
CREATE INDEX "idx_models_provider" ON "models" USING btree ("provider");



-- Function to get complete conversation history including messages and files
CREATE OR REPLACE FUNCTION get_conversation_history(
    p_conversation_id uuid,
    p_user_id integer,
    p_limit integer DEFAULT 50
)
RETURNS jsonb AS $$
DECLARE
    conv_user_id integer;
    result jsonb;
BEGIN
    -- Vérifier existence de la conversation
    SELECT user_id INTO conv_user_id
    FROM conversations
    WHERE id = p_conversation_id;

    IF conv_user_id IS NULL THEN
        RAISE EXCEPTION 'Conversation % not found', p_conversation_id
            USING ERRCODE = 'P0001';
    END IF;

    -- Vérifier droits utilisateur
    IF conv_user_id != p_user_id THEN
        RAISE EXCEPTION 'Access denied: conversation % does not belong to user %',
            p_conversation_id, p_user_id
            USING ERRCODE = '28000';
    END IF;

    -- Construire la réponse JSON
    SELECT jsonb_build_object(
        'id', c.id,
        'history',
        COALESCE(
            (
                SELECT jsonb_agg(msg ORDER BY (msg->>'timestamp')::timestamptz)
                FROM (
                    SELECT jsonb_build_object(
                        'id', m.id,
                        'role', m.role,
                        'content', m.content,

                        -- Attachments PAR MESSAGE
                        'attachments',
                        COALESCE(
                            (
                                SELECT jsonb_agg(
                                    jsonb_build_object(
                                        'index', rn,
                                        'name', f.metadata ->> 'name',
                                        'size', CASE
                                                    WHEN COALESCE(NULLIF(f.metadata ->> 'size',''), '') = '' THEN NULL
                                                    ELSE (f.metadata ->> 'size')::bigint
                                                END,
                                        'mimeType', f.metadata ->> 'mimeType',
                                        'type', f.metadata ->> 'type',
                                        'uri', f.file_path
                                    )
                                    ORDER BY rn
                                )
                                FROM (
                                    SELECT f.*,
                                           row_number() OVER (ORDER BY f.created_at, f.id) AS rn
                                    FROM files f
                                    WHERE f.message_id = m.id
                                ) f
                            ),
                            '[]'::jsonb
                        ),

                        'status', m.status,
                        'metadata', COALESCE(m.metadata, '{}'::jsonb),
                        'timestamp', to_char(m.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
                    ) AS msg

                    FROM messages m
                    WHERE m.conversation_id = p_conversation_id
                    ORDER BY m.created_at ASC
                    LIMIT p_limit
                ) sub
            ),
            '[]'::jsonb
        )
    )
    INTO result
    FROM conversations c
    WHERE c.id = p_conversation_id;

    RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;



CREATE OR REPLACE FUNCTION add_user_message(
    p_conversation_id uuid,
    p_user_id integer,
    p_content json
)
RETURNS jsonb AS $$
DECLARE
    conv_exists boolean;
    new_msg_id uuid;
    safe_content jsonb;
BEGIN
    -- Vérifier conversation + propriété
    SELECT true INTO conv_exists
    FROM conversations
    WHERE id = p_conversation_id
      AND user_id = p_user_id
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 403,
            'message', 'Access denied or conversation not found'
        );
    END IF;

    -- Cast json -> jsonb
    safe_content := p_content::jsonb;

    INSERT INTO messages (conversation_id, role, content, status, metadata)
    VALUES (
        p_conversation_id,
        'user',
        safe_content,
        'pending',
        '{}'::jsonb
    )
    RETURNING id INTO new_msg_id;

    RETURN jsonb_build_object(
        'success', true,
        'code', 201,
        'message', 'User message added',
        'data', jsonb_build_object('message_id', new_msg_id)
    );
EXCEPTION WHEN others THEN
    RETURN jsonb_build_object(
        'success', false,
        'code', 500,
        'message', 'Server error inserting user message'
    );
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION attach_file_message(
    p_conversation_id uuid,
    p_user_id integer,
    p_message_id uuid,
    p_file_path text,
    p_metadata json
)
RETURNS jsonb AS $$
DECLARE
    conv_exists uuid;
    msg_exists uuid;
    msg_role roles; 
    parsed_metadata jsonb;
    new_file_id uuid;
BEGIN
    SELECT id INTO conv_exists
    FROM conversations
    WHERE id = p_conversation_id
      AND user_id = p_user_id
    LIMIT 1;

    IF conv_exists IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 403,
            'message', 'Access denied or conversation not found'
        );
    END IF;

    SELECT id INTO msg_exists
    FROM messages
    WHERE id = p_message_id
      AND conversation_id = p_conversation_id
    LIMIT 1;

    IF msg_exists IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 404,
            'message', 'Message not found in this conversation'
        );
    END IF;

    SELECT role INTO msg_role
    FROM messages
    WHERE id = p_message_id;

    IF msg_role != 'user' THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 403,
            'message', 'Only messages with role user can receive files'
        );
    END IF;

    parsed_metadata := COALESCE(p_metadata::jsonb, '{}'::jsonb);

    INSERT INTO files (user_id, message_id, file_path, metadata)
    VALUES (p_user_id, p_message_id, p_file_path, parsed_metadata)
    RETURNING id INTO new_file_id;

    RETURN jsonb_build_object(
        'success', true,
        'code', 201,
        'message', 'File attached to message',
        'data', jsonb_build_object('file_id', new_file_id)
    );
EXCEPTION WHEN others THEN
    RETURN jsonb_build_object(
        'success', false,
        'code', 500,
        'message', 'Server error inserting file'
    );
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION add_agent_message(
    p_conversation_id uuid,
    p_user_id integer,
    p_content json
)
RETURNS jsonb AS $$
DECLARE
    conv_exists boolean;
    new_msg_id uuid;
    safe_content jsonb;
BEGIN
    -- Vérifier conversation + propriété
    SELECT true INTO conv_exists
    FROM conversations
    WHERE id = p_conversation_id
      AND user_id = p_user_id
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 403,
            'message', 'Access denied or conversation not found'
        );
    END IF;

    safe_content := p_content::jsonb;

    INSERT INTO messages (conversation_id, role, content, status, metadata)
    VALUES (
        p_conversation_id,
        'assistant',
        safe_content,
        'completed',
        '{}'::jsonb
    )
    RETURNING id INTO new_msg_id;

    RETURN jsonb_build_object(
        'success', true,
        'code', 201,
        'message', 'Agent message added',
        'data', jsonb_build_object('message_id', new_msg_id)
    );
EXCEPTION WHEN others THEN
    RETURN jsonb_build_object(
        'success', false,
        'code', 500,
        'message', 'Server error inserting agent message'
    );
END;
$$ LANGUAGE plpgsql;