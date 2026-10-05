import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

export default withMermaid(
  defineConfig({
    lang: "id-ID",
    title: "Teken Heula API",
    description: "Dokumentasi Resmi API Sistem E-Sign & E-Seal",
    base: "/docs/",
    // docs/public holds raw AI assets (skill .md files, llms.txt) that must be served as-is, not rendered as pages.
    srcExclude: ["public/**"],
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
            { text: "Integrasi dengan AI", link: "/api/integrasi-ai" },
          ],
        },
        {
          text: "API Reference",
          items: [
            { text: "Language Cert", link: "/api/language-cert" },
            { text: "Mandala", link: "/api/mandala" },
            { text: "SAKIP", link: "/api/sakip" },
            { text: "e-Planning (RKAT)", link: "/api/eplanning" },
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
        copyright: `Copyright © ${new Date().getFullYear()} Direktorat Sistem Teknologi Informasi dan Pusat Data - UPI`,
      },
    },
  }),
);
