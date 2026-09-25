#!/usr/bin/env python3
"""Motore di Autoveicoli sul Mac, al posto di Google Apps Script (25/09/2026).

PERCHÉ. Luca: «il salvataggio continua ad essere lunghissimo», e poi, ribaltando la domanda:
«nel 2026 ci dobbiamo appoggiare ancora a Google?». Misurato quel giorno sul motore Apps Script:
letture 2-3 s, scritture da 1,5 a 35 s, una richiesta su tre con la pagina Drive «Impossibile aprire
il file» anche quando la riga era stata scritta. Qui una richiesta costa pochi millisecondi.

COSA FA. Le stesse azioni e le stesse risposte del vecchio backend/Code.gs, così l'app cambia solo
indirizzo:
  GET  ?action=getVeicoli|getCosti|getTagliandi&pin=…
  POST {"action": "addCosto", …, "pin": "…"}   (add/update/delete di veicoli, costi, tagliandi)
- Il PIN è lo stesso di prima: AUTOVEICOLI_PIN in HQ/.env.
- Le righe nuove arrivano con l'id scelto dall'app: se una riga con quell'id c'è già non se ne scrive
  un'altra, perché l'app rimanda un invio finché non ha la risposta.
- Tutti i valori sono testo, convertiti come faceva Google (importo «586», km «125000», date
  «2026-09-22»), così le pagine dell'app non si accorgono del cambio.
- Promemoria mensile su Telegram e configurazione del bot restano su Apps Script: il motore gli
  tiene aggiornata la copia dei dati sui fogli (`rispecchia`), un minuto dopo ogni modifica.

DATI. SQLite accanto a questo file (autoveicoli.db). Una volta al giorno se ne salva una copia datata
su iCloud (Programmi/Autoveicoli/backup/), mai sovrascritta; Time Machine copre le ore.

Uso:
  python3 motore.py                    # avvia il server (127.0.0.1:5055)
  python3 motore.py --importa          # copia i dati attuali da Google (solo righe mancanti)
  python3 motore.py --backup           # copia datata di oggi su iCloud, se non c'è già
"""
import datetime
import hashlib
import json
import os
import re
import sqlite3
import sys
import threading
import time
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

QUI = os.path.dirname(os.path.abspath(__file__))
# per le prove si punta a una copia: AUTOVEICOLI_DB=/percorso/prova.db
DB = os.environ.get('AUTOVEICOLI_DB') or os.path.join(QUI, 'autoveicoli.db')
ENV_HQ = os.path.expanduser('~/Projects/HQ/.env')
PORTA = int(os.environ.get('AUTOVEICOLI_PORTA', '5055'))
BACKUP_ICLOUD = os.path.expanduser(
    '~/Library/Mobile Documents/com~apple~CloudDocs/Programmi/Autoveicoli/backup')
GOOGLE = ('https://script.google.com/macros/s/AKfycbzH6xpACTJSY2p72HYtVSE-ttd5dcR9J4x-pd8zTxOg66BVjCjKjct'
          '-YIfdJnpo92Gy7g/exec')
# chi può chiamare dal browser: l'app pubblicata e il server di sviluppo
ORIGINI = {'https://30luca1285-hue.github.io', 'http://localhost:5173', 'http://127.0.0.1:5173',
           'http://localhost:4173', 'http://127.0.0.1:4173'}

COLONNE = {
    'veicoli': ['id', 'nome', 'targa', 'tipo', 'anno', 'nota', 'dataImmatricolazione', 'carburante',
                'intervaloRevisione', 'kmAttuali', 'createdAt'],
    'costi': ['id', 'veicoloId', 'data', 'categoria', 'importo', 'nota', 'litri', 'km', 'createdAt'],
    'tagliandi': ['id', 'veicoloId', 'tipo', 'data', 'km', 'dataProssima', 'kmProssimi', 'importo',
                  'nota', 'createdAt'],
}
SCRITTURA = threading.Lock()


def leggi_pin():
    try:
        with open(ENV_HQ, encoding='utf-8') as f:
            for riga in f:
                if riga.startswith('AUTOVEICOLI_PIN='):
                    return riga.split('=', 1)[1].strip().strip('"\'')
    except OSError:
        pass
    return ''


def db():
    con = sqlite3.connect(DB, timeout=10)
    con.row_factory = sqlite3.Row
    con.execute('PRAGMA journal_mode=WAL')
    con.execute('PRAGMA busy_timeout=10000')
    return con


def prepara():
    con = db()
    for tab, cols in COLONNE.items():
        # `ordine` conserva la sequenza di inserimento, come le righe del foglio Google
        campi = ', '.join(f'"{c}" TEXT NOT NULL DEFAULT \'\'' for c in cols[1:])
        con.execute(f'CREATE TABLE IF NOT EXISTS {tab} (ordine INTEGER PRIMARY KEY AUTOINCREMENT, '
                    f'id TEXT NOT NULL UNIQUE, {campi})')
    con.commit()
    con.close()


# ── conversioni: le stesse del vecchio motore, per restituire gli stessi testi ──────────────────
_NUMERO = re.compile(r'^\s*[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?')


def _parse_float(v):
    """parseFloat di JavaScript: legge il numero iniziale e ignora il resto."""
    m = _NUMERO.match('' if v is None else str(v))
    return float(m.group(0)) if m else float('nan')


def _come_js(n):
    return str(int(n)) if n == int(n) and abs(n) < 1e21 else repr(n)


def numero(v):
    """parseFloat(v) || ''  →  vuoto se manca, se è zero o se non è un numero."""
    n = _parse_float(v)
    return '' if n != n or n == 0 else _come_js(n)


def numero_o_zero(v):
    """parseFloat(v) || 0"""
    n = _parse_float(v)
    return '0' if n != n or n == 0 else _come_js(n)


def testo(v):
    """p.x || ''"""
    if v is None or v is False or v == '' or v == 0:
        return ''
    return _come_js(v) if isinstance(v, float) else str(v)


def oggi():
    return datetime.datetime.utcnow().strftime('%Y-%m-%d')   # new Date().toISOString().slice(0,10)


def adesso():
    t = datetime.datetime.utcnow()
    return t.strftime('%Y-%m-%dT%H:%M:%S.') + f'{t.microsecond // 1000:03d}Z'


def nuovo_id():
    """Stesso formato di generateId() del vecchio motore: istante in base 36 + 4 caratteri."""
    cifre = '0123456789abcdefghijklmnopqrstuvwxyz'

    def b36(n):
        s = ''
        while n:
            n, r = divmod(n, 36)
            s = cifre[r] + s
        return s or '0'
    return b36(int(time.time() * 1000)) + b36(int.from_bytes(os.urandom(4), 'big'))[-4:]


def id_dal_client(p):
    # solo lettere e cifre, come controlla anche Code.gs
    i = str(p.get('id') or '')
    return i if re.fullmatch(r'[A-Za-z0-9]{6,24}', i) else ''


# ── letture ─────────────────────────────────────────────────────────────────────────────────────
def elenco(tab):
    con = db()
    righe = con.execute(f'SELECT {", ".join(chr(34) + c + chr(34) for c in COLONNE[tab])} '
                        f'FROM {tab} ORDER BY ordine').fetchall()
    con.close()
    return [dict(r) for r in righe if r['id']]


# ── scritture ───────────────────────────────────────────────────────────────────────────────────
def aggiungi(tab, p, valori):
    """valori: dizionario colonna→testo, senza id e createdAt."""
    with SCRITTURA:
        con = db()
        try:
            i = id_dal_client(p)
            if i and con.execute(f'SELECT 1 FROM {tab} WHERE id=?', (i,)).fetchone():
                return {'ok': True, 'id': i, 'giaPresente': True}
            i = i or nuovo_id()
            riga = dict(valori, id=i, createdAt=adesso())
            cols = COLONNE[tab]
            con.execute(f'INSERT INTO {tab} ({", ".join(chr(34) + c + chr(34) for c in cols)}) '
                        f'VALUES ({", ".join("?" for _ in cols)})', [riga.get(c, '') for c in cols])
            con.commit()
            return {'ok': True, 'id': i}
        finally:
            con.close()


def modifica(tab, p, conversioni):
    """Aggiorna solo i campi presenti nella richiesta, come faceva Code.gs."""
    campi = {c: conv(p[c]) for c, conv in conversioni.items() if c in p and p[c] is not None}
    with SCRITTURA:
        con = db()
        try:
            if not con.execute(f'SELECT 1 FROM {tab} WHERE id=?', (str(p.get('id')),)).fetchone():
                return {'ok': False, 'error': 'not found'}
            if campi:
                con.execute(f'UPDATE {tab} SET {", ".join(chr(34) + c + chr(34) + "=?" for c in campi)} '
                            f'WHERE id=?', list(campi.values()) + [str(p.get('id'))])
                con.commit()
            return {'ok': True}
        finally:
            con.close()


def cancella(tab, i):
    with SCRITTURA:
        con = db()
        try:
            n = con.execute(f'DELETE FROM {tab} WHERE id=?', (str(i),)).rowcount
            con.commit()
            return {'ok': True} if n else {'ok': False, 'error': 'not found'}
        finally:
            con.close()


def cancella_veicolo(i):
    """Col veicolo se ne vanno anche le sue spese e i suoi promemoria (come in Code.gs)."""
    with SCRITTURA:
        con = db()
        try:
            con.execute('DELETE FROM veicoli WHERE id=?', (str(i),))
            con.execute('DELETE FROM costi WHERE veicoloId=?', (str(i),))
            con.execute('DELETE FROM tagliandi WHERE veicoloId=?', (str(i),))
            con.commit()
            return {'ok': True}
        finally:
            con.close()


def esegui(p):
    a = p.get('action')
    if a == 'addVeicolo':
        return aggiungi('veicoli', p, {
            'nome': testo(p.get('nome')), 'targa': testo(p.get('targa')), 'tipo': testo(p.get('tipo')) or 'auto',
            'anno': testo(p.get('anno')), 'nota': testo(p.get('nota')),
            'dataImmatricolazione': testo(p.get('dataImmatricolazione')), 'carburante': testo(p.get('carburante')),
            'intervaloRevisione': testo(p.get('intervaloRevisione')), 'kmAttuali': testo(p.get('kmAttuali'))})
    if a == 'addCosto':
        return aggiungi('costi', p, {
            'veicoloId': testo(p.get('veicoloId')), 'data': testo(p.get('data')) or oggi(),
            'categoria': testo(p.get('categoria')), 'importo': numero_o_zero(p.get('importo')),
            'nota': testo(p.get('nota')), 'litri': numero(p.get('litri')), 'km': numero(p.get('km'))})
    if a == 'addTagliando':
        return aggiungi('tagliandi', p, {
            'veicoloId': testo(p.get('veicoloId')), 'tipo': testo(p.get('tipo')),
            'data': testo(p.get('data')) or oggi(), 'km': numero(p.get('km')),
            'dataProssima': testo(p.get('dataProssima')), 'kmProssimi': numero(p.get('kmProssimi')),
            'importo': numero(p.get('importo')), 'nota': testo(p.get('nota'))})
    uguale = lambda v: '' if v is None else str(v)   # setValue(p.x): il valore così com'è
    if a == 'updateVeicolo':
        return modifica('veicoli', p, {c: uguale for c in COLONNE['veicoli'][1:-1]})
    if a == 'updateCosto':
        return modifica('costi', p, {'data': uguale, 'categoria': uguale, 'importo': numero,
                                     'nota': uguale, 'km': numero})
    if a == 'updateTagliando':
        return modifica('tagliandi', p, {'tipo': uguale, 'data': uguale, 'km': numero,
                                         'dataProssima': uguale, 'kmProssimi': numero,
                                         'importo': numero, 'nota': uguale})
    if a == 'deleteVeicolo':
        return cancella_veicolo(p.get('id'))
    if a == 'deleteCosto':
        return cancella('costi', p.get('id'))
    if a == 'deleteTagliando':
        return cancella('tagliandi', p.get('id'))
    return {'error': f'Unknown action: {a}'}


LETTURE = {'getVeicoli': 'veicoli', 'getCosti': 'costi', 'getTagliandi': 'tagliandi'}
RIFIUTO_PIN = {'error': 'PIN non valido', 'pinRichiesto': True}


class Gestore(BaseHTTPRequestHandler):
    server_version = 'Autoveicoli'

    def _rispondi(self, dati, stato=200):
        corpo = json.dumps(dati, ensure_ascii=False).encode('utf-8')
        self.send_response(stato)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(corpo)))
        self.send_header('Cache-Control', 'no-store')
        origine = self.headers.get('Origin')
        if origine in ORIGINI:
            self.send_header('Access-Control-Allow-Origin', origine)
            self.send_header('Vary', 'Origin')
        self.end_headers()
        self.wfile.write(corpo)

    def do_OPTIONS(self):
        self.send_response(204)
        origine = self.headers.get('Origin')
        if origine in ORIGINI:
            self.send_header('Access-Control-Allow-Origin', origine)
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.send_header('Vary', 'Origin')
        self.end_headers()

    def do_GET(self):
        q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        if q.get('action', [''])[0] == 'salute':          # per il guardiano: niente dati, niente PIN
            return self._rispondi({'ok': True})
        if q.get('pin', [''])[0] != self.server.pin or not self.server.pin:
            return self._rispondi(RIFIUTO_PIN)
        tab = LETTURE.get(q.get('action', [''])[0])
        try:
            self._rispondi(elenco(tab) if tab else {'error': 'Unknown action: ' + q.get('action', [''])[0]})
        except Exception as e:                                # noqa: BLE001 — come doGet: errore in JSON
            self._rispondi({'error': str(e)})

    def do_POST(self):
        try:
            lunghezza = int(self.headers.get('Content-Length') or 0)
            p = json.loads(self.rfile.read(min(lunghezza, 100_000)) or b'{}')
            if not isinstance(p, dict):
                raise ValueError('corpo non valido')
        except Exception as e:                                # noqa: BLE001
            return self._rispondi({'error': f'richiesta non valida: {e}'})
        if str(p.get('pin') or '') != self.server.pin or not self.server.pin:
            return self._rispondi(RIFIUTO_PIN)
        try:
            self._rispondi(esegui(p))
        except Exception as e:                                # noqa: BLE001
            self._rispondi({'error': str(e)})

    def log_message(self, formato, *args):
        # ⛔ mai il PIN nel log: la riga della richiesta lo contiene nelle letture
        riga = formato % args
        sys.stderr.write('%s %s\n' % (datetime.datetime.now().strftime('%d/%m %H:%M:%S'),
                                      re.sub(r'pin=[^&\s]*', 'pin=***', riga)))


# ── backup: una copia datata al giorno su iCloud, mai sovrascritta ─────────────────────────────
def backup_del_giorno():
    os.makedirs(BACKUP_ICLOUD, exist_ok=True)
    dest = os.path.join(BACKUP_ICLOUD, f'autoveicoli-{datetime.date.today().isoformat()}.db')
    if os.path.exists(dest):
        return None
    tmp = os.path.join(QUI, '.backup-in-corso.db')
    src = sqlite3.connect(DB)
    out = sqlite3.connect(tmp)
    src.backup(out)             # copia coerente anche mentre il server scrive
    out.close()
    src.close()
    with open(tmp, 'rb') as f, open(dest, 'xb') as g:     # 'x': si crea, non si sovrascrive mai
        g.write(f.read())
    os.remove(tmp)
    return dest


def backup_periodico():
    while True:
        try:
            fatto = backup_del_giorno()
            if fatto:
                sys.stderr.write(f'backup: {fatto}\n')
        except Exception as e:                                # noqa: BLE001
            sys.stderr.write(f'backup non riuscito: {e}\n')
        time.sleep(3600)


# ── copia verso i fogli Google ──────────────────────────────────────────────────────────────────
# I fogli restano la COPIA da consultare e la fonte del promemoria Telegram del 1° del mese
# (checkScadenzeMensili su Apps Script, che legge da lì). Si manda tutto, ma solo quando qualcosa è
# cambiato; se Google non risponde si riprova al giro dopo. Nessuno aspetta: è in sottofondo.
def istantanea():
    return {tab: elenco(tab) for tab in COLONNE}


def rispecchia(pin, dati):
    corpo = json.dumps(dict(dati, action='rispecchia', pin=pin)).encode('utf-8')
    richiesta = urllib.request.Request(GOOGLE, data=corpo, method='POST',
                                       headers={'Content-Type': 'text/plain;charset=utf-8'})
    with urllib.request.urlopen(richiesta, timeout=90) as r:     # Apps Script rimanda a una GET: urllib la segue
        risposta = json.loads(r.read().decode('utf-8'))
    if not risposta.get('ok'):
        raise RuntimeError(str(risposta)[:150])
    return risposta


def rispecchia_periodico(pin):
    ultima = None      # impronta dell'ultima copia riuscita; None = non ancora fatta da quando gira
    errori = 0
    while True:
        try:
            dati = istantanea()
            impronta = hashlib.sha1(json.dumps(dati, sort_keys=True).encode('utf-8')).hexdigest()
            if impronta != ultima:
                esito = rispecchia(pin, dati)
                ultima, errori = impronta, 0
                sys.stderr.write(f'{datetime.datetime.now():%d/%m %H:%M:%S} copia su Google: {esito.get("righe")}\n')
        except Exception as e:                                # noqa: BLE001
            errori += 1
            if errori in (1, 10) or errori % 60 == 0:           # nel registro sì, ma non a ogni minuto
                sys.stderr.write(f'{datetime.datetime.now():%d/%m %H:%M:%S} copia su Google non riuscita '
                                 f'({errori}): {e}\n')
        time.sleep(60)


# ── importazione una tantum dai fogli Google ───────────────────────────────────────────────────
def importa(pin):
    prepara()
    esito = {}
    for azione, tab in LETTURE.items():
        dati, ultimo = None, None
        for tentativo in range(4):     # Google risponde a singhiozzo: si riprova la lettura
            try:
                url = GOOGLE + '?' + urllib.parse.urlencode({'action': azione, 'pin': pin})
                with urllib.request.urlopen(url, timeout=60) as r:
                    dati = json.loads(r.read().decode('utf-8'))
                if isinstance(dati, list):
                    break
                ultimo, dati = f'risposta inattesa: {str(dati)[:80]}', None
            except Exception as e:                            # noqa: BLE001
                ultimo = str(e)
            time.sleep(5)
        if dati is None:
            raise SystemExit(f'{azione}: Google non ha risposto ({ultimo})')
        cols = COLONNE[tab]
        con = db()
        nuove = 0
        for r in dati:
            if not r.get('id'):
                continue
            cur = con.execute(f'INSERT OR IGNORE INTO {tab} ({", ".join(chr(34) + c + chr(34) for c in cols)}) '
                              f'VALUES ({", ".join("?" for _ in cols)})', [str(r.get(c, '') or '') for c in cols])
            nuove += cur.rowcount
        con.commit()
        tot = con.execute(f'SELECT COUNT(*) FROM {tab}').fetchone()[0]
        con.close()
        esito[tab] = (len(dati), nuove, tot)
    return esito


def main():
    pin = leggi_pin()
    if not pin:
        raise SystemExit('manca AUTOVEICOLI_PIN in HQ/.env')
    if '--importa' in sys.argv:
        for tab, (google, nuove, tot) in importa(pin).items():
            print(f'{tab:10} su Google {google:4} · aggiunte ora {nuove:4} · nel motore {tot:4}')
        return
    prepara()
    if '--backup' in sys.argv:
        print(backup_del_giorno() or 'la copia di oggi c’è già')
        return
    if not os.environ.get('AUTOVEICOLI_DB'):      # durante le prove niente copie su iCloud né su Google
        threading.Thread(target=backup_periodico, daemon=True).start()
        threading.Thread(target=rispecchia_periodico, args=(pin,), daemon=True).start()
    server = ThreadingHTTPServer(('127.0.0.1', PORTA), Gestore)
    server.pin = pin
    sys.stderr.write(f'motore Autoveicoli su 127.0.0.1:{PORTA}\n')
    server.serve_forever()


if __name__ == '__main__':
    main()
