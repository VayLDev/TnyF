import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata={title:'Tiny Frontier',description:'A low-poly island survival adventure.'};
export const viewport: Viewport={width:'device-width',initialScale:1,maximumScale:1,viewportFit:'cover',themeColor:'#101827'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
