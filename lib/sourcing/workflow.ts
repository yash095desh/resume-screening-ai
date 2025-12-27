// lib/sourcing/workflow.ts
import { StateGraph, START, END } from "@langchain/langgraph";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { SourcingStateAnnotation } from "./state";
import type { SourcingState } from "./state";

import { formatJobDescription } from "./nodes/format-jd";
import { generateSearchQueries } from "./nodes/generate-queries";
import { searchProfiles } from "./nodes/search-profiles";
import { handleNoCandidates } from "./nodes/handle-no-candidates";
import { enrichAndCreateCandidates } from "./nodes/enrich-and-create";
import { scrapeCandidates } from "./nodes/scrape-candidates";
import { parseCandidates } from "./nodes/parse-candidates";
import { updateCandidates } from "./nodes/updates-candidate";
import { scoreAllCandidates } from "./nodes/score-batch";


let checkpointer: PostgresSaver | null = null;

async function getCheckpointer() {
  if (!checkpointer) {
    checkpointer = PostgresSaver.fromConnString(process.env.DATABASE_URL!);
    await checkpointer.setup();
  }
  return checkpointer;
}

export async function createSourcingWorkflow() {
  const graph = new StateGraph(SourcingStateAnnotation)
    .addNode("format_jd", formatJobDescription)
    .addNode("generate_queries", generateSearchQueries)
    .addNode("search_profiles", searchProfiles)
    .addNode("enrich_and_create", enrichAndCreateCandidates)
    .addNode("scrape_candidates", scrapeCandidates)
    .addNode("parse_candidates", parseCandidates)
    .addNode("update_candidates", updateCandidates)
    .addNode("score_all", scoreAllCandidates)
    .addNode("handle_no_candidates", handleNoCandidates);

  // Linear start
  graph.addEdge(START, "format_jd");
  graph.addEdge("format_jd", "generate_queries");
  graph.addEdge("generate_queries", "search_profiles");

  // After search, always enrich
  graph.addEdge("search_profiles", "enrich_and_create");

  // After enrich, check if we need more candidates
  graph.addConditionalEdges(
    "enrich_and_create",
    (state: SourcingState) => {
      const current = state.candidatesWithEmails || 0;
      const target = state.maxCandidates;
      
      if (current >= target) {
        return "scrape";
      }
      
      if (state.searchIterations >= 3) {
        return "no_candidates";
      }
      
      return "search_again";
    },
    {
      scrape: "scrape_candidates",
      search_again: "search_profiles",
      no_candidates: "handle_no_candidates"
    }
  );

  graph.addEdge("scrape_candidates", "parse_candidates");
  graph.addEdge("parse_candidates", "update_candidates");
  graph.addEdge("update_candidates", "score_all");
  graph.addEdge("score_all", END);
  graph.addEdge("handle_no_candidates", END);

  const cp = await getCheckpointer();
  return graph.compile({ checkpointer: cp });
}