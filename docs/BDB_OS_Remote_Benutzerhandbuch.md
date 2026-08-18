# BDB OS Remote – Benutzerhandbuch
### Von unterwegs arbeiten, als säßest du zuhause am Computer

---

## 📑 Inhaltsverzeichnis

1. [Einführung – Was macht diese Software eigentlich?](#1-einführung)
2. [Was du vorher brauchst](#2-was-du-vorher-brauchst)
3. [Schritt 1: Deinen Arbeits-Computer einrichten](#3-schritt-1-arbeits-computer)
4. [Schritt 2: Deinen Laptop verbinden](#4-schritt-2-laptop-verbinden)
5. [Verbindungsart wählen: Einfach oder Einzeln](#5-verbindungsart)
6. [Loslegen: So arbeitest du von unterwegs](#6-loslegen)
7. [Projekte für unterwegs herunterladen (Offline-Modus)](#7-offline-modus)
8. [Software aktuell halten](#8-update)
9. [Fehlerbehebung – Wenn etwas nicht klappt](#9-fehlerbehebung)
10. [Häufig gestellte Fragen (FAQ)](#10-faq)
11. [Kleines Wörterbuch der wichtigsten Begriffe](#11-woerterbuch)

---

<a name="1-einführung"></a>
## 1. Einführung – Was macht diese Software eigentlich?

Stell dir vor, du hast zuhause einen sehr leistungsstarken Computer stehen, auf dem all deine Projekte, Dateien und dein digitaler Assistent ("Claude Desktop") liegen. Wenn du unterwegs bist – zum Beispiel im Zug oder im Café – möchtest du trotzdem so arbeiten können, als würdest du direkt vor diesem Computer sitzen.

**Genau das macht BDB OS Remote.** Es baut eine sichere, unsichtbare Verbindung zwischen deinem Laptop und deinem Zuhause-Computer auf. Du tippst auf deinem Laptop, aber die eigentliche Arbeit (das Denken, das Suchen in Dateien, das Ausführen von Aufgaben) passiert auf deinem starken Zuhause-Computer.

**Die zwei wichtigsten Vorteile:**

- 🔒 **Sicher:** Die Verbindung läuft über ein privates, verschlüsseltes Netzwerk namens **Tailscale**. Niemand sonst kann mitlesen, und du musst keine Ports an deinem Router öffnen.
- 📶 **Sparsam:** Selbst bei schlechtem Handy-Empfang (z. B. im ICE) funktioniert die Verbindung noch, weil nur sehr wenige Daten übertragen werden müssen.

> **[HIER SCREENSHOT EINBAUEN: Übersichtsgrafik – Laptop links, Zuhause-Computer rechts, verbunden durch ein Schloss-Symbol]**

---

<a name="2-was-du-vorher-brauchst"></a>
## 2. Was du vorher brauchst

Bevor du startest, prüfe bitte, ob folgende Dinge vorhanden sind:

- [ ] **Zwei Geräte:** einen leistungsstarken Computer, der zuhause stehen bleibt (deinen "Arbeits-Computer"), und einen Laptop, den du mitnimmst.
- [ ] **Ein Tailscale-Konto** auf beiden Geräten (kostenlos einrichtbar unter tailscale.com). Tailscale ist die "unsichtbare Kabelverbindung" zwischen deinen Geräten.
- [ ] **Claude Desktop** auf beiden Geräten installiert.
- [ ] **Ein zusätzliches Hilfsprogramm namens "Node.js"**, das im Hintergrund läuft, damit unsere Software überhaupt starten kann. Falls du unsicher bist, ob es installiert ist, hilft dir jemand aus deinem Team gerne kurz weiter.
- [ ] Beide Geräte sind **mit demselben Tailscale-Konto angemeldet**.

> 💡 **Tipp:** Du musst diese Dinge nur **einmal** einrichten. Danach reicht ein Klick, um von unterwegs zu arbeiten.

---

<a name="3-schritt-1-arbeits-computer"></a>
## 3. Schritt 1: Deinen Arbeits-Computer einrichten

Diese Einrichtung machst du auf dem Computer, der **zuhause stehen bleibt**.

1. Öffne das schwarze Eingabefenster deines Computers (das sogenannte **Terminal**). Auf einem Mac findest du es über die Suche, wenn du "Terminal" eingibst.
2. Tippe den folgenden Text genau so ein und drücke die Eingabetaste:
   ```
   npx @hybridlabor-api/bdb-os-remote@latest installer
   ```
3. Warte, bis ein kleines Menü erscheint.
4. Wähle die Option **[1] Workstation**, indem du die Zahl `1` eintippst und Enter drückst.
5. Lass das Fenster geöffnet – die Einrichtung läuft nun automatisch durch.

> **[HIER SCREENSHOT EINBAUEN: Terminal-Fenster mit dem Auswahlmenü "1 Workstation / 2 Laptop"]**

Wenn alles fertig ist, siehst du eine Meldung, dass der Arbeits-Computer bereit ist und "zuhört". Das bedeutet: Er wartet nun darauf, dass sich dein Laptop bei ihm meldet.

> ⚠️ **Wichtig:** Der Arbeits-Computer muss eingeschaltet und mit dem Internet verbunden bleiben, damit du von unterwegs darauf zugreifen kannst.

---

<a name="4-schritt-2-laptop-verbinden"></a>
## 4. Schritt 2: Deinen Laptop verbinden

Diese Schritte machst du auf dem **Laptop**, den du mitnimmst.

1. Öffne ebenfalls das Terminal-Fenster auf deinem Laptop.
2. Tippe den gleichen Befehl wie zuvor ein:
   ```
   npx @hybridlabor-api/bdb-os-remote@latest installer
   ```
3. Wähle diesmal die Option **[2] Laptop**.
4. Gib den Namen deines Arbeits-Computers im Tailscale-Netzwerk ein, wenn du danach gefragt wirst (diesen Namen siehst du in deiner Tailscale-App).
5. Bestätige mit Enter und warte, bis die Meldung "erfolgreich eingerichtet" erscheint.
6. Schließe **Claude Desktop** vollständig und öffne es neu.

> **[HIER SCREENSHOT EINBAUEN: Erfolgsmeldung "✅ Injected local Heimdall Token Saver & remote BDB Gateway"]**

Herzlichen Glückwunsch – dein Laptop ist jetzt mit deinem Arbeits-Computer verbunden! 🎉

---

<a name="5-verbindungsart"></a>
## 5. Verbindungsart wählen: Einfach oder Einzeln

Während der Einrichtung auf dem Laptop wirst du gefragt, wie die Verbindung aufgebaut werden soll. Für die meisten Menschen ist die Antwort einfach:

| Option | Für wen geeignet? | Was passiert dabei? |
|---|---|---|
| **1 – Alles-in-einem (empfohlen)** | Für fast alle Nutzer | Alle Werkzeuge deines Arbeits-Computers werden über **eine einzige** Verbindung gebündelt. Einfacher, schneller einzurichten. |
| **2 – Einzelverbindungen** | Nur für sehr erfahrene Nutzer | Jedes einzelne Werkzeug wird separat in die Einstellungen eingetragen. Mehr Kontrolle, aber komplizierter. |

> 💡 Wenn du dir unsicher bist: **Wähle immer Option 1.**

---

<a name="6-loslegen"></a>
## 6. Loslegen: So arbeitest du von unterwegs

Sobald alles eingerichtet ist, musst du nichts weiter tun, als **Claude Desktop auf deinem Laptop wie gewohnt zu öffnen**. Im Hintergrund kümmert sich BDB OS Remote automatisch um die Verbindung zu deinem Arbeits-Computer.

Ein paar Beispiele, was du jetzt einfach in den Chat mit Claude eintippen kannst:

- *"Öffne das Projekt 'frontend-v2' auf meinem Arbeits-Computer und zeig mir, woran ich zuletzt gearbeitet habe."*
- *"Durchsuche mein Gedächtnis auf dem Arbeits-Computer nach allem, was wir über das Beleuchtungs-Projekt festgehalten haben."*
- *"Erstelle mir eine Übersichtskarte des Projekts XY, das auf meinem Arbeits-Computer liegt."*

> **[HIER SCREENSHOT EINBAUEN: Claude Desktop Chatfenster mit einer Beispiel-Anfrage und Antwort]**

Du wirst kaum einen Unterschied merken – außer, dass du plötzlich von jedem Ort aus auf deinen starken Zuhause-Computer zugreifen kannst.

---

<a name="7-offline-modus"></a>
## 7. Projekte für unterwegs herunterladen (Offline-Modus)

Manchmal hat man unterwegs **gar keinen** Internetempfang – zum Beispiel in einem langen Tunnel während einer Zugfahrt. Für genau diesen Fall gibt es die **Offline-Mitnahme-Funktion**. Sie lädt dir eine Kopie eines Projekts auf deinen Laptop herunter, damit du auch ganz ohne Verbindung weiterarbeiten kannst.

**So lädst du ein Projekt herunter:**

1. Öffne das Terminal-Fenster auf deinem Laptop.
2. Tippe folgenden Befehl ein und ersetze `projektname` durch den echten Namen deines Projekts:
   ```
   npx @hybridlabor-api/bdb-os-remote pull projektname
   ```
3. Drücke Enter und warte, bis der Ladebalken fertig ist.
4. Das Projekt liegt danach in einem Ordner namens `bdb-dev-local` auf deinem Laptop.

> **[HIER SCREENSHOT EINBAUEN: Terminal zeigt Download-Fortschritt "📦 BDB Remote Pull: Fetching..."]**

Sobald du wieder Internet hast, kannst du deine Änderungen wieder mit dem Arbeits-Computer abgleichen.

> 💡 **Tipp:** Große, unwichtige Dateien (wie Programm-Bibliotheken) werden beim Herunterladen automatisch weggelassen, damit es schnell geht.

---

<a name="8-update"></a>
## 8. Software aktuell halten

Damit du immer die neuesten Funktionen und Sicherheitsverbesserungen hast, solltest du die Software hin und wieder aktualisieren.

1. Öffne das Terminal-Fenster (egal ob auf Arbeits-Computer oder Laptop).
2. Tippe den gleichen Befehl ein wie bei der ersten Einrichtung:
   ```
   npx @hybridlabor-api/bdb-os-remote@latest installer
   ```
3. Wähle im Menü diesmal die Option **"Aktualisieren"**, sobald sie erscheint.
4. Warte, bis die Meldung "Update erfolgreich" erscheint.

---

<a name="9-fehlerbehebung"></a>
## 9. Fehlerbehebung – Wenn etwas nicht klappt

### 🔴 Problem: "Die Verbindung zu meinem Arbeits-Computer klappt nicht."

1. Öffne die Tailscale-App auf deinem Laptop und prüfe, ob sie mit einem grünen Punkt "verbunden" anzeigt.
2. Öffne das Terminal und tippe (ersetze `name-deines-computers` durch den echten Namen):
   ```
   tailscale ping name-deines-computers
   ```
3. Bekommst du eine Antwort? Dann steht die Verbindung – das Problem liegt woanders. Bekommst du keine Antwort? Dann ist dein Arbeits-Computer entweder ausgeschaltet oder nicht mit dem Internet verbunden.

### 🔴 Problem: "Claude Desktop zeigt keine Werkzeuge meines Arbeits-Computers an."

1. Schließe Claude Desktop vollständig (nicht nur das Fenster minimieren).
2. Öffne Claude Desktop erneut.
3. Prüfe, ob dein Arbeits-Computer eingeschaltet ist und läuft.

### 🔴 Problem: "Ich muss die Verbindung auf dem Arbeits-Computer neu starten."

1. Öffne das Terminal auf dem Arbeits-Computer.
2. Tippe ein:
   ```
   npx @hybridlabor-api/bdb-os-remote server
   ```
3. Lass dieses Fenster im Hintergrund geöffnet.

### 🔴 Problem: "Ich möchte prüfen, ob mein Arbeits-Computer bereit ist."

1. Öffne das Terminal auf dem Laptop.
2. Tippe (ersetze `name-deines-computers`):
   ```
   npx @hybridlabor-api/bdb-os-remote status --host name-deines-computers
   ```

> **[HIER SCREENSHOT EINBAUEN: Terminal mit erfolgreicher Status-Meldung]**

---

<a name="10-faq"></a>
## 10. Häufig gestellte Fragen (FAQ)

**Muss ich mich mit einem Passwort bei BDB OS Remote anmelden?**
Nein. Der Zugang läuft ausschließlich über dein Tailscale-Konto. Solange du dort angemeldet bist, funktioniert alles automatisch.

**Kann jemand anderes meine Daten mitlesen, während ich im Zug arbeite?**
Nein. Die gesamte Verbindung ist Ende-zu-Ende-verschlüsselt und läuft ausschließlich über dein privates Tailscale-Netzwerk.

**Verbraucht das viele Daten von meinem Handy-Vertrag?**
Nein, im Gegenteil. Die Software wurde extra so gebaut, dass sie auch bei sehr schwachem Empfang mit sehr wenig Datenvolumen auskommt.

**Muss mein Arbeits-Computer die ganze Zeit laufen?**
Ja. Wenn er ausgeschaltet ist, kann sich dein Laptop nicht mit ihm verbinden – ähnlich wie bei einem Telefonanruf, bei dem niemand abhebt.

**Was passiert, wenn ich beide Geräte gleichzeitig nutze?**
Kein Problem – du kannst jederzeit sowohl direkt am Arbeits-Computer als auch über den Laptop arbeiten.

---

<a name="11-woerterbuch"></a>
## 11. Kleines Wörterbuch der wichtigsten Begriffe

| Begriff | Was das für dich bedeutet |
|---|---|
| **Arbeits-Computer** | Dein starker Computer zuhause, auf dem deine Projekte liegen. |
| **Laptop / Unterwegs-Gerät** | Das Gerät, das du mitnimmst, um von überall zu arbeiten. |
| **Tailscale** | Ein Programm, das eine unsichtbare, sichere Verbindung zwischen deinen Geräten herstellt – egal, wie weit sie voneinander entfernt sind. |
| **Terminal** | Ein einfaches, schwarzes Eingabefenster auf deinem Computer, in das du kurze Textbefehle eintippst. |
| **Gedächtnis (Speicher-Funktion)** | Ein Bereich, in dem wichtige Entscheidungen und Wissen zu deinen Projekten dauerhaft festgehalten werden, damit du später danach fragen kannst. |
| **Offline-Mitnahme** | Die Funktion, mit der du ein Projekt vorab auf deinen Laptop herunterlädst, um auch ganz ohne Internet weiterzuarbeiten. |
| **Daten-Sparmodus** | Eine Funktion, die im Hintergrund dafür sorgt, dass möglichst wenig Datenmenge übertragen werden muss. |

---

*Bei weiteren Fragen wende dich gerne an dein Technik-Team. Dieses Handbuch bezieht sich auf BDB OS Remote Version 1.1.0.*
