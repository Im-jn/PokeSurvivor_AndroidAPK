# TURN de Cloudflare para el cooperativo

**Por qué:** cuando dos jugadores no pueden conectarse directamente (datos móviles,
algunos routers), sus partidas en grupo se retransmitían por la Realtime Database
de Firebase, que cobra 1 $ por GB. El 11-10-2026 eso eran unos 650 MB por hora.
Con el TURN de Cloudflare ese tráfico va por Cloudflare: **1.000 GB gratis al mes**
y después 0,05 $ por GB.

Piezas:
- `cloudflare/turn-worker.js`: un Worker de Cloudflare (gratis) que da claves TURN
  temporales sólo a jugadores con cuenta (comprueba su token de Firebase).
- `js/net/net.js`: el juego pide las claves a `https://turn.pokesurvivor.com/` al
  entrar en una sala. Si el Worker no responde, todo sigue como antes.

## Pasos (en https://dash.cloudflare.com)

### 1. Crear la clave TURN
1. Menú de la izquierda: **Realtime** (puede salir como *Calls*) → **TURN Server**.
2. **Create** → nombre `pokesurvivor` → **Create**.
3. Copia y guarda los dos valores que salen (el API Token sólo se ve una vez):
   - **Turn Token ID**
   - **API Token**

### 2. Crear el Worker
1. Menú: **Workers & Pages** → **Create** → **Create Worker** (o *Start with Hello World*).
2. Nombre: `pokesurvivor-turn` → **Deploy**.
3. **Edit code**: borra todo, pega el contenido de `cloudflare/turn-worker.js` → **Deploy**.

### 3. Guardar las claves en el Worker
1. En el Worker: **Settings** → **Variables and Secrets** → **Add**.
2. Tipo **Secret**, nombre `TURN_KEY_ID`, valor: el *Turn Token ID* → guardar.
3. Otra vez **Add**: tipo **Secret**, nombre `TURN_KEY_API_TOKEN`, valor: el *API Token*.
4. **Deploy** si te lo pide.

### 4. Ponerle la dirección turn.pokesurvivor.com
1. En el Worker: **Settings** → **Domains & Routes** → **Add** → **Custom domain**.
2. Escribe `turn.pokesurvivor.com` → **Add domain**. Cloudflare crea solo el registro DNS
   (no hay que tocar los registros de GitHub).

Cuando esté, avisa: se comprueba que el Worker da claves y se sube el juego.

## Contador "N jugando ahora" (mismo Worker)

El Worker también tiene la ruta `/online`: cada pestaña avisa al abrir el juego y
cada 20 min, y un Durable Object (`Online`, gratis en el plan Free) cuenta las
sesiones de los últimos 25 min. No usa Firebase. Si se acaba el cupo gratis del
día (100.000 llamadas), el contador no sale y nada más: el plan Free no cobra.

Como necesita el Durable Object, este Worker se despliega con wrangler desde la
carpeta `cloudflare/` (ver `wrangler.toml`; las claves del TURN se conservan):

    npx wrangler login      (una vez)
    npx wrangler deploy
