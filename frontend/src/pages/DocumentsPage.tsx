import FolderList from "../components/folder/FolderList";
import DocumentList from "../components/document/DocumentList";
import UploadModal from "../components/upload/UploadModal";

import {
  mockFolders,
  mockDocuments,
} from "../mock/documentsMock";

function DocumentsPage() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Documents</h1>

      <FolderList folders={mockFolders} />

      <br />

      <DocumentList documents={mockDocuments} />

      <UploadModal />
    </div>
  );
}

export default DocumentsPage;