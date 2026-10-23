# Pallet Sure · Calculadora web de ahorro FIXBOX

Web estática responsive (HTML + CSS + JavaScript sin frameworks, cookies, servidores ni dependencias externas). Diseñada para enlazarse mediante código QR y funcionar en móvil y escritorio.

## Abrir y probar

Abre `index.html` en un navegador moderno. Pulsa **Cargar ejemplo** para ver el escenario procedente del Excel original; ese ejemplo **no es un presupuesto** ni un ahorro comercial validado. Para una simulación propia, introduce los datos y pulsa **Siguiente → Ver mi estimación**.

Opcionalmente, con Python instalado: `python -m http.server 8000` y visita `http://localhost:8000`.

## Publicar en GitHub Pages

1. Crea un repositorio público o privado compatible con GitHub Pages; carga el contenido de **esta carpeta** en la raíz del repositorio (`index.html`, `styles.css`, `app.js`, `calculator.js`, `assets/` y `.nojekyll`).
2. En **Settings → Pages → Build and deployment** elige **Deploy from a branch**, rama `main` y carpeta `/ (root)`; guarda.
3. Espera a que Pages muestre la URL del sitio y comprueba la calculadora en un teléfono. La URL final solo puede conocerse después de publicar.

## Publicar en Netlify

1. Entra en https://app.netlify.com/drop y arrastra **la carpeta** `palletsure-calculadora` (descomprime primero el ZIP). Alternativamente, conecta el repositorio Git a Netlify.
2. Netlify asignará una URL HTTPS; comprueba las pantallas 1, 2 y 3 y la exportación mediante **Guardar como PDF**.
3. Si conectas un dominio propio, utiliza la nueva URL pública definitiva para el QR.

No hay paso de compilación (`build`), ni variables de entorno, ni servicios a contratar para el cálculo.

## Cómo usar el QR del cartel

El QR que figura en la imagen proporcionada codifica **`https://qrco.de/bh4WGK`**; es un enlace intermedio, no la URL de un archivo HTML. **No hemos verificado el destino final ni tenemos control sobre ese enlace.**

- Si tienes acceso a la cuenta con la que se creó el QR y la plataforma permite editar su destino, actualiza **ese QR** para que redirija a la URL pública de GitHub Pages/Netlify. Podrás conservar el diseño y la impresión actual.
- Si no tienes acceso, no es editable o ha caducado, necesitarás generar un **QR nuevo** con la URL del simulador publicado y sustituir el QR en el cartel.
- Antes de imprimir, escanéalo desde la cámara de un móvil real (idealmente Android y iPhone), y verifica que abre el dominio correcto por HTTPS.

## Modelo matemático

Archivo fuente: `Calculadora Ahorro FixBox.xlsx`, localizado en Google Drive el 23/10/2026. La herramienta **no copia dos errores conocidos** de dicho Excel y añade costes opcionales relevantes.

| Concepto | Fórmula de la web |
| --- | --- |
| Consumo anual de film | palés/año × kg/palé × €/kg |
| Mano de obra con film | palés/año × segundos/palé / **3600** × €/hora |
| Impuesto (solo cuando se activa) | palés/año × kg/palé × % de material no reciclado × €/kg |
| Mano de obra FIXBOX | palés/año × segundos/palé / **3600** × €/hora |
| Desgaste técnico imputado por uso | palés/año × piezas/palé × precio unitario / usos por pieza |
| Retorno | palés/año × coste de retorno por palé |
| Pérdidas | palés/año × piezas/palé × precio unitario × tasa estimada de pérdidas |
| Diferencia anual | coste total de film − coste total de FIXBOX |
| Inversión inicial | unidades adquiridas inicialmente × precio unitario |
| Payback simple (meses) | inversión inicial / **ahorro de caja** anual × 12, únicamente si este es positivo |

El **ahorro de caja anual** se calcula como coste anual de film menos (mano de obra FIXBOX + retorno + pérdidas), **sin amortización técnica** para evitar duplicar esa partida con la inversión inicial. La amortización técnica sí entra en la comparación de **costes económicos anuales**.

Correcciones respecto al Excel:

1. `B20` y `B25` dividían los segundos entre 60 (minutos); la unidad del coste es por hora y requiere dividir entre **3600**. De lo contrario se inflan los costes laborales 60 veces.
2. `B32` comprobaba `B29`, una celda vacía, y por eso devolvía `0` en el ejemplo. La web calcula el payback sobre la caja liberada y distingue los casos sin retorno.
3. El impuesto de 0,45 €/kg **no siempre debe sumarse adicionalmente al precio del film**. En la web está desactivado por defecto y requiere verificar su repercusión y la fracción de plástico no reciclado. Fuente: https://sede.agenciatributaria.gob.es/Sede/impuestos-especiales-medioambientales/impuesto-especial-sobre-envases-plastico-reutilizables/base-imponible-tipo-impositivo-cuota-tributaria.html

### Ejemplo del Excel, ya corregido

Con los mismos valores del Excel e **impuesto activado por separado únicamente a efectos ilustrativos**:

- Coste film: **1.050,00 €/año**, frente a 19.487,50 € que devolvía el Excel original.
- Coste FIXBOX: **23,33 €/año**, frente a 1.252,50 € del Excel.
- Diferencia anual: **1.026,67 €/año**, frente a 18.235,00 €.

Si el impuesto ya está incluido en el precio del film y no se añade de nuevo: coste film **937,50 €/año** y diferencia anual **914,17 €/año**.

**Atención**: los valores del Excel (precio FIXBOX de 5 €, vida útil de 1.000 ciclos, 1 pieza por palé y stock de 1 unidad) son **hipótesis no verificadas**. La calculadora las muestra como demostración, no como condiciones comerciales. El coste real depende además de la logística de retorno, compatibilidad de carga, inventario simultáneo, mermas, implantación y reposiciones. La web se centra en FIXBOX reutilizable, como el Excel de origen; no extrapolar a FIXBOX Eco de un solo uso.

## Privacidad

Los campos se calculan localmente en JavaScript. La aplicación no tiene backend, no envía resultados a terceros, no introduce analítica ni usa cookies o `localStorage`. El botón **Compartir resumen** solo comparte un texto cuando el usuario lo pulsa. En caso de compartirlo, la aplicación receptora elegida por el usuario recibirá ese texto. La publicación en GitHub Pages o Netlify puede generar registros técnicos de acceso propios del proveedor de hosting.

## Probar la lógica

Si tienes Node.js: `node --test tests/calculator.test.cjs`.

## Archivos

- `index.html`: estructura, contenido y metadatos.
- `styles.css`: diseño responsive, accesibilidad y formato de impresión.
- `calculator.js`: motor matemático y validaciones independiente.
- `app.js`: pasos del formulario, resultados, compartir e imprimir.
- `assets/logo-palletsure.png`: símbolo extraído del cartel facilitado.
- `assets/fixbox-cajas.webp`: fotografía recortada del cartel facilitado.
- `assets/favicon.svg`: icono simplificado para la pestaña.
- `netlify.toml`: cabeceras básicas de seguridad para despliegue en Netlify.
- `tests/calculator.test.cjs`: pruebas del motor.

© Pallet Sure. Material de campaña reutilizado de la imagen aportada por la propietaria de la solicitud.
