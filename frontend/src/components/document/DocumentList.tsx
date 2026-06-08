import { Link } from "react-router-dom";
import { StatusChip } from "./StatusChip";
type Props = {
  documents: {
    id: string;
    fileName: string;
    status: string;
    summary: string;
  }[];
};

function DocumentList({ documents }: Props) {
  return (
    <div>
      <h2>Documents</h2>

      {documents.map((doc) => (
        <div
          key={doc.id}
          style={{
            border: "1px solid #ddd",
            padding: "12px",
            marginBottom: "10px",
            borderRadius: "8px",
          }}
        >
          <h3>{doc.fileName}</h3>

          <StatusChip status={doc.status} />

          <p>{doc.summary}</p>
          <div style={{ marginTop: "10px" }}>
            <Link
              to={`/compare?doc=${doc.id}`}
              style={{
                color: "#2563eb",
                fontWeight: 600,
              }}
            >
              Compare Document
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

export default DocumentList;