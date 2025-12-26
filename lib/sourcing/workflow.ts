// lib/sourcing/workflow.ts
import { StateGraph, START, END } from "@langchain/langgraph";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { SourcingStateAnnotation } from "./state";
import type { SourcingState } from "./state";

import { formatJobDescription } from "./nodes/format-jd";
import { generateSearchQueries } from "./nodes/generate-queries";
import { 
  searchWithPreciseQuery, 
  searchWithBroadQuery, 
  searchWithAlternativeQuery 
} from "./nodes/search-profiles";

import { handleNoCandidates } from "./nodes/handle-no-candidates";
import { scrapeAllProfiles } from "./nodes/scrape-batch";
import { parseAllProfiles } from "./nodes/parse-batch";
import { saveAllCandidates } from "./nodes/save-batch";
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
    .addNode("search_precise", searchWithPreciseQuery)
    .addNode("search_broad", searchWithBroadQuery)
    .addNode("search_alternative", searchWithAlternativeQuery)
    .addNode("scrape_all", scrapeAllProfiles)
    .addNode("parse_all", parseAllProfiles)
    .addNode("save_all", saveAllCandidates)
    .addNode("score_all", scoreAllCandidates)
    .addNode("handle_no_candidates", handleNoCandidates);

  // Linear flow
  graph.addEdge(START, "format_jd");
  graph.addEdge("format_jd", "generate_queries");
  graph.addEdge("generate_queries", "search_precise");

  // Search phase routing
  graph.addConditionalEdges(
    "search_precise",
    (state: SourcingState) => {
      if (state.profileUrls.length >= state.maxCandidates) return "scrape";
      if (state.searchAttempts < 3) return "broad";
      return "no_candidates";
    },
    {
      scrape: "scrape_all",
      broad: "search_broad",
      no_candidates: "handle_no_candidates"
    }
  );

  graph.addConditionalEdges(
    "search_broad",
    (state: SourcingState) => {
      return state.profileUrls.length > state.maxCandidates ? "scrape" : "alternative";
    },
    {
      scrape: "scrape_all",
      alternative: "search_alternative"
    }
  );

  graph.addConditionalEdges(
    "search_alternative",
    (state: SourcingState) => {
      return state.profileUrls.length > state.maxCandidates ? "scrape" : "no_candidates";
    },
    {
      scrape: "scrape_all",
      no_candidates: "handle_no_candidates"
    }
  );

  // Processing pipeline - simple linear flow
  graph.addEdge("scrape_all", "parse_all");
  graph.addEdge("parse_all", "save_all");
  graph.addEdge("save_all", "score_all");
  graph.addEdge("score_all", END);
  graph.addEdge("handle_no_candidates", END);

  const cp = await getCheckpointer();
  return graph.compile({ checkpointer: cp });
}