import FolderSection from "../components/folder/FolderSection";
import DocumentList from "../components/document/DocumentList";
import UploadPanel from "../components/upload/UploadPanel";

import {
  mockFolders,
  mockDocuments,
} from "../mock/documentsMock";

function DocumentsPage() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Documents</h1>

      <FolderSection folders={mockFolders} />

      <br />

      <DocumentList documents={mockDocuments} />

      <br />

      <UploadPanel />
    </div>
  );
}

export default DocumentsPage;