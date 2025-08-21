import {
  OutputSchema as RepoEvent,
  isCommit,
} from './lexicon/types/com/atproto/sync/subscribeRepos'
import { FirehoseSubscriptionBase, getOpsByType } from './util/subscription'
import { isLocalFirstPost } from './algos/local-first'

export class FirehoseSubscription extends FirehoseSubscriptionBase {
  async handleEvent(evt: RepoEvent) {
    if (!isCommit(evt)) return
    
    const ops = await getOpsByType(evt)

    const postsToDelete = ops.posts.deletes.map((del) => del.uri)
    const postsToCreate = ops.posts.creates
      .filter((create) => {
        const isRelevant = isLocalFirstPost(create.record.text)
        if (isRelevant) {
          console.log(`📱 Local-first post: ${create.record.text.slice(0, 100)}...`)
        }
        return isRelevant
      })
      .map((create) => ({
        uri: create.uri,
        cid: create.cid,
        indexedAt: new Date().toISOString(),
      }))

    if (postsToDelete.length > 0) {
      await this.db
        .deleteFrom('post')
        .where('uri', 'in', postsToDelete)
        .execute()
    }
    
    if (postsToCreate.length > 0) {
      await this.db
        .insertInto('post')
        .values(postsToCreate.map(post => ({
          uri: post.uri,
          cid: post.cid,
          indexedAt: post.indexedAt,
        })))
        .onConflict((oc) => oc.doNothing())
        .execute()
        
      console.log(`💾 Indexed ${postsToCreate.length} local-first posts`)
    }
  }
}