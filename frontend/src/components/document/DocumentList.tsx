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

          <p>Status: {doc.status}</p>

          <p>{doc.summary}</p>
        </div>
      ))}
    </div>
  );
}

export default DocumentList;