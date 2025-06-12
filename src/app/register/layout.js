export default function RegisterLayout({ children }) {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&display=swap" />
      {children}
    </div>
  );
}
