# TianshanOS

Esta guía está basada en TianshanOS 0.6.2. Todavía se puede utilizar con versiones posteriores donde las funciones y los pasos permanecen sin cambios. Si los controles, mensajes o resultados difieren, consulte la guía para su versión instalada.

Esta guía cubre comprobaciones del sistema, controles de dispositivos, redes, archivos y actualizaciones de firmware para la cuenta admin. La Guía de operaciones raíz cubre el acceso al terminal, los comandos remotos y la configuración de automatización. Consulte la Guía de seguridad separada para conocer la gestión de la seguridad.

Utilice los controles que se muestran en su dispositivo. Algunos necesitan hardware o configuración específicos. En una computadora, coloque el cursor sobre un botón con un ícono para ver su nombre.

## 1. Empezando

### Abra la interfaz de usuario web

1. Abra la interfaz web del dispositivo (WebUI) utilizando la dirección proporcionada por su administrador.
2. Seleccione "Iniciar sesión" en la esquina superior derecha.
3. Mantenga `admin` como nombre de usuario e ingrese la contraseña admin proporcionada con el dispositivo.
4. Seleccione "Iniciar sesión". Después de iniciar sesión correctamente, el nombre de usuario actual aparece en la esquina superior derecha.

Al iniciar sesión con la contraseña predeterminada se abre un "Recordatorio de seguridad". Ingrese la contraseña actual, luego ingrese la nueva contraseña dos veces y seleccione "Cambiar ahora". Ambas entradas de nueva contraseña deben coincidir. Seleccione "Más tarde" para cerrar el recordatorio.

Cuando haya terminado, seleccione "Cerrar sesión" en la esquina superior derecha. Deberá iniciar sesión nuevamente para usar el dispositivo.

### Cambiar idioma

Seleccione el botón de idioma en la parte superior de la página, luego elija chino o inglés. El contenido de la página y las etiquetas de control cambian inmediatamente.

### Navegación por las páginas

Las páginas principales de admin son:

- “Sistema”: vea el estado del dispositivo, los módulos de control, los ventiladores y los LED, y abra la actualización OTA.
- “Red”: Verifique el estado de Ethernet y los clientes DHCP, configure WiFi y administre el reenvío de NAT.
- “Archivos”: Administre archivos en la tarjeta SD y SPIFFS.
- “Seguridad”: abra la página de administración de seguridad separada. Consulte la Guía de seguridad para obtener instrucciones.

## 2. Estado del sistema y operaciones de rutina

Seleccione "Sistema" en la navegación superior.

### Ver el estado de los recursos y servicios

«Recursos del chip de administración» muestra el uso de CPU, DRAM y PSRAM de ese chip. Los valores no corresponden a AGX ni a LPMU.

- Seleccione "Detalles" para ver la memoria total, utilizada y libre y otra información de la memoria.
- “Servicios” muestra el número de servicios en ejecución y el total. Selecciónelo para ver el estado y la etapa de inicio de cada servicio.
- Si un servicio informa un problema, actualice su estado. Para reiniciarlo, siga "Reiniciar un servicio" a continuación.

### Ver información del sistema y de energía La “Descripción general del sistema” de

«Vista general del sistema» muestra el chip, la versión del firmware, la versión de ESP-IDF y el tiempo de funcionamiento. Para el uso diario, compruebe la versión del firmware. ESP-IDF es el marco de software que utiliza el dispositivo.

El lado derecho de la tarjeta muestra el voltaje de entrada, el voltaje interno, la corriente, la potencia y el estado de protección.

El interruptor al lado del estado de protección habilita o deshabilita la protección de bajo voltaje. Cuando está habilitado, el dispositivo utiliza los voltajes y retrasos guardados para apagarse a bajo voltaje y reiniciarse después de que se recupera la energía.

### Ver red y hora

“Red y hora” muestra Ethernet, WiFi, dirección IP, hora actual, estado de sincronización, fuente horaria y zona horaria.

- Seleccione “Sincronizar hora” para copiar la hora actual del navegador al dispositivo.
- Seleccione "Zona horaria", elija un ajuste preestablecido o ingrese una configuración de zona horaria compatible, luego guarde.
- Seleccione “Actualización OTA” para abrir la página de actualización del firmware.

### Operaciones avanzadas

#### Reiniciar TianshanOS

Un reinicio interrumpe temporalmente la WebUI y la administración del dispositivo. Finalice las operaciones activas, luego seleccione "Reiniciar" y confirme. Espere a que el dispositivo se recupere y luego vuelva a abrir la WebUI.

#### Reiniciar un servicio

Reiniciar un servicio interrumpe temporalmente la función que proporciona. Abra "Estado del servicio", busque el servicio afectado y seleccione "Reiniciar" en esa fila. Verifique su estado nuevamente cuando finalice la operación.

#### Cambiar configuración de apagado

Estas configuraciones controlan cuándo el dispositivo se apaga después de una caída de voltaje y cuándo se reinicia después de que se recupera la energía. Utilice valores que coincidan con los requisitos de energía de su dispositivo.

Seleccione "Configuración de apagado" para cambiar:

- “Umbral de Bajo Voltaje”: Inicia la cuenta regresiva de apagado por debajo de este voltaje.
- “Umbral de voltaje de recuperación”: Inicia la recuperación por encima de este voltaje.
- “Cuenta regresiva de apagado”: ​​establece el retraso antes del apagado después de que se detecta bajo voltaje.
- “Tiempo de espera de recuperación”: establece el tiempo de espera utilizado para confirmar la recuperación de energía estable.
- “Retraso de parada del ventilador”: establece el retraso antes de que los ventiladores se detengan después del apagado.

Guarde el formulario para aplicar la configuración de protección actualizada.

#### Cambia el objetivo superior USB

Cambiar el objetivo USB puede desconectar temporalmente un dispositivo conectado. Confirme el objetivo y finalice el trabajo activo antes de continuar.

Los dispositivos que admiten la conmutación USB muestran un botón "USB". Cada clic cambia el puerto USB superior al siguiente destino: ESP, AGX y luego LPMU. Verifique el objetivo que se muestra en el botón y el mensaje de la página para confirmar el resultado.

## 3. Panel de dispositivos

El "Panel de dispositivos" está en la página "Sistema". Contiene controles de energía del módulo, acciones rápidas y widgets de datos.

### Controla AGX y LPMU

Guarde el trabajo en el módulo y complete su proceso de apagado normal antes de desconectar la alimentación. El apagado forzado puede provocar la pérdida de datos no guardados.

- “AGX Power” muestra el estado de control de energía. Selecciónelo para encender o apagar, luego espere la confirmación.
- “LPMU Power” muestra “En línea”, “Fuera de línea” o “Desconocido”. Estos estados provienen de una verificación de red. En línea significa que se puede acceder al módulo; fuera de línea significa que no lo es. Ninguno de los estados por sí solo confirma si el módulo está encendido o apagado.
- Seleccionar el botón LPMU desencadena la misma acción que presionar su botón de encendido físico. Espere la verificación y el resultado mostrado. Si desconoce el resultado, verifique el módulo y la red antes de presionar el botón nuevamente.

### Usar acciones rápidas

Un usuario root configura las tarjetas de acciones rápidas. Mostrar una tarjeta y permitir su ejecución manual son ajustes distintos. Una tarjeta visible puede no permitir iniciar la tarea.

1. Verifique el nombre de la tarjeta, el estado y los controles disponibles para identificar la tarea.
2. Seleccione una tarjeta disponible y espere a que cambie su estado. No vuelva a iniciar la tarea mientras se esté procesando.
3. Las tareas en segundo plano pueden proporcionar controles de registro, verificación de estado o detención. Lea el registro para ver el resultado de la tarea. Después de seleccionar detener, verifique que la tarea se haya detenido.
4. Si el estado es desconocido o el inicio está bloqueado, utilice el control de verificación disponible o solicite a un usuario de root que verifique la regla, el comando remoto y la conexión del host.

Si no puede iniciar la tarea, siga las indicaciones del mensaje. No pulse Inicio repetidamente:

- Regla deshabilitada o ejecución manual no permitida: pida a un usuario root que revise los ajustes. Que la tarjeta sea visible no autoriza a ejecutar la tarea.
- Tarea en ejecución, iniciándose, verificándose o deteniéndose: espere a que se actualice el estado.
- Servicio vinculado en ejecución: no lo inicie otra vez. Para reiniciarlo, deténgalo primero y confirme el resultado.
- Parada del servicio sin confirmar: verifique su estado. Si sigue sin poder confirmarlo, pida a un usuario root que revise la conexión al host.
- Regla sin cargar o pendiente de eliminar tras el reinicio: pida a un usuario root que revise la versión de la regla y el mensaje de reinicio pendiente.
- La automatización no acepta solicitudes de inicio: pida a un usuario root que revise el motor y la configuración. No reinicie el dispositivo por su cuenta.

<!-- operational-note -->
Confirme que un servicio se haya detenido antes de reiniciarlo. Es posible que aún esté en curso una solicitud de inicio o detención aceptada; esperar el estado final. Después de activar una acción, espere unos segundos antes de iniciar otra.

Mantenga presionada una tarjeta hasta que aparezca el indicador de reorden, luego arrástrela para cambiar el orden de visualización.

Si no hay tarjetas disponibles, verifique qué mensaje muestra la página:

- “Cargando acciones rápidas”: Espere a que la configuración termine de cargarse. Si el mensaje persiste, actualice la página o solicite a un usuario de root que investigue.
- «Acciones rápidas no disponibles»: pida ayuda a un usuario root. No pulse Inicio repetidamente.
- No hay acciones rápidas configuradas: si necesita una, solicite a un usuario de root que verifique la configuración "Mostrar en panel" de las reglas.

<!-- operational-note -->
Tras importar un paquete de reglas, una tarjeta puede seguir ejecutando la tarea anterior hasta que se reinicie el dispositivo. Las reglas nuevas o pendientes de eliminar pueden no permitir el inicio. Si la tarea acaba de cambiar, pida a un usuario root que confirme la versión en uso antes de ejecutarla.

No reinicie un dispositivo que proporciona servicios activos solo para restaurar una tarjeta.

### Administrar widgets de datos

Los widgets de datos muestran los datos del dispositivo en el «Panel de dispositivos» y los actualizan durante el uso.

1. Seleccione "Administrador de widgets".
2. Elija un intervalo de actualización o desactive la actualización automática.
3. Agregue un widget preestablecido o elija un estilo de componente y fuente de datos ofrecidos por la página.
4. Edite su etiqueta, estilo de visualización y unidad según sea necesario y luego guárdelo.

Los widgets existentes se pueden editar, eliminar y reordenar. También puede seleccionar una tarjeta de widget para editarla. Mantenga presionado un widget y luego arrástrelo a una nueva posición.

## 4. Gestión de fans

<!-- operational-note -->
"Control del ventilador" está en la página "Sistema". Las tarjetas de fans muestran los fans proporcionados por su dispositivo. Verifique el número del ventilador antes de cambiar una curva.

### Ver estado del ventilador

La barra de estado muestra «Temperatura efectiva» y «Salida actual». El porcentaje grande es el ajuste de regulación confirmado por el dispositivo, no la velocidad medida. RPM indica las revoluciones por minuto medidas y no aparece si no hay una lectura válida. Si el porcentaje muestra `--`, la salida actual no está confirmada.

Al mover el deslizador manual, el valor situado a su lado muestra el ajuste que va a solicitar. El porcentaje grande sigue mostrando la salida actual. Suelte el deslizador y compruebe el mensaje y el valor actualizado. Si el valor solicitado no coincide con la salida actual, no dé el ajuste por aplicado.

El modo inteligente muestra su estado: «Modo inteligente», «Siguiendo la curva», protección o temperatura no válida. También muestra la temperatura de referencia de seguridad, la prevista dentro de 45 segundos y la velocidad de cambio de temperatura.

Si la temperatura deja de ser válida, verifique que su fuente aún se esté actualizando. El dispositivo cambia al control de protección en caso de pérdida de temperatura. Seleccione “TTI” para obtener una explicación del control térmico inteligente.

Utilice el botón de actualización en el encabezado de la sección para obtener el estado actual. Si el ajuste falla o la salida no está confirmada, verifique el dispositivo antes de decidir si desea volver a intentarlo.

### Seleccione un modo de funcionamiento

| Propósito de | Función |
| --- | --- |
| “Apagado” | Detiene el ventilador. |
| “Manual” | Utiliza un porcentaje de control fijo establecido con el control deslizante 0-100%. |
| “Curva” | Sigue la curva de porcentaje de temperatura a control configurada. |
| “inteligente” | Utiliza la curva base, las tendencias de temperatura y los ajustes anteriores para controlar el enfriamiento. Utiliza control protector cuando es necesario. |

Detener un ventilador o establecer un valor manual bajo reduce la refrigeración. Primero verifique la carga y la temperatura y siga monitoreándolas. El control deslizante solo está disponible en el modo Manual cuando se confirma la salida actual.

### Configurar una curva de ventilador

Seleccione "Curva" en el encabezado de la sección Control del ventilador para abrir "Gestión de la curva del ventilador". El botón “Curva” dentro de una tarjeta solo cambia el modo de funcionamiento.

1. En "Ventilador", elija el número que desea ajustar y compárelo con la página Sistema.
2. En “Enlace de variable de temperatura”, agregue variables de temperatura y asigne pesos.
3. Seleccione "Enlazar". La fuente de temperatura es compartida por los ventiladores en los modos Curva e Inteligente, por lo que cambiarla afecta a los ventiladores que usan esa fuente.
4. Agregue o edite “Nodos de curva”. Cada curva necesita al menos nodos 2 y admite hasta 10.
5. Establezca “Velocidad mínima” y “Velocidad máxima” como porcentajes de control. El mínimo no debe exceder el máximo.
6. Ajuste «Histéresis de temperatura» e «Intervalo mínimo». La histéresis admite 0-20°C y evita ajustes frecuentes ante pequeños cambios de temperatura. El intervalo admite 500-30000 ms. 1000 ms equivalen a 1 segundo.
7. Seleccione "Guardar curva". Después de guardar correctamente, el ventilador seleccionado cambia al modo Curva. Para utilizar el control térmico inteligente, regrese a la tarjeta y seleccione "Inteligente".

Si falla el guardado, lea el mensaje y verifique el estado actual antes de volver a intentarlo. Después de desvincular las variables de temperatura, verifique también la temperatura efectiva y el estado del ventilador.

### Importar y exportar una curva

- Seleccione "Importar configuración" y elija un archivo de curva JSON. JSON es el formato de archivo utilizado para almacenar datos de curvas. Revise los nodos, los límites y el número de ventilador, luego seleccione "Guardar curva" para aplicarlos.
- Seleccione "Exportar configuración" para descargar la curva actual. La página también intenta guardar una copia en `/sdcard/config` en la tarjeta SD. Verifique la descarga del navegador y el resultado informado de la tarjeta SD por separado.

### Utilice una temperatura de prueba

Una temperatura de prueba reemplaza temporalmente la fuente normal y afecta el control Curve o Smart. Supervise el ventilador y el dispositivo durante toda la prueba.

1. Ingrese 0-100°C en "Temperatura de prueba".
2. Seleccione "Prueba" y observe la salida actual, el estado y la respuesta del ventilador.
3. Al terminar, seleccione «Borrar prueba». Compruebe que la temperatura efectiva vuelva a obtenerse de la fuente habitual.

## 5. Gestión de LED

“Control LED” está en la página “Sistema” y muestra los LED proporcionados por el dispositivo. Las funciones disponibles varían según el LED.

### Controles habituales

- Utilice el botón de la bombilla en la parte inferior de una tarjeta para encender o apagar el LED.
- Mueva el control deslizante "Brillo" o elija un color o ajuste preestablecido.
- Utilice el botón de animación para abrir "Configuración de LED". Seleccione una animación en "Animación programática" y luego use su control de reproducción o detención.
- Seleccione el icono de guardar en la parte inferior derecha de la tarjeta para guardar la configuración de LED actual.
- Seleccione "Todo apagado" para apagar todos los LED y verificar el resultado informado. Si algunos fallan, verifique esos dispositivos.

### Las tarjetas Matrix

Las tarjetas de la matriz tienen iconos para las funciones disponibles. Abra una función y cambie de grupo en «Ajustes LED»:

- “Animación programática”: seleccione y ejecute una animación.
- “Imagen/Código QR”: elija una imagen de la tarjeta SD o ingrese el contenido para un código QR.
- “Visualización de texto”: establece texto, fuente, alineación, desplazamiento, primer plano y fondo.
- “Filtro de posprocesamiento”: elija un filtro y parámetros, luego aplíquelos o deténgalos.
- “Corrección de color”: ajuste la pantalla y utilice los controles de reinicio, importación o exportación disponibles.

Verifique la luz real o la visualización de la matriz después de aplicar un cambio. Utilice únicamente las funciones que se muestran. Si falla una configuración, siga el mensaje para verificar el archivo, la entrada o el estado del dispositivo.

## 6. Gestión de red

<!-- operational-note -->
Seleccione "Red" en la navegación superior para abrir "Configuración de red". Cambiar el modo de red, el punto de acceso o la configuración de NAT puede interrumpir la conexión WebUI actual. Antes de guardar, asegúrese de poder volver a conectarse a través de la nueva dirección de red.

### Ver el estado de la red

La parte superior de la página muestra el estado de Ethernet, el cliente WiFi y el AP WiFi. Abra el panel relacionado para ver la dirección IP, la máscara de subred, la puerta de enlace, DNS, la dirección MAC, SSID, la señal y los recuentos de dispositivos conectados cuando estén disponibles.

El panel Ethernet muestra el enlace actual y la información de la dirección. No proporciona controles de edición de direcciones.

### Seleccione un modo WiFi

| Propósito de | Función |
| --- | --- |
| “Apagado” | Desactiva WiFi. |
| “Estación (STA)” | Conecta el dispositivo a una red WiFi existente. |
| “Punto de acceso (AP)” | Hace que el dispositivo proporcione un punto de acceso WiFi. |
| “STA+AP” | Se conecta a una red WiFi existente mientras mantiene disponible el punto de acceso del dispositivo. |

Después de elegir un modo, espere a que la página actualice el estado. La conexión inalámbrica actual puede interrumpirse durante el cambio.

### Conectar a WiFi

1. Configure el modo WiFi en “Estación (STA)” o “STA+AP”.
2. En "Estación", seleccione "Escanear".
3. Elija una red de la lista. La lista muestra SSID, intensidad de la señal, canal y tipo de autenticación.
4. Introduzca la contraseña y confirme. Deje la contraseña en blanco para una red abierta.
5. Espere a que el estado cambie a "Conectado" y luego confirme la nueva dirección IP.

Seleccione "Desconectar" para finalizar la conexión actual del cliente WiFi.

### Configurar el AP WiFi

1. Configure el modo WiFi en “Punto de acceso (AP)” o “STA+AP”.
2. En "Hotspot", seleccione "Configuración".
3. Introduzca el SSID. Una contraseña en blanco crea un punto de acceso abierto; un punto de acceso protegido requiere al menos caracteres 8.
4. Seleccione un canal y habilite “Ocultar SSID” si es necesario.
5. Seleccione "Aplicar" y espere a que se actualice el estado del punto de acceso.

Seleccione "Dispositivos" para ver los clientes actualmente conectados al punto de acceso.

### Establecer el nombre de host

Ingrese un nuevo nombre en la sección "Nombre de host" en "Servicios de red", luego seleccione "Establecer". La página muestra el nombre de host actual después de actualizarse.

### Ver clientes DHCP

DHCP asigna automáticamente direcciones de red a los dispositivos conectados. Seleccione "Clientes", elija "WiFi AP" o "Ethernet" y vea los arrendamientos actuales. Utilice el botón de actualización para recargar la lista.

### Operaciones de red avanzadas

#### Configurar la puerta de enlace NAT

NAT reenvía el tráfico de red entre las interfaces de red del dispositivo. Habilite o deshabilite NAT, luego seleccione "Guardar" para conservar la configuración. Verifique el estado del WiFi y de Ethernet luego.

#### Acceda a la red ascendente a través de LPMU

<!-- operational-note -->
Esta operación utiliza el host LPMU configurado para configurar el acceso a la red. Antes de comenzar, confirme que se pueda acceder a LPMU y que los cables de red estén conectados. Obtenga la contraseña sudo para la cuenta SSH en ese host. Esta contraseña autoriza cambios en el sistema y puede diferir de la contraseña de WebUI.

1. En "Acceso a la red ascendente", seleccione "Acceso a través de LPMU".
2. Ingrese la contraseña sudo LPMU y seleccione el botón de acceso. La contraseña se utiliza sólo para esta ejecución y no se guarda; ingréselo nuevamente para una ejecución posterior.
3. Espere a que finalice la operación. No lo inicie nuevamente mientras procesa.
4. El acceso se confirma solo cuando el resultado informa tanto una conexión a Internet como una configuración de red completa.
5. Si falla o el resultado no está confirmado, lea primero el motivo. Expanda "Registro de ejecución" para obtener más detalles. Verifique la contraseña para ver si hay un error de contraseña, o el cableado y la red ascendente si no se encuentra una conexión a Internet.

Una solicitud de estado fallida no significa que el script se haya detenido. Utilice el control "Actualizar estado" disponible para verificar la ejecución actual antes de decidir si desea volver a intentarlo.

## 7. Gestión de archivos

Seleccione "Archivos" en la navegación superior para abrir el "Administrador de archivos".

La tarjeta SD es un almacenamiento extraíble y SPIFFS es un almacenamiento de archivos interno del dispositivo. Seleccione “Tarjeta SD” o “SPIFFS” para cambiar de ubicación. La ruta en la parte superior muestra su carpeta actual. Seleccione un nombre de carpeta en la ruta para volver a ella.

### Explorar y administrar archivos

- Seleccione un nombre de carpeta para abrirla.
- Seleccione el botón de descarga al lado de un archivo para guardarlo en la ubicación de descarga del navegador.
- Seleccione el botón de cambio de nombre, ingrese un nuevo nombre y confirme.
- Seleccione “Nueva carpeta”, ingrese un nombre de carpeta y créela.
- Seleccione el botón Actualizar para recargar el directorio actual y el estado de almacenamiento.

### Cargar archivos

Los archivos solo se pueden subir a la tarjeta SD, no a SPIFFS. Compruebe primero que la tarjeta SD esté montada.

1. Seleccione «Tarjeta SD» y abra la carpeta donde desea subir los archivos.
2. Seleccione "Cargar archivos".
3. Seleccione uno o más archivos o arrastre archivos al área de carga.
4. Revise la lista de carga y elimine archivos no deseados.
5. Seleccione "Cargar" y espere a que cada archivo muestre su finalización.

Al subir un paquete `.tscfg`, se abren los pasos de verificación y aplicación. Esta página de archivos todavía no aplica los ajustes del paquete. Que la carga o la verificación se complete no significa que los ajustes estén activos.

Proporciona paquetes de reglas a un usuario de root para importarlos en Automatización. La carga normal de archivos no sustituye a la importación de reglas. Consulte la Guía de seguridad para obtener orientación sobre fuentes y firmas para otros paquetes.

### Operaciones por lotes

Después de seleccionar archivos o carpetas, aparece la barra de herramientas por lotes.

- «Descarga por lotes» descarga los archivos seleccionados. No incluye las carpetas.
- “Eliminar por lotes” elimina los archivos y carpetas seleccionados.
- “Borrar selección” borra la selección actual.

### Eliminar un archivo o carpeta

La eliminación no se puede deshacer en la WebUI. Al eliminar una carpeta también elimina su contenido. Compruebe el nombre y la ruta antes de seleccionar «Eliminar» o «Eliminar por lotes» y confirmar.

### Montar y desmontar la tarjeta SD

Al desmontar la tarjeta SD, sus archivos dejan de estar disponibles hasta volver a montarla. Termine las cargas, descargas y otras operaciones de archivos antes de seleccionar «Desmontar SD».

Si retira o cambia la tarjeta que guarda la configuración de automatización, esta puede no cargarse tras el reinicio. Pida a un usuario root que confirme si puede desmontarla. No la desmonte ni la retire cuando la página indique que debe permanecer insertada.

Cuando la tarjeta SD no está montada, la página muestra "Montar SD". Selecciónelo, espere a que el estado cambie a "Montado" y luego abra nuevamente el directorio de la tarjeta SD.

## 8. Actualizaciones de OTA

En la página "Sistema", seleccione "Actualización OTA" en la sección "Red y hora" para abrir "Actualización de firmware".

<!-- operational-note -->
El dispositivo se reinicia durante una actualización, desconectando temporalmente la WebUI. Guarde el trabajo activo y mantenga estable la energía del dispositivo antes de comenzar. No apague el dispositivo mientras el progreso de la actualización esté incompleto.

### Buscar actualizaciones desde un servidor OTA

1. Revise la “Versión actual”.
2. Introduzca la dirección del servidor OTA proporcionada por un administrador o editor.
3. Seleccione "Guardar" y luego seleccione "Verificar actualización".
4. La página informa "Actualización disponible", "Ya actualizado", una versión anterior del servidor o un error.
5. Confirme la versión de destino, luego seleccione "Actualizar ahora" o el control de actualización que se muestra en la página.
6. Espere a que finalice la descarga, la instalación y el reinicio. Para cancelar, utilice el botón “Abortar” cuando esté disponible. No todas las etapas admiten la cancelación.
7. Vuelva a conectarse a la WebUI después de que el dispositivo vuelva a estar en línea y verifique la "Versión actual".

Cuando está habilitado “Actualizar también www”, el firmware y la WebUI se actualizan en secuencia. Para 0.6.2, utilice el firmware principal coincidente y los recursos WebUI proporcionados por el editor, ambos de la misma versión. Si la interfaz anterior permanece después de la actualización, fuerce la actualización del navegador y verifique la versión y la página nuevamente.

### Actualización manual

Expanda “Actualización manual” y elija uno de estos métodos:

- “Actualizar desde URL”: Ingrese la URL del firmware, configure “Actualizar también www” de acuerdo con las instrucciones de la versión y luego seleccione “Actualizar”. Aquí, www se refiere a los recursos de la interfaz web del dispositivo.
- “Actualización desde tarjeta SD”: Ingrese una ruta de firmware como `/sdcard/firmware.bin`. Si está habilitado "Actualizar también www", asegúrese de que `www.bin` de la misma versión esté en ese directorio.

Para una actualización desde una URL, "Omitir verificación de certificado" omite la verificación del certificado del servidor HTTPS. Esto elimina la verificación del certificado utilizada para confirmar la identidad del servidor de descarga. Déjelo sin marcar para actualizaciones de rutina. Si ve un error de certificado, solicite a su administrador que verifique la dirección del servidor y el certificado.

### Gestión de particiones y reversión

“Administración de particiones” muestra la partición en ejecución y otras particiones disponibles.

- “Marcar válido” confirma la versión en ejecución y deshabilita la protección de reversión automática para esa versión. Úselo después de confirmar que la versión actual funciona correctamente.
- “Revertir a esta versión” selecciona otra versión de arranque y cambia mediante un reinicio. La reversión interrumpe los servicios actuales. Primero confirme la versión de destino y la compatibilidad de datos.

Una vez completada la operación y el reinicio, vuelva a abrir la WebUI y verifique la versión actual y el estado del dispositivo.

La versión 0.6.2 cambia la forma de guardar la configuración de automatización. Antes de volver a un firmware anterior, pregunte a un usuario root o al proveedor si esa versión puede leerla. Prepare también una copia de seguridad y un método de recuperación.

Rollback cambia el firmware, no el formato de configuración. Es posible que las reglas existentes ya no funcionen después de una degradación.

## 9. Entrada de gestión de seguridad

Seleccione "Seguridad" en la navegación superior para abrir la administración de seguridad. Utilice la Guía de seguridad TianshanOS para claves SSH, hosts remotos, huellas digitales de host conocidos, certificados HTTPS, paquetes de configuración y administración de cuentas. Estos procedimientos no se repiten aquí.

### Operaciones fallidas o no confirmadas

Un formulario puede marcar un campo en rojo y mostrar el error a su lado. Corrija ese campo según las indicaciones y guarde. Que desaparezca la marca no confirma el guardado; compruebe también el mensaje y la lista.

Compruebe qué operación falló y lea el motivo y el siguiente paso. Si el mensaje no da un motivo, no lo suponga.

Si aparece «Detalles», selecciónelo para ver más información. «Ocultar» cierra los detalles. Si hay un botón ×, puede cerrar el mensaje con él. Cuando pida ayuda, conserve el mensaje y los detalles para que un usuario root los revise.

Si el resultado no está confirmado, actualice y compruebe el estado del dispositivo, archivo o tarea. Un tiempo de espera agotado o una desconexión no significa que la operación no se haya ejecutado. No repita de inmediato las operaciones de alimentación, eliminación, inicio de tareas o actualización. Pida ayuda a un usuario root si sigue sin poder confirmar el resultado.

Para acciones por lotes, verifique los elementos exitosos, fallidos y no confirmados por separado. Confirme los archivos descargados en la lista de descargas del navegador.
