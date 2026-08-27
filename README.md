# AI profile

Encuesta HTML de una pregunta por pantalla para construir un perfil de uso de IA docente.

## Configuración local

Abre `index.html` en un navegador. La encuesta funciona sin backend y permite revisar todo el flujo; al final mostrará un aviso hasta configurar el endpoint.

## Conectar Google Sheets y Apps Script

1. Crea una hoja de cálculo nueva. Esta será la base de datos de respuestas.
2. En esa hoja abre **Extensiones > Apps Script**.
3. En el editor, abre `Code.gs`, elimina el contenido de ejemplo y pega el contenido de este repositorio.
4. En la primera línea de configuración cambia `REPORT_RECIPIENT` por el correo que recibirá los reportes.
5. En Apps Script abre **Configuración del proyecto**, activa **Mostrar el archivo de manifiesto `appsscript.json`** y reemplaza su contenido con el archivo `appsscript.json` de este repositorio.
6. Guarda el proyecto. Selecciona la función `setup` en el editor, pulsa **Ejecutar** una vez y acepta los permisos solicitados para Sheets, Drive y correo. Si aparece una advertencia de Google, entra en **Avanzado > Ir a proyecto (no seguro)**; es normal para un Apps Script creado por ti.
7. Selecciona **Implementar > Nueva implementación**.
8. Tipo: **Aplicación web**.
9. Ejecutar como: **Yo**.
10. Quién tiene acceso: **Cualquier persona**.
11. Pulsa **Implementar** y copia la URL que termina en `/exec`.
12. En `app.js`, pega esa URL entre las comillas de `SCRIPT_URL`.
13. Publica o aloja los archivos `index.html`, `styles.css`, `app.js` y `logo.png`.

La pestaña `Responses` se crea automáticamente con la primera respuesta. Cada envío agrega una fila y genera un email individual con los datos del profesor. El enlace `doGet` sirve como prueba: al abrir la URL `/exec` debe mostrar `AI profile endpoint is ready.`

## Reporte individual

Cada respuesta genera un PDF determinístico de una sola página, en inglés. Incluye el logo, fecha, identidad del profesor, rol, experiencia, frecuencia de uso, usos actuales, asistentes, otras herramientas, perspectiva, objetivos y respuestas abiertas. No calcula una nota ni un nivel general.

El PDF se guarda en la carpeta de Drive indicada en `REPORT_FOLDER_ID`. La columna `Report PDF` de `Responses` contiene un enlace `Download PDF`. Para incluir el logo en el PDF:

1. Sube `logo.png` a Google Drive.
2. Abre el archivo y copia su ID desde la URL.
3. Pega ese ID en `REPORT_LOGO_FILE_ID` dentro de `Code.gs`.
4. Verifica que la cuenta que ejecuta Apps Script tenga permiso para leer ese archivo.

`MAKE_REPORT_PUBLIC = true` hace que el PDF pueda descargarse con el enlace. Si la política de tu colegio no permite enlaces públicos, cambia ese valor a `false`; entonces el profesor necesitará acceso a la carpeta de Drive.

Por defecto, `SEND_REPORT_TO_TEACHER = true` envía también el enlace al correo indicado por el profesor. Puedes cambiarlo a `false` si solamente quieres recibir tú el reporte.

### Archivos de Apps Script

- `Code.gs`: endpoint que recibe la encuesta, escribe en Sheets y envía el reporte.
- `appsscript.json`: runtime, zona horaria y permisos mínimos.

### Importante

No compartas la URL del Web App públicamente si no deseas recibir respuestas externas. Si cambias el código después de desplegarlo, usa **Implementar > Administrar implementaciones > Editar > Nueva versión** para publicar la actualización.