# BDB CONNECT - Phase 4: UI/UX & Menubar App Plan

## 🎯 Zielsetzung
Wir verpacken die reine Terminal-Logik (aus Phase 1 & 2) in eine native macOS Menüleisten-App (Tray App). Das Ziel ist eine "Tailscale-ähnliche" Experience: Ein unaufdringliches Icon oben rechts, das den Status anzeigt und mit einem Klick alle Agenten-Routen steuert.

## 🛠️ Technologie-Stack
- **App-Wrapper:** **Electron** (Die logische Wahl, da unsere Engine bereits in Node.js geschrieben ist. Der Electron "Main Process" kann unsere `gateway.js` und `sidecar.js` direkt und nativ importieren/ausführen).
- **Frontend (Tray Window):** Leichtgewichtiges **React + Tailwind CSS + Shadcn UI**.
- **Packaging:** `electron-builder` (Erzeugt am Ende eine echte `BDB CONNECT.app` für den Mac-Programme-Ordner).

## 🏗️ Architektur der App

### 1. Der Main Process (Das Backend)
- **Tray-Management:** Erstellt das Icon in der Menüleiste und berechnet die exakte Position für das Dropdown-Fenster (unter dem Icon).
- **Daemon-Controller:** Bindet unseren bestehenden Code ein. Wenn der User in der UI auf "Server Mode" klickt, ruft der Main Process im Hintergrund unsere `BDBConnectGateway.start()` auf.
- **Tailscale-Monitor:** Fragt zyklisch ab, ob Tailscale aktiv ist, und gibt die aktuelle IP an das Frontend.

### 2. Das Renderer Process (Das UI / Frontend)
Ein schmales (ca. 320x400px) rahmenloses Fenster, das sich bei Klick auf das Tray-Icon öffnet.
- **Header:** BDB CONNECT Logo & Status-Indikator (Grün = Verbunden, Rot = Offline).
- **Identity-Section:** Zeigt die erkannte Tailscale-IP (z.B. `100.123.207.82`).
- **Mode-Switch:** Ein Toggle, um den Rechner als "Server" (Workstation) oder "Client" (Laptop) laufen zu lassen.
- **Remote Dispatcher:** Ein kleines Eingabefeld (Spotlight-Style), um Aufgaben direkt an andere Rechner im Tailnet zu pushen.

## 📋 Ausführungsplan für die Agenten

**Schritt 1: Scaffold & Setup (`Godmode_Engineering`)**
- Initialisierung von Electron und dem React-Frontend im Unterordner `src/ui/`.
- Einrichten der IPC-Bridge (Inter-Process Communication), damit das React-Frontend mit der Node.js Engine kommunizieren kann.

**Schritt 2: UI Design (`Godmode_UI_UX`)**
- Bauen des Menüleisten-Fensters nach strikten BDB Design-Tokens (Dark Mode, minimalistisch, Anti-Slop).
- Nachbau der Ästhetik aus deinem Tailscale-Screenshot (Klare Trennung durch Linien, sauberes Status-Toggle).

**Schritt 3: Integration der Engine (`Godmode_Engineering`)**
- Verknüpfung des UI-Toggles mit der echten CLI-Engine (`bdb-remote server` / `client`).
- Einbau von Desktop-Notifications (z.B. "Agent führt Task aus", "Remote Request geblockt").

**Schritt 4: Build & App (`Godmode_Shipping`)**
- Konfiguration von `electron-builder`.
- Erzeugen der finalen `.app` Datei, die ohne Terminal gestartet werden kann.
