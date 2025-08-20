import { AppContext } from ‘../config’
import {
QueryParams,
OutputSchema as AlgoOutput,
} from ‘../lexicon/types/app/bsky/feed/getFeedSkeleton’
import * as localFirst from ‘./local-first’

type AlgoHandler = (ctx: AppContext, params: QueryParams) => Promise<AlgoOutput>

const algos: Record<string, AlgoHandler> = {
[localFirst.shortname]: localFirst.handler,
}

export default algos