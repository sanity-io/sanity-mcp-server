import {env} from '../config/env.js'

export const tokenLimit = env.data?.MAX_TOOL_TOKEN_OUTPUT || 4096 // Default is defined in env schema
