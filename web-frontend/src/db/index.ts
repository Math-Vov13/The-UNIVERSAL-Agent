import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres'
import { usersTable } from './schema/users.sql';
import { modelsTable } from './schema/models.sql';


const connectionString = process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@localhost:5432/placeholder';


// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false })
export const db = drizzle(client);


async function insertRows() {
    try {
        await db.insert(usersTable).values([{ username: 'Alice', email: 'alice@example.com' }, { username: 'Bob', email: 'bob@example.com' }]);
        console.log('Users inserted');
    } catch (e) {
        console.log('Users already exist, skipping insertion.', e);
    }
    try {
        await db.insert(modelsTable).values([
            { keyName: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', description: 'Advanced language model by OpenAI', tools: '[]', capabilities: '[]' },
            { keyName: 'llama-2', name: 'LLaMA 2', provider: 'Meta', description: 'Large language model by Meta', tools: '[]', capabilities: '[]' },
            { keyName: 'claude-3', name: 'Claude 3', provider: 'Anthropic', description: 'Conversational AI by Anthropic', tools: '[]', capabilities: '[]' },
            { keyName: 'gemini-1', name: 'Gemini 1', provider: 'Google', description: 'AI model by Google', tools: '[]', capabilities: '[]' },
            { keyName: 'mistral-1', name: 'Mistral 1', provider: 'Mistral', description: 'Open-weight model by Mistral', tools: '[]', capabilities: '[]' },
            { keyName: 'qwen-7b', name: 'Qwen 7B', provider: 'Alibaba', description: 'Large language model by Alibaba', tools: '[]', capabilities: '[]' },
        ]);
        console.log('Models inserted');
    } catch (e) {
        console.log('Models already exist, skipping insertion.', e);
    }
    console.log('Default rows inserted !');
}

if (db) setTimeout(insertRows, 6000); // Delay to ensure tables are created before insertion
// const connectionString = process.env.DATABASE_URL
// console.log('Database URL:', connectionString);
// export const db = drizzle({ connection: connectionString, casing: 'snake_case' })


// async function main() {
//   const user: typeof usersTable.$inferInsert = {
//     username: 'John',
//     email: 'john@example.com',
//   };

//   await db.insert(usersTable).values(user);
//   console.log('New user created!')
// }

// main();
