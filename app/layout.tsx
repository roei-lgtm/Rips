import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'VAULT RIPS | Rip the impossible',description:'Premium collectible card pack opening experience — development prototype'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
