export const metadata = {
  title: 'Loading - X-CEED',
  description: 'Loading X-CEED application',
}

export default function LoadingLayout({ children }) {
  return (
    <div className="loading-layout">
      {children}
    </div>
  )
}
