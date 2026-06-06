import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Teken Heula API",
  description: "Dokumentasi Resmi API Sistem E-Sign & E-Seal",
  base: '/docs/',
  themeConfig: {
    siteTitle: false,
    logo: { light: '/assets/images/logoupimerah.png', dark: '/assets/images/UPI-Logo-white.png' },
    nav: [
      { text: 'Home', link: '/' },
      { text: 'API Docs', link: '/api/language-cert' }
    ],

    sidebar: [
      {
        text: 'Pengenalan',
        items: [
          { text: 'Apa itu Teken Heula?', link: '/api/pengantar' }
        ]
      },
      {
        text: 'API Reference',
        items: [
          { text: 'Language Cert', link: '/api/language-cert' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/aswari91/teken-heula-docs' }
    ],

    footer: {
      message: 'Dikembangkan oleh',
      copyright: 'Direktorat Sistem Teknologi Informasi dan Pusat Data - UPI'
    }
  }
})
