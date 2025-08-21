import dotenv from 'dotenv'
import { AtpAgent, BlobRef, AppBskyFeedDefs } from '@atproto/api'
import fs from 'fs/promises'
import { ids } from '../src/lexicon/lexicons'

const run = async () => {
  dotenv.config()

  if (!process.env.FEEDGEN_SERVICE_DID && !process.env.FEEDGEN_HOSTNAME) {
    throw new Error('Please provide a hostname in the .env file')
  }

  // Get credentials from environment variables
  const handle = process.env.BLUESKY_HANDLE
  const password = process.env.BLUESKY_APP_PASSWORD

  if (!handle || !password) {
    throw new Error('Please set BLUESKY_HANDLE and BLUESKY_APP_PASSWORD environment variables')
  }

  // Hardcoded feed configuration
  const feedConfig = {
    handle,
    password,
    service: 'https://bsky.social',
    recordName: 'local-first-dev',
    displayName: 'Local-First Software',
    description: 'Discussions about local-first software development, offline-first apps, CRDTs, and data ownership',
    avatar: '', // No avatar
    videoOnly: false
  }

  console.log('🚀 Publishing Local-First Software feed...')
  console.log(`📡 Handle: ${handle}`)
  console.log(`📝 Record: ${feedConfig.recordName}`)
  console.log(`🎯 Display: ${feedConfig.displayName}`)

  const feedGenDid =
    process.env.FEEDGEN_SERVICE_DID ?? `did:web:${process.env.FEEDGEN_HOSTNAME}`

  // Create agent and login
  const agent = new AtpAgent({ service: feedConfig.service })
  await agent.login({ identifier: handle, password })

  console.log('✅ Successfully logged in to Bluesky')

  let avatarRef: BlobRef | undefined
  if (feedConfig.avatar) {
    let encoding: string
    if (feedConfig.avatar.endsWith('png')) {
      encoding = 'image/png'
    } else if (feedConfig.avatar.endsWith('jpg') || feedConfig.avatar.endsWith('jpeg')) {
      encoding = 'image/jpeg'
    } else {
      throw new Error('expected png or jpeg')
    }
    const img = await fs.readFile(feedConfig.avatar)
    const blobRes = await agent.api.com.atproto.repo.uploadBlob(img, {
      encoding,
    })
    avatarRef = blobRes.data.blob
  }

  // Publish the feed
  await agent.api.com.atproto.repo.putRecord({
    repo: agent.session?.did ?? '',
    collection: ids.AppBskyFeedGenerator,
    rkey: feedConfig.recordName,
    record: {
      did: feedGenDid,
      displayName: feedConfig.displayName,
      description: feedConfig.description,
      avatar: avatarRef,
      createdAt: new Date().toISOString(),
      contentMode: feedConfig.videoOnly ? AppBskyFeedDefs.CONTENTMODEVIDEO : AppBskyFeedDefs.CONTENTMODEUNSPECIFIED,
    },
  })

  console.log('🎉 Feed published successfully!')
  console.log(`🔗 Feed URI: at://${agent.session?.did}/app.bsky.feed.generator/${feedConfig.recordName}`)
  console.log(`🌐 Web URL: https://bsky.app/profile/${agent.session?.did}/feed/${feedConfig.recordName}`)
}

run().catch(console.error)