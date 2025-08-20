import { QueryParams } from ‘../lexicon/types/app/bsky/feed/getFeedSkeleton’
import { AppContext } from ‘../config’

export const shortname = ‘local-first’

export const handler = async (ctx: AppContext, params: QueryParams) => {
const builder = await ctx.db
.selectFrom(‘post’)
.selectAll()
.orderBy(‘indexedAt’, ‘desc’)
.orderBy(‘cid’, ‘desc’)
.limit(params.limit ?? 50)

if (params.cursor) {
const timeStr = new Date(parseInt(params.cursor, 10)).toISOString()
builder.where(‘post.indexedAt’, ‘<’, timeStr)
}

const res = await builder.execute()
const feed = res.map((row) => ({ post: row.uri }))

let cursor: string | undefined
const last = res.at(-1)
if (last) {
cursor = new Date(last.indexedAt).getTime().toString(10)
}

return {
encoding: ‘application/json’,
body: { cursor, feed },
}
}

// Keywords for local-first software
const KEYWORDS = [
‘local-first’, ‘localfirst’, ‘local first’,
‘offline-first’, ‘offline first’, ‘offline app’,
‘data ownership’, ‘own your data’,
‘CRDT’, ‘conflict-free replicated’,
‘sync engine’, ‘data sync’,
‘SQLite browser’, ‘browser database’,
‘WebAssembly’, ‘WASM’,
‘electric sql’, ‘electricsql’,
‘ditto’, ‘ink & switch’,
‘actual budget’, ‘linear app’,
‘automerge’, ‘yjs’, ‘replicache’,
‘martin kleppmann’, ‘adam wiggins’,
‘collaborative editing’,
‘peer to peer’, ‘p2p app’,
‘distributed systems’
]

export function isLocalFirstPost(text: string): boolean {
const lower = text.toLowerCase()
return KEYWORDS.some(keyword => lower.includes(keyword.toLowerCase()))
}