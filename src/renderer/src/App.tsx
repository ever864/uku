import { useEffect, useState } from "react";

function App() {
  const [pdfPath, setPdfPath] = useState<string | null>(null);

  useEffect(() => {
    const handleOpen = (_event: any, filePath: string) => {
      console.log("PDF opened:", filePath);
      setPdfPath(filePath);
    };

    window.electron.ipcRenderer.on("menu-open", handleOpen);

    // Cleanup
    return () => {
      window.electron.ipcRenderer.removeAllListeners("menu-open");
    };
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", margin: 0, padding: 0 }}>
      {pdfPath ? (
        <iframe
          src={`file://${pdfPath}`}
          width="100%"
          height="100%"
          title="PDF Viewer"
          style={{ border: "none" }}
        />
      ) : (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
          }}
        >
          No PDF opened. Use File → Open (Ctrl/Cmd + O)
        </div>
      )}
    </div>
  );
}

export default App;
