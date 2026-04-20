# Priorité 1
Cache LLM => Redis
Short-Memory => Redis (tool calls, agent calls, etc.) -- FINISH
Long-Memory => Redis (conv history) -- FINISH

Notes:
- toujours le même problème avec les tool calls, le llm oublie sa réponse précédente

# Priorité 2
Store file's vectors => Chroma
Use Auth with JWT and verify Sessions => Redis