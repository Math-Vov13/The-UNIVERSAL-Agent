--/// Users Table ///------------------------------
-- Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Data for Users
INSERT INTO users (username, email) VALUES
('john_doe', 'john.doe@example.com'),
('jane_smith', 'jane.smith@example.com'),
('Math', 'mathvov.91@outlook.fr');



--/// Conversations Table ///------------------------------
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INT REFERENCES users(id),
    title VARCHAR(100),
    -- conversation_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



--/// Files Table ///------------------------------
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INT REFERENCES users(id),
    conversation_id UUID REFERENCES conversations(id),
    -- file_name VARCHAR(255) NOT NULL,
    -- file_type VARCHAR(50) NOT NULL,
    -- file_size INT NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



--/// Messages Tables ///------------------------------
-- Enums
CREATE TYPE role_type AS ENUM ('user', 'assistant');
CREATE TYPE status_type AS ENUM ('pending', 'completed', 'failed');

-- Table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id),
    role role_type DEFAULT 'user',
    content JSONB,
    -- attachments UUID[] REFERENCES files(id) CHECK (array_length(attachments, 1) <= 5),
    status status_type DEFAULT 'pending',
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



--/// Models Table ///------------------------------
-- Table
CREATE TABLE IF NOT EXISTS models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_name VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    description TEXT,
    tools JSONB,
    capabilities JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Data for Models
INSERT INTO models (key_name, name, provider, description, tools, capabilities) VALUES
('gpt-4', 'GPT-4', 'OpenAI', 'Advanced language model by OpenAI', '[]', '[]'),
('llama-2', 'LLaMA 2', 'Meta', 'Large language model by Meta', '[]', '[]'),
('claude-3', 'Claude 3', 'Anthropic', 'Conversational AI by Anthropic', '[]', '[]'),
('gemini-1', 'Gemini 1', 'Google', 'AI model by Google', '[]', '[]'),
('mistral-1', 'Mistral 1', 'Mistral', 'Open-weight model by Mistral', '[]', '[]'),
('qwen-7b', 'Qwen 7B', 'Alibaba', 'Large language model by Alibaba', '[]', '[]');





--/// Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_files_conversation_id ON files(conversation_id);
CREATE INDEX IF NOT EXISTS idx_models_key_name ON models(key_name);
CREATE INDEX IF NOT EXISTS idx_models_provider ON models(provider);


--/// Functions ///------------------------------
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
        RAISE EXCEPTION 'Conversation % introuvable', p_conversation_id
            USING ERRCODE = 'P0001';
    END IF;

    -- Vérifier droits utilisateur
    IF conv_user_id != p_user_id THEN
        RAISE EXCEPTION 'Accès refusé : la conversation % n’appartient pas à l’utilisateur %',
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
