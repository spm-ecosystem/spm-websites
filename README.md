# spm-websites

The official GitOps theme registry and repository for the Site Package Manager (SPM) ecosystem.

---

## What is spm-websites?
`spm-websites` acts as the GitOps repository for site packages. It contains modular layout configurations, styling sheets, and metadata profiles that tell the SPM content script how to modernise targeted websites.

---

## Repository Structure

Each subdirectory in this repository matches a target website domain. Within each domain folder:
- `vnr_project/`: Contains the modular Veneer Spec (`.vnr`) layout design sources (e.g. `classes.vnr`, `theme.vnr`, `pages.vnr`).
- `manifest.json`: The compiled target layout configuration schema (generated from the `.vnr` sources via the `spm` compiler).
- `content.css`: Custom vanilla CSS override stylesheet injected globally to hide banners, ads, and style elements on the target page.

### Example layout:
```md
spm-websites/
└── <domain-name>/
    ├── manifest.json
    ├── content.css
    └── vnr_project/
        ├── classes.vnr
        ├── theme.vnr
        ├── navigation.vnr
        └── pages.vnr
```

---

## Modifying and Compiling Themes

To compile design changes in a theme folder into the target layout `manifest.json`:

1.  Make sure the compiler binary `spm` (from the `spm-cli` repository) is installed and available in your environment.
2.  Navigate to the domain subdirectory and run the compile command:
    ```bash
    spm compile vnr_project/ -o manifest.json
    ```
3.  The compiler will recursively read all `.vnr` layout resources, resolve class inheritance structures, validate variables, and generate a clean, schema-compliant `manifest.json`.

---

## License

This project is licensed under the MIT License - see the [LICENSE](file:///home/watashi/Projects/spm-websites/LICENSE) file for details.
