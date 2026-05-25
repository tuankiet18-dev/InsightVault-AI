import heroImg from './assets/hero.png'
import './App.css'
import {
  activityItems,
  aiPipelineSteps,
  dashboardStats,
  documentStatuses,
  workspaceActions,
} from './data/mvp'

function App() {
  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Workspace navigation">
        <div className="brand">
          <span className="brand-mark">IV</span>
          <div>
            <strong>InsightVault AI</strong>
            <span>Knowledge workspace</span>
          </div>
        </div>

        <nav className="nav-list">
          <a href="#overview" aria-current="page">
            Overview
          </a>
          <a href="#documents">Documents</a>
          <a href="#pipeline">AI pipeline</a>
          <a href="#activity">Activity</a>
        </nav>

        <section className="workspace-card" aria-labelledby="workspace-title">
          <span className="eyebrow">Active workspace</span>
          <h2 id="workspace-title">InsightVault AI Project</h2>
          <p>Shared source of truth for project documents, summaries, RAG chat, and reports.</p>
        </section>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <span className="eyebrow">MVP Control Center</span>
            <h1>Collaborative document intelligence</h1>
          </div>
          <button type="button">Upload document</button>
        </header>

        <section id="overview" className="hero-panel">
          <div className="hero-copy">
            <span className="eyebrow">Core flow</span>
            <h2>Shared documents become an AI-ready knowledge base.</h2>
            <p>
              Upload project files, process them into chunks and embeddings, then use summaries,
              scoped Q&A, comparisons, gap detection, and Markdown reports.
            </p>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <img src={heroImg} alt="" />
            <div className="signal-list">
              {aiPipelineSteps.slice(0, 3).map((step) => (
                <span key={step}>{step}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="stats-grid" aria-label="Workspace metrics">
          {dashboardStats.map((stat) => (
            <article className="stat-card" key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <small>{stat.detail}</small>
            </article>
          ))}
        </section>

        <section className="section-grid">
          <article id="documents" className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Documents</span>
                <h2>Processing status</h2>
              </div>
              <button type="button" className="secondary-action">
                View all
              </button>
            </div>
            <div className="status-list">
              {documentStatuses.map((item) => (
                <div className="status-row" key={item.label}>
                  <span className={`status-dot ${item.tone}`} aria-hidden="true" />
                  <div>
                    <strong>{item.label}</strong>
                    <span>{item.description}</span>
                  </div>
                  <b>{item.count}</b>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Workspace</span>
                <h2>Owner actions</h2>
              </div>
            </div>
            <div className="action-list">
              {workspaceActions.map((action) => (
                <button type="button" className="action-row" key={action.title}>
                  <span>{action.title}</span>
                  <small>{action.description}</small>
                </button>
              ))}
            </div>
          </article>
        </section>

        <section className="section-grid">
          <article id="pipeline" className="panel wide-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">AI service</span>
                <h2>Document processing pipeline</h2>
              </div>
            </div>
            <ol className="pipeline-list">
              {aiPipelineSteps.map((step, index) => (
                <li key={step}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  {step}
                </li>
              ))}
            </ol>
          </article>

          <article id="activity" className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Monitoring</span>
                <h2>Recent activity</h2>
              </div>
            </div>
            <div className="activity-list">
              {activityItems.map((item) => (
                <div className="activity-row" key={item.title}>
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                </div>
              ))}
            </div>
          </article>
        </section>
      </section>
    </main>
  )
}

export default App
