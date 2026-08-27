import { SessionRecord } from "@/services/storage";
import { TodoItem } from "@/components/todo/types";

export function generateSampleStatsData(): {
  sessions: SessionRecord[];
  todos: TodoItem[];
} {
  const now = Date.now();
  const dayMs = 86400000;

  const sampleSessions: SessionRecord[] = [
    {
      id: `sample_s1_${now}`,
      createdAt: now - 3600000 * 2, // 2 hours ago
      title: "UI Architecture & React Refactor",
      cyclesCompleted: 4,
      targetCycles: 4,
      sprintsCompleted: 4,
      targetSprints: 4,
      focusMinutes: 100,
      overtimeMinutes: 12,
      notes: "Completed HeroUI v3 integration and refactored state management.",
    },
    {
      id: `sample_s2_${now}`,
      createdAt: now - 3600000 * 5, // 5 hours ago
      title: "Design System Tokens",
      cyclesCompleted: 2,
      targetCycles: 2,
      sprintsCompleted: 2,
      targetSprints: 2,
      focusMinutes: 50,
      overtimeMinutes: 0,
      notes: "Standardized OKLCH theme colors and smooth animations.",
    },
    {
      id: `sample_s3_${now}`,
      createdAt: now - dayMs * 1 - 3600000 * 3, // Yesterday
      title: "Deep Algorithm Practice",
      cyclesCompleted: 3,
      targetCycles: 4,
      sprintsCompleted: 3,
      targetSprints: 4,
      focusMinutes: 75,
      overtimeMinutes: 5,
      notes: "Solved dynamic programming graph problems.",
    },
    {
      id: `sample_s4_${now}`,
      createdAt: now - dayMs * 1 - 3600000 * 7, // Yesterday afternoon
      title: "API Endpoint Optimization",
      cyclesCompleted: 2,
      targetCycles: 2,
      sprintsCompleted: 2,
      targetSprints: 2,
      focusMinutes: 50,
      notes: "Reduced response latency by 40% with caching.",
    },
    {
      id: `sample_s5_${now}`,
      createdAt: now - dayMs * 2 - 3600000 * 4, // 2 days ago
      title: "Product Documentation & Guides",
      cyclesCompleted: 3,
      targetCycles: 3,
      sprintsCompleted: 3,
      targetSprints: 3,
      focusMinutes: 75,
      overtimeMinutes: 8,
      notes: "Wrote developer onboarding instructions and component specs.",
    },
    {
      id: `sample_s6_${now}`,
      createdAt: now - dayMs * 3 - 3600000 * 2, // 3 days ago
      title: "Database Schema Migrations",
      cyclesCompleted: 4,
      targetCycles: 4,
      sprintsCompleted: 4,
      targetSprints: 4,
      focusMinutes: 100,
      notes: "Indexed frequent queries and audited connection pooling.",
    },
    {
      id: `sample_s7_${now}`,
      createdAt: now - dayMs * 4 - 3600000 * 5, // 4 days ago
      title: "Creative Exploration & Moodboard",
      cyclesCompleted: 2,
      targetCycles: 2,
      sprintsCompleted: 2,
      targetSprints: 2,
      focusMinutes: 50,
      notes: "Gathered inspiration for ambient soundscapes and warm palettes.",
    },
    {
      id: `sample_s8_${now}`,
      createdAt: now - dayMs * 5 - 3600000 * 6, // 5 days ago
      title: "Bug Triage & Edge Cases",
      cyclesCompleted: 3,
      targetCycles: 3,
      sprintsCompleted: 3,
      targetSprints: 3,
      focusMinutes: 75,
      notes: "Fixed timer drift on background tab switches.",
    },
    {
      id: `sample_s9_${now}`,
      createdAt: now - dayMs * 6 - 3600000 * 3, // 6 days ago
      title: "Weekly Review & Project Planning",
      cyclesCompleted: 2,
      targetCycles: 2,
      sprintsCompleted: 2,
      targetSprints: 2,
      focusMinutes: 50,
      notes: "Prioritized milestones for next development cycle.",
    },
    {
      id: `sample_s10_${now}`,
      createdAt: now - dayMs * 7 - 3600000 * 4, // 7 days ago
      title: "Frontend Unit Tests",
      cyclesCompleted: 3,
      targetCycles: 3,
      sprintsCompleted: 3,
      targetSprints: 3,
      focusMinutes: 75,
      notes: "Added testing suite for timer rules and cycle calculations.",
    },
    {
      id: `sample_s11_${now}`,
      createdAt: now - dayMs * 9 - 3600000 * 2, // 9 days ago
      title: "Study: Web Audio API Synthesis",
      cyclesCompleted: 4,
      targetCycles: 4,
      sprintsCompleted: 4,
      targetSprints: 4,
      focusMinutes: 100,
      notes:
        "Deep dive into binaural beats and ambient white noise generation.",
    },
    {
      id: `sample_s12_${now}`,
      createdAt: now - dayMs * 11 - 3600000 * 5, // 11 days ago
      title: "Performance & Bundle Size Audit",
      cyclesCompleted: 2,
      targetCycles: 2,
      sprintsCompleted: 2,
      targetSprints: 2,
      focusMinutes: 50,
      notes: "Trimmed unused imports and enabled compression.",
    },
  ];

  const sampleTodos: TodoItem[] = [
    {
      id: `sample_t1_${now}`,
      title: "Review pull requests and ship release notes",
      completed: true,
      createdAt: now - dayMs * 1,
      completedAt: now - 3600000 * 2,
      priority: "high",
      tag: "work",
      notes: "Verified changelog formatting and assets.",
    },
    {
      id: `sample_t2_${now}`,
      title: "Read Chapter 4: Modern Distributed Systems",
      completed: true,
      createdAt: now - dayMs * 2,
      completedAt: now - dayMs * 1,
      priority: "medium",
      tag: "study",
      notes: "Highlight key consensus protocols.",
    },
    {
      id: `sample_t3_${now}`,
      title: "Sketch wireframes for ambient cozy sound generator",
      completed: true,
      createdAt: now - dayMs * 3,
      completedAt: now - dayMs * 2,
      priority: "medium",
      tag: "creative",
    },
    {
      id: `sample_t4_${now}`,
      title: "Evening meditation and stretching session",
      completed: true,
      createdAt: now - dayMs * 4,
      completedAt: now - dayMs * 3,
      priority: "low",
      tag: "personal",
    },
    {
      id: `sample_t5_${now}`,
      title: "Implement responsive activity heatmap component",
      completed: true,
      createdAt: now - 3600000 * 6,
      completedAt: now - 3600000 * 1,
      priority: "high",
      tag: "work",
    },
    {
      id: `sample_t6_${now}`,
      title: "Configure custom OKLCH color engine",
      completed: true,
      createdAt: now - dayMs * 5,
      completedAt: now - dayMs * 4,
      priority: "high",
      tag: "creative",
    },
  ];

  return { sessions: sampleSessions, todos: sampleTodos };
}
