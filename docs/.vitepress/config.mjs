import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

export default withMermaid(
  defineConfig({
    lang: "id-ID",
    title: "Teken Heula API",
    description: "Dokumentasi Resmi API Sistem E-Sign & E-Seal",
    base: "/docs/",
    appearance: "dark",
    themeConfig: {
      siteTitle: false,
      logo: {
        light: "/assets/images/logoupimerah.png",
        dark: "/assets/images/UPI-Logo-white.png",
      },
      nav: [
        { text: "Home", link: "/" },
        { text: "API Docs", link: "/api/language-cert" },
      ],

      sidebar: [
        {
          text: "Pengenalan",
          items: [
            { text: "Apa itu Teken Heula?", link: "/api/pengantar" },
            { text: "Autentikasi & Keamanan", link: "/api/autentikasi" },
          ],
        },
        {
          text: "API Reference",
          items: [
            { text: "Language Cert", link: "/api/language-cert" },
            { text: "Mandala", link: "/api/mandala" },
          ],
        },
      ],

      socialLinks: [
        {
          icon: "github",
          link: "https://github.com/aswari91/teken-heula-docs",
        },
      ],

      search: {
        provider: "local",
      },

      footer: {
        message: "Dikembangkan oleh",
        copyright:
          "Copyright © 2026 Direktorat Sistem Teknologi Informasi dan Pusat Data - UPI",
      },
    },
  }),
);
