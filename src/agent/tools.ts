import { z } from "zod"

export const GetGitDiffArgsSchema = z.object({
  staged: z.boolean().default(false)
})

export const ReadFileArgsSchema = z.object({
  path: z.string().min(1),
  maxBytes: z.number().int().positive().max(50_000).optional()
})

export type GetGitDiffArgs = z.infer<typeof GetGitDiffArgsSchema>
export type ReadFileArgs = z.infer<typeof ReadFileArgsSchema>
