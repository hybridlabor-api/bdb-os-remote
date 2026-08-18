# Changelog

## [1.2.0](https://github.com/hybridlabor-api/bdb-os-remote/compare/v1.1.0...v1.2.0) (2026-08-18)


### Features

* **arch:** unify CLI and UI by embedding electron and adding auto-launch wizard step ([06940fb](https://github.com/hybridlabor-api/bdb-os-remote/commit/06940fb04bb253de7ea7bc758a3506a9333a760e))
* **ui:** add auto-update banner and 5-day notification tracker ([8b46180](https://github.com/hybridlabor-api/bdb-os-remote/commit/8b461807a84574b130673b578c75094dab2e474a))

## [1.1.0](https://github.com/hybridlabor-api/bdb-os-remote/compare/v1.0.0...v1.1.0) (2026-08-18)


### Features

* add ssh audit and tunnel connection tests to installer ([e7491c1](https://github.com/hybridlabor-api/bdb-os-remote/commit/e7491c115049e20d3ce95f9429406d5941bda271))
* mcp multiplexer and config injector ([cd92240](https://github.com/hybridlabor-api/bdb-os-remote/commit/cd9224068f81eba18bec36cf3dae6a8c82106f1e))
* **pages:** place index.html and .nojekyll in docs root for GitHub Pages hosting ([456a567](https://github.com/hybridlabor-api/bdb-os-remote/commit/456a56719caa59e77a2850904ff1ea4ca618f5da))
* **ui:** redesign BDB CONNECT in Tailscale-inspired frosted glass with BDB Purple theme ([9db412d](https://github.com/hybridlabor-api/bdb-os-remote/commit/9db412da8a9fee968354d0d0993adb4d5e09d398))
* **v2.0:** add custom B+Connector fused icon and full cross-platform support (macOS, Windows, Linux) ([c7075e8](https://github.com/hybridlabor-api/bdb-os-remote/commit/c7075e86c74370ed4c891e8b1452f742edde3f12))
* **v2.0:** add multi-platform support (AGY, Codex, Claude) to setup installer ([e7f17e9](https://github.com/hybridlabor-api/bdb-os-remote/commit/e7f17e9b8b5e7fb24eda9cd07e34896152999072))
* **v2.0:** implement BDB CONNECT sidecar, MCP gateway and tailscale zero-trust adapter ([3cb14da](https://github.com/hybridlabor-api/bdb-os-remote/commit/3cb14dae34465e53e7dd32a57c833966f42f905e))
* **v2.0:** integrate Web UI button, valid menubar template icon and updated installer ([755691d](https://github.com/hybridlabor-api/bdb-os-remote/commit/755691dfde4d012b954c5ef0dc87a1d0597f33d8))


### Bug Fixes

* **bin:** add installer executable mapping for npx compatibility ([6158abb](https://github.com/hybridlabor-api/bdb-os-remote/commit/6158abb0317ce0d2aa4ac3745168dce6038e2d6a))
* **bin:** map bdb-os-remote bin alias and add installer subcommand to cli.js ([fd2faea](https://github.com/hybridlabor-api/bdb-os-remote/commit/fd2faea426a73f7e788493622d98461e0a6a50e8))
* **build:** set valid executableName for electron-builder to prevent linux build failure ([7c6b38d](https://github.com/hybridlabor-api/bdb-os-remote/commit/7c6b38d35d4fc58506926dc53f11fe6b6e2a6d92))
* **installer:** explicitly use --package and bdb-remote executable in npx commands ([3a78b8e](https://github.com/hybridlabor-api/bdb-os-remote/commit/3a78b8edd39042225049906c486e698b0d24153b))
* **packaging:** declare explicit files whitelist in package.json and add .npmignore ([f22b6a8](https://github.com/hybridlabor-api/bdb-os-remote/commit/f22b6a8cb89af6c258d1a1a10232251167bf3257))
* **ui:** add tray right-click context menu, blur auto-dismiss, and close/quit buttons ([6bf31ab](https://github.com/hybridlabor-api/bdb-os-remote/commit/6bf31ab83a4082e1809f90cbb9ff3a5b1c3f8b36))
* **ui:** hide from dock, configure template tray icon and bootstrap electron properly ([d256cb7](https://github.com/hybridlabor-api/bdb-os-remote/commit/d256cb7bee238235a981ff2e3f79e3f1e4620e40))
* **ui:** remove OS rectangular shadow and outer padding to eliminate clipped border artifact ([e1f543c](https://github.com/hybridlabor-api/bdb-os-remote/commit/e1f543cdaa3cae958d6121acf25247c4fc346061))
