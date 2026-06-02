import type { CompareDocumentsResponse } from '@/types/api-contract'

export const mockCompareResult: CompareDocumentsResponse = {
  objectives: 'Compare Proposal v2.md with Requirement.docx to identify alignment gaps, missing details, and potential conflicts between the project vision and technical specification.',
  scope: 'Analysis covers MVP features, AI capabilities, authentication flow, workspace collaboration, and deployment scope across both documents.',
  similarities: [
    'Both documents define Google OAuth as the sole authentication method with JWT tokens for API access',
    'Shared workspace model with owner/editor/viewer roles is described consistently in both',
    'RAG chat pipeline (question → embedding → pgvector retrieval → Gemini answer) is aligned',
    'Document processing pipeline (upload → extract → chunk → embed → summarize) is consistent',
    'Both agree that MinIO handles file storage and PostgreSQL + pgvector handle structured and vector data',
    'Admin monitoring with job tracking and user management is present in both documents',
  ],
  differences: [
    'Proposal emphasizes report generation as a "demo-critical workflow," while requirements only mention it briefly without elaboration',
    'Proposal describes InsightVault AI as different from Obsidian, while the requirement focuses on technical specification without competitive positioning',
    'Proposal mentions "knowledge graph" as a future feature, which the requirement explicitly places out of scope',
    'Requirements document specifies file size limits and type validation, which the proposal does not detail',
  ],
  missingInformation: [
    'Requirement lacks detailed specification for Markdown report generation — only mentions it exists without defining template, structure, or user flow',
    'Web search integration (webSearchOptions field exists in API contract) is not specified in either document for MVP scope',
    'Error recovery flow for failed document processing is described in requirements but not addressed in proposal',
    'Mobile/tablet responsive breakpoints are referenced in UI spec but not defined in either core document',
  ],
  potentialConflicts: [
    'Proposal states report generation is P0 priority, but requirement does not classify it with any priority level — risk of misaligned team expectations',
    'Proposal mentions "PDF export" in the demo context, while requirement explicitly excludes PDF/DOCX export from MVP — could confuse stakeholders during demo',
    'Requirement says viewer "may use AI chat if system allows" while proposal implies all members can use AI — permission model needs clarification',
  ],
  recommendations: [
    'Add a dedicated section in requirements for report generation covering: report types, input sources, output format (Markdown only), and regeneration flow',
    'Explicitly document that PDF/DOCX export is OUT of MVP scope in both proposal and requirement to prevent stakeholder confusion',
    'Clarify viewer permissions for AI chat in workspace role permission matrix',
    'Add error handling and retry specifications for each AI job type in the requirement document',
    'Consider adding a "Scope Boundaries" section to the proposal that mirrors the requirement out-of-scope list',
  ],
  rawMarkdown: `# Comparison Report: Proposal v2 vs Requirements

## Objectives
Compare project proposal with technical requirements to validate alignment.

## Similarities
- Google OAuth authentication model
- Workspace collaboration roles
- RAG pipeline architecture
- Document processing pipeline
- Infrastructure choices (MinIO, PostgreSQL, pgvector)

## Differences
- Report generation priority
- Competitive positioning
- Knowledge graph scope
- File validation details

## Missing Information
- Report generation specification
- Web search integration scope
- Error recovery flows
- Responsive breakpoint definitions

## Potential Conflicts
- Report generation priority mismatch
- PDF export scope confusion
- Viewer AI chat permissions

## Recommendations
1. Elaborate report generation in requirements
2. Align export scope across documents
3. Clarify viewer permissions
4. Document error handling specifications
5. Add scope boundary sections`,
  reportId: 'report-002',
}
