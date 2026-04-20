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


-- SELECT get_conversation_history('bfd49b34-ebe5-4059-8a6e-dee8006b419e', 1, 10);
-- SELECT attach_file_message('ff7b8c4f-e3ed-4325-808a-889bbf100c52', 1, '67bcfac6-7426-4275-992b-9197120d6075', 'coucou', '{}');
SELECT attach_file_message('ec173de6-dd5b-450d-b810-34e04676a7a4', 1, 'd0225d34-046c-468e-9b65-9f7511e5bd80', 'coucou', '{}');