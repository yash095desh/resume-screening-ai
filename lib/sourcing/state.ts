// lib/sourcing/state.ts
import { Annotation } from "@langchain/langgraph";

export const SourcingStateAnnotation = Annotation.Root({
  // === Job Identity ===
  jobId: Annotation<string>(),
  userId: Annotation<string>(),
  
  // === Job Requirements ===
  rawJobDescription: Annotation<string>(),
  jobRequirements: Annotation<any>(),
  maxCandidates: Annotation<number>(),
  
  // === Search Configuration (NEW - was missing!) ===
  searchFilters: Annotation<any>({
    reducer: (current, update) => update ?? current,
    default: () => null
  }),
  
  // === Search State ===
  searchQueries: Annotation<any[]>({
    reducer: (current, update) => update ?? current,
    default: () => []
  }),
  currentQueryIndex: Annotation<number>({
    reducer: (current, update) => update ?? current,
    default: () => 0
  }),
  searchAttempts: Annotation<number>({
    reducer: (current, update) => update ?? current,
    default: () => 0
  }),
  
  // === Results ===
  profileUrls: Annotation<string[]>({
    reducer: (current, update) => update ?? current,
    default: () => []
  }),
  scrapedProfiles: Annotation<any[]>({
    reducer: (current, update) => update ?? current,
    default: () => []
  }),
  parsedProfiles: Annotation<any[]>({
    reducer: (current, update) => update ?? current,
    default: () => []
  }),
  scoredCandidates: Annotation<any[]>({
    reducer: (current, update) => update ?? current,
    default: () => []
  }),
  
  // === Processing ===
  currentBatch: Annotation<number>({
    reducer: (current, update) => update ?? current,
    default: () => 0
  }),
  batchSize: Annotation<number>({
    reducer: (current, update) => update ?? current,
    default: () => 20
  }),
  
  // === Metadata ===
  errors: Annotation<any[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => []
  }),
  currentStage: Annotation<string>({
    reducer: (current, update) => update ?? current,
    default: () => "CREATED"
  })
});

export type SourcingState = typeof SourcingStateAnnotation.State;
export type SourcingStateUpdate = typeof SourcingStateAnnotation.Update;