import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Teken Heula API",
  description: "Dokumentasi Resmi API Sistem E-Sign & E-Seal",
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'API Docs', link: '/api/language-cert' }
    ],

    sidebar: [
      {
        text: 'Pengenalan',
        items: [
          { text: 'Apa itu Teken Heula?', link: '/' }
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
    ]
  }
})
