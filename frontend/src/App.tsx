import './App.css'

const activityNav = [
  { label: 'Explorer', icon: 'M3 5h18M3 12h18M3 19h18', active: true },
  { label: 'Search', icon: 'm21 21-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z' },
  { label: 'Graph', icon: 'M6 7a3 3 0 1 0 0 .1M18 17a3 3 0 1 0 0 .1M18 7a3 3 0 1 0 0 .1M8.5 8.5l7 7M15.5 8.5l-7 7' },
  { label: 'Reports', icon: 'M7 3h7l5 5v13H7zM14 3v6h5M10 14h6M10 18h4' },
  { label: 'Admin', icon: 'M12 3l7 4v5c0 4.4-2.9 7.8-7 9-4.1-1.2-7-4.6-7-9V7z' },
]

const folders = [
  {
    name: 'Product Discovery',
    docs: [
      { name: 'Requirement.docx', type: 'DOCX', active: true },
      { name: 'Proposal v2.md', type: 'MD' },
      { name: 'Sprint demo script.md', type: 'MD' },
    ],
  },
  {
    name: 'Research Papers',
    docs: [
      { name: 'RAG evaluation.pdf', type: 'PDF' },
      { name: 'Gemini fallback notes.txt', type: 'TXT' },
    ],
  },
  {
    name: 'Reports',
    docs: [
      { name: 'MVP gap analysis.md', type: 'AI' },
      { name: 'Stakeholder summary.md', type: 'AI' },
    ],
  },
]

const openTabs = ['Requirement.docx', 'Proposal v2.md', 'Compare: Proposal vs Requirement', 'Report: MVP Summary']

const quickFacts = [
  { label: 'Team scope', value: 'SWD Team Workspace', detail: 'Owner, editor, viewer permissions filter every AI query.' },
  { label: 'AI coverage', value: '4 analyst modes', detail: 'Q&A, compare, gap detection, and report generation.' },
  { label: 'Source quality', value: '18 chunks cited', detail: 'Every answer keeps document, section, chunk, and score visible.' },
]

const aiModes = [
  { label: 'Ask', active: true },
  { label: 'Compare', active: false },
  { label: 'Gap', active: false },
  { label: 'Report', active: false },
]

const citations = [
  { source: 'Requirement.docx', detail: 'chunk 09', score: '0.86' },
  { source: 'PROJECT_FEATURES_MVP.md', detail: 'section 21', score: '0.81' },
  { source: 'Proposal v2.md', detail: 'heading 4', score: '0.74' },
]

const teamMembers = [
  { name: 'Minh', role: 'Owner', status: 'Reviewing report' },
  { name: 'Lan', role: 'Editor', status: 'Uploaded proposal' },
  { name: 'Khoa', role: 'Viewer', status: 'Asked workspace AI' },
]

const jobs = [
  { label: 'Meeting note 06.txt', value: '42%', tone: 'warning' },
  { label: 'Research paper.pdf', value: 'Failed', tone: 'danger' },
  { label: 'Requirement.docx', value: 'Ready', tone: 'success' },
]

const relatedNodes = ['Requirement', 'Proposal', 'MVP report', 'Meeting notes', 'RAG scope']

function Icon({ path }: { path: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  )
}

function App() {
  return (
    <div className="knowledge-ide">
      <aside className="activity-rail" aria-label="Primary navigation">
        <div className="brand-mark" aria-label="InsightVault AI">
          IV
        </div>
        <nav>
          {activityNav.map((item) => (
            <button className={item.active ? 'rail-button active' : 'rail-button'} type="button" key={item.label} aria-label={item.label} title={item.label}>
              <Icon path={item.icon} />
            </button>
          ))}
        </nav>
      </aside>

      <header className="topbar">
        <div className="workspace-switcher">
          <span>Team workspace</span>
          <strong>InsightVault AI Project</strong>
        </div>
        <button className="command-palette" type="button" aria-label="Open command palette">
          <Icon path="M4 7h16M4 12h10M4 17h7" />
          <span>Ask workspace, compare documents, generate report...</span>
          <kbd>Ctrl K</kbd>
        </button>
        <div className="top-actions">
          <button type="button" className="ghost-button">
            Invite
          </button>
          <button type="button" className="primary-button">
            Upload
          </button>
        </div>
      </header>

      <aside className="explorer" aria-label="Workspace explorer">
        <section className="explorer-block">
          <div className="section-label">Vaults</div>
          <button className="workspace-row active" type="button">
            <span>InsightVault AI Project</span>
            <b>owner</b>
          </button>
          <button className="workspace-row" type="button">
            <span>SWD Team Workspace</span>
            <b>editor</b>
          </button>
          <button className="workspace-row" type="button">
            <span>Personal Research</span>
            <b>private</b>
          </button>
        </section>

        <section className="explorer-block">
          <div className="section-label">Documents</div>
          {folders.map((folder) => (
            <div className="folder-group" key={folder.name}>
              <button className="folder-row" type="button">
                <Icon path="M3 7h6l2 2h10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <span>{folder.name}</span>
              </button>
              {folder.docs.map((doc) => (
                <button className={doc.active ? 'doc-row active' : 'doc-row'} type="button" key={doc.name}>
                  <span>{doc.name}</span>
                  <b>{doc.type}</b>
                </button>
              ))}
            </div>
          ))}
        </section>

        <section className="explorer-block">
          <div className="section-label">Processing</div>
          {jobs.map((job) => (
            <div className={`job-row ${job.tone}`} key={job.label}>
              <span>{job.label}</span>
              <b>{job.value}</b>
            </div>
          ))}
        </section>
      </aside>

      <nav className="tabs" aria-label="Open documents">
        {openTabs.map((tab, index) => (
          <button className={index === 0 ? 'tab active' : 'tab'} type="button" key={tab}>
            {tab}
          </button>
        ))}
      </nav>

      <main className="document-workbench">
        <section className="document-header">
          <div>
            <div className="breadcrumb">Project Documents / uploaded by Minh / ready for workspace AI</div>
            <h1>Requirement.docx</h1>
            <div className="chip-row">
              <span className="chip success">Completed</span>
              <span className="chip info">RAG ready</span>
              <span className="chip accent">Summary generated</span>
              <span className="chip warning">Compare suggested</span>
            </div>
          </div>
          <div className="document-actions">
            <button className="ghost-button" type="button">Open split</button>
            <button className="ghost-button" type="button">Compare</button>
            <button className="primary-button" type="button">Ask AI</button>
          </div>
        </section>

        <section className="quick-grid" aria-label="Workspace context">
          {quickFacts.map((fact) => (
            <article className="quick-card" key={fact.label}>
              <span>{fact.label}</span>
              <strong>{fact.value}</strong>
              <p>{fact.detail}</p>
            </article>
          ))}
        </section>

        <section className="workbench-grid">
          <article className="paper">
            <h2>AI Summary</h2>
            <p>
              Requirement.docx defines the team MVP around Google OAuth, shared workspaces, member roles,
              folder/document management, asynchronous processing, RAG chat, document comparison, gap
              detection, Markdown report generation, and admin monitoring.
            </p>
            <h2>Key Decisions</h2>
            <p>
              Upload must return quickly while extraction, cleaning, chunking, embedding, and summary
              generation continue in background jobs. AI answers can run at document, folder, selected-tab,
              or workspace scope.
            </p>
            <div className="compare-strip" aria-label="Compare preview">
              <div>
                <span>Proposal v2.md</span>
                <p>Includes report generation as a demo-critical workflow.</p>
              </div>
              <div>
                <span>Requirement.docx</span>
                <p>Mentions reports, but export boundaries still need clarification.</p>
              </div>
            </div>
            <div className="gap-callout">
              Gap detected: Markdown report generation is P0. PDF and DOCX export should stay out of MVP unless stakeholders approve a scope change.
            </div>
          </article>

          <aside className="outline-panel" aria-label="Document outline">
            <div className="section-label">Outline</div>
            <a href="#summary">AI Summary</a>
            <a href="#decisions">Key Decisions</a>
            <a href="#pipeline">Upload Pipeline</a>
            <a href="#scope">RAG Scope</a>
            <a href="#report">Report Actions</a>
          </aside>
        </section>
      </main>

      <aside className="ai-inspector" aria-label="AI analyst panel">
        <div className="inspector-title">
          <span>AI analyst</span>
          <strong>Scope: current document</strong>
        </div>

        <section className="ai-card">
          <div className="mode-tabs" role="tablist" aria-label="AI modes">
            {aiModes.map((mode) => (
              <button className={mode.active ? 'mode active' : 'mode'} type="button" key={mode.label}>
                {mode.label}
              </button>
            ))}
          </div>
          <label htmlFor="ai-prompt">Prompt</label>
          <textarea id="ai-prompt" defaultValue="MVP cua project gom nhung chuc nang nao?" />
          <button className="primary-button full-width" type="button">Run analyst</button>
        </section>

        <section className="ai-card">
          <h2>Answer with sources</h2>
          <p>
            MVP includes auth, shared workspace, RBAC collaboration, folder/document upload,
            background processing, summary, RAG Q&A, comparison, gap detection, Markdown reports,
            and admin job monitoring.
          </p>
          <div className="citation-list">
            {citations.map((citation) => (
              <button className="citation" type="button" key={`${citation.source}-${citation.detail}`}>
                <span>{citation.source}</span>
                <small>{citation.detail} / score {citation.score}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="ai-card">
          <h2>Suggested next actions</h2>
          <div className="suggestion-list">
            <button type="button">Compare with Proposal v2.md</button>
            <button type="button">Generate gap analysis report</button>
            <button type="button">Create sprint demo script</button>
          </div>
        </section>

        <section className="ai-card relation-card">
          <h2>Relation view lite</h2>
          <div className="relation-map" aria-label="Related documents">
            {relatedNodes.map((node, index) => (
              <span className={`node node-${index}`} key={node}>{node}</span>
            ))}
          </div>
        </section>

        <section className="ai-card">
          <h2>Team presence</h2>
          {teamMembers.map((member) => (
            <div className="member-row" key={member.name}>
              <span>{member.name}</span>
              <b>{member.role}</b>
              <small>{member.status}</small>
            </div>
          ))}
        </section>
      </aside>

      <footer className="statusbar">
        <span>Role: owner / vector index: ready / workspace retrieval: permission-filtered</span>
        <span>AI jobs: 1 processing, 1 failed / Gemini fallback configured</span>
      </footer>
    </div>
  )
}

export default App
