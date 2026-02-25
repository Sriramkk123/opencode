import { type Agent } from "@/agent/agent"
import { PermissionNext } from "@/permission/next"

import PROMPT_ORCHESTRATOR from "./prompt/orchestrator.txt"
import PROMPT_PLANNER from "./prompt/planner.txt"
import PROMPT_WRITER from "./prompt/writer.txt"
import PROMPT_REVIEWER_ARCH from "./prompt/reviewer-arch.txt"
import PROMPT_REVIEWER_CLEAN from "./prompt/reviewer-clean.txt"
import PROMPT_FIX_PLANNER from "./prompt/fix-planner.txt"
import PROMPT_FIX_WRITER from "./prompt/fix-writer.txt"
import PROMPT_FINALIZER from "./prompt/finalizer.txt"

export function createForgeAgents(
  defaults: PermissionNext.Ruleset,
  user: PermissionNext.Ruleset,
): Record<string, Agent.Info> {
  const readOnly = PermissionNext.merge(
    defaults,
    PermissionNext.fromConfig({
      "*": "deny",
      read: "allow",
      glob: "allow",
      grep: "allow",
      list: "allow",
      edit: "allow", // write tool checks "edit" permission — needed for artifact output files
      bash: "deny",  // no shell execution for analysis-only agents
      task: "deny",
      question: "deny",
    }),
    user,
  )

  const writeCapable = PermissionNext.merge(
    defaults,
    PermissionNext.fromConfig({
      question: "deny",
      plan_enter: "deny",
      plan_exit: "deny",
    }),
    user,
  )

  return {
    "forge-orchestrator": {
      name: "forge-orchestrator",
      description:
        "Multi-agent governed code generation. Runs a 6-stage pipeline: Plan → Write → Review → Fix Plan → Fix Write → Finalize, with human approval at each stage.",
      mode: "primary",
      native: true,
      hidden: false,
      temperature: 0.3,
      options: {},
      prompt: PROMPT_ORCHESTRATOR,
      permission: PermissionNext.merge(
        defaults,
        PermissionNext.fromConfig({
          question: "allow",
          plan_enter: "deny",
          plan_exit: "deny",
        }),
        user,
      ),
    },
    "forge-planner": {
      name: "forge-planner",
      description: "Forge AI planning subagent. Analyzes the codebase and produces a structured implementation plan.",
      mode: "subagent",
      native: true,
      hidden: true,
      temperature: 0.2,
      options: {},
      prompt: PROMPT_PLANNER,
      permission: readOnly,
    },
    "forge-writer": {
      name: "forge-writer",
      description: "Forge AI writing subagent. Implements a plan by making all required code changes.",
      mode: "subagent",
      native: true,
      hidden: true,
      temperature: 0.4,
      options: {},
      prompt: PROMPT_WRITER,
      permission: writeCapable,
    },
    "forge-reviewer-arch": {
      name: "forge-reviewer-arch",
      description: "Forge AI architectural reviewer. Reviews code changes for API design and dependency issues.",
      mode: "subagent",
      native: true,
      hidden: true,
      temperature: 0.2,
      options: {},
      prompt: PROMPT_REVIEWER_ARCH,
      permission: readOnly,
    },
    "forge-reviewer-clean": {
      name: "forge-reviewer-clean",
      description: "Forge AI code quality reviewer. Reviews code changes for naming, complexity, and error handling.",
      mode: "subagent",
      native: true,
      hidden: true,
      temperature: 0.2,
      options: {},
      prompt: PROMPT_REVIEWER_CLEAN,
      permission: readOnly,
    },
    "forge-fix-planner": {
      name: "forge-fix-planner",
      description: "Forge AI fix planner. Deduplicates and prioritizes review findings into an ordered fix plan.",
      mode: "subagent",
      native: true,
      hidden: true,
      temperature: 0.2,
      options: {},
      prompt: PROMPT_FIX_PLANNER,
      permission: readOnly,
    },
    "forge-fix-writer": {
      name: "forge-fix-writer",
      description: "Forge AI fix writer. Applies fixes from the fix plan to the codebase.",
      mode: "subagent",
      native: true,
      hidden: true,
      temperature: 0.4,
      options: {},
      prompt: PROMPT_FIX_WRITER,
      permission: writeCapable,
    },
    "forge-finalizer": {
      name: "forge-finalizer",
      description: "Forge AI finalizer. Reads all run artifacts and writes summary.md and metrics.json.",
      mode: "subagent",
      native: true,
      hidden: true,
      temperature: 0.3,
      options: {},
      prompt: PROMPT_FINALIZER,
      permission: readOnly,
    },
  }
}
