interface FooterProps {
  datasetName: string;
  version: string;
  buildDate: string;
}

export function Footer({ datasetName, version, buildDate }: FooterProps) {
  return (
    <footer className="footer-card">
      <div>
        <span className="footer-label">Dataset</span>
        <strong>{datasetName}</strong>
      </div>
      <div>
        <span className="footer-label">Version</span>
        <strong>{version}</strong>
      </div>
      <div>
        <span className="footer-label">Build date</span>
        <strong>{buildDate}</strong>
      </div>
      <div>
        <span className="footer-label">Unit basis</span>
        <strong>per 100 g</strong>
      </div>
    </footer>
  );
}
