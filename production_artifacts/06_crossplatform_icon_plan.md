# BDB CONNECT - Cross-Platform Tray & Custom Icon Plan

## 🎯 Zielsetzung
1. **Design eines maßgeschneiderten Icons ("B + Connector Plug"):** 
   - Ein prägnantes, elegantes Symbol, das den Buchstaben **"B"** mit einem **Stecker / Connector-Element** fusioniert.
   - Hochauflösende Retina-Grafiken für macOS (Template Image), Windows (`.ico`) und Linux (`.png`).
2. **Cross-Platform Tray & Window Handling:**
   - Automatische Plattform-Erkennung in `src/ui/main.js` (`darwin`, `win32`, `linux`).
   - Dynamische Icon-Auswahl je nach Betriebssystem (macOS: `IconTemplate.png`, Windows: `icon.ico`, Linux: `icon.png`).
   - Anpassung der Menubar-Positionierung (macOS: oben, Windows: Taskleiste unten rechts bei der Uhr, Linux: System-Tray).
3. **Multi-Platform Build Config:**
   - Erweiterung der `electron-builder` Konfiguration in `package.json` für Windows (`win`) und Linux (`linux`).

---

## 🛠️ Ausführungsplan

### Schritt 1: Icon Generation (`src/ui/`)
- Erstellung eines stylischen Vektor-Designs (B + Plug / Connector).
- Export als:
  - `IconTemplate.png` (22x22 pt, Template Image für macOS Statusleiste)
  - `IconTemplate@2x.png` (44x44 px Retina für macOS)
  - `icon.png` (256x256 px farbiges App-Icon)
  - `icon.ico` (Multisize Icon für Windows Taskleiste)

### Schritt 2: Platform-Aware Tray Management (`src/ui/main.js`)
- Weiche für OS-Erkennung:
  ```javascript
  const isMac = process.platform === 'darwin';
  const isWin = process.platform === 'win32';
  const iconPath = isMac 
    ? path.join(__dirname, 'IconTemplate.png')
    : path.join(__dirname, 'icon.png');
  ```
- Nur auf macOS: `icon.setTemplateImage(true)` und `app.dock.hide()`.
- Auf Windows/Linux: Standard Taskbar-Integration und Tray-Tooltip.

### Schritt 3: Multi-Platform Build Configuration (`package.json`)
- Hinzufügen von `win: { target: 'dir' }` und `linux: { target: 'dir' }`.

### Schritt 4: Verification & Build
- `npm run build` ausführen.
- `npm test` zur Verifikation.
- Commit in den `v2.0` Branch.
