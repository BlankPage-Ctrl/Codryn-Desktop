export type ShellExecStream = 'stdout' | 'stderr'

export interface ShellExecLine {
    stream: ShellExecStream
    text: string
    at: number
}

export interface FEShellRunData {
    command: string
    cwd: string
    exitCode: number
    stdout: string
    stderr: string
    stdoutAnsi: string
    stderrAnsi: string
    interleavedAnsi: string
    durationMs: number
    timedOut: boolean
    signal: string | null
    truncated: boolean
    spillPath: string | null
}

export type FEShellExecEvent =
    | {
          type: 'start'
          executionId: string
          toolCallId: string | null
          workspaceId: string | null
          command: string
          cwd: string
      }
    | {
          type: 'chunk'
          executionId: string
          toolCallId: string | null
          workspaceId: string | null
          stream: ShellExecStream
          text: string
          at: number
      }
    | {
          type: 'done'
          executionId: string
          toolCallId: string | null
          workspaceId: string | null
          data: FEShellRunData
      }
    | {
          type: 'error'
          executionId: string
          toolCallId: string | null
          workspaceId: string | null
          code: string
          message: string
      }
