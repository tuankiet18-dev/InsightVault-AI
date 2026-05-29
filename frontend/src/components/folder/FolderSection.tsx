import type { FolderItem } from '../../types/document'

type Props = {
  folders: FolderItem[]
}

function FolderSection({ folders }: Props) {
  return (
    <div>
      {folders.map((folder) => (
        <div key={folder.id}>
          <h3>{folder.name}</h3>

          {folder.documents.map((doc) => (
            <div key={doc.id}>
              {doc.fileName} - {doc.type}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default FolderSection