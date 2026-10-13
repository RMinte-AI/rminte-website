# TianShanOS

Esta guía describe las características y la interfaz de TianShanOS 0.6.1. Puede seguir siendo útil para versiones posteriores en las que esas características no hayan cambiado. Un número de versión diferente no hace que la guía quede obsoleta automáticamente. Si la interfaz, los pasos o los mensajes de resultados difieren, consulte las notas de la versión de su versión instalada antes de continuar.

Utilice esta guía para cambiar las contraseñas del dispositivo, configurar el acceso al SSH, verificar las identidades del servidor y administrar certificados. Para la configuración inicial, comience con los capítulos 1, 2 y 3. Los procedimientos de certificado y Config Pack están destinados a los administradores responsables de esas funciones.

> Utilice una red de administración confiable. Actualmente, la interfaz web completa utiliza HTTP y la mayoría de las operaciones API carecen de inicio de sesión centralizado y aplicación de permisos. Mantenga el dispositivo en una red de administración controlada. La instalación de un certificado HTTPS no cambia la interfaz web completa a HTTPS.

## 1. Antes de comenzar

### 1.1 Encuentra la tarea que necesitas Tarea

| Tarea | Dónde ir |
|---|---|
| Cambiar la contraseña root o admin del dispositivo Seguridad de la cuenta | ; Capítulo 2 |
| Conéctese a un servidor usando una clave SSH | Gestión de claves y hosts con claves desplegadas; capítulo 3 |
| Copiar claves o verificar la identidad de un servidor Gestión de claves | Gestión de claves y huellas de hosts conocidos; capítulo 4 |
| Configurar certificados y autenticación mutua Certificado | HTTPS; Capítulo 5 Paquetes de configuración cifrados de |
| Exchange | Config Pack; Capítulo 6. La aplicación de configuración general aún está sin terminar |

### 1.2 Cuentas e identidad del dispositivo

- **admin** puede abrir Seguridad y ver claves, hosts, certificados y controles Config Pack, pero no Seguridad de cuenta.
- **root** también puede configurar las contraseñas de root y admin o restablecer admin a su contraseña predeterminada. Estas operaciones de administración de contraseñas verifican la autorización root.
- Un dispositivo **Developer** se identifica mediante la unidad organizativa (OU) en su certificado de dispositivo. Esta es una identidad de dispositivo. Actualmente, solo estos dispositivos pueden exportar paquetes de configuración y configuraciones de host SSH; iniciar sesión como root no lo cambia.

Un botón visible no establece que su API aplique permisos de acceso. Aparte de operaciones como la gestión de contraseñas que comprueban por sí mismas la autorización, actualmente el acceso debe limitarse a través de una red de gestión fiable.

### 1.3 Prepárese para la operación

1. Verifique que la dirección IP del navegador pertenezca al dispositivo deseado y que su computadora esté en una red de administración confiable.
2. Confirme la dirección, el puerto y el nombre de usuario de SSH con el administrador del servidor.
3. La implementación o revocación de una clave pública a través de la página requiere la contraseña de la cuenta remota y la autenticación de contraseña. El administrador del servidor decide si deja habilitada la autenticación de contraseña después.
4. Antes de revocar el acceso, eliminar claves o reemplazar certificados, asegúrese de que funcione otra conexión de administración: una consola del servidor, otra clave de administrador o la interfaz HTTP del dispositivo.

## 2. Cambiar contraseñas del dispositivo

Estos controles cambian las contraseñas de inicio de sesión de TianShanOS. No cambian la contraseña de SSH en un servidor remoto.

### 2.1 El mensaje después del primer inicio de sesión

Si una cuenta todavía está marcada con una contraseña sin cambios, aparece un mensaje de cambio de contraseña después de iniciar sesión. Establezca una contraseña larga y única. Si elige cambiarlo más tarde, se descarta el mensaje sin cambiar la contraseña.

El mensaje no es una pantalla de configuración de cuenta que pueda volver a abrir en cualquier momento. Si admin ya cambió su contraseña y necesita otro cambio, root puede configurarla desde Seguridad.

### 2.2 Establecer una contraseña como root

1. Inicie sesión como root y abra Seguridad en la barra de navegación.
2. Busque los controles de contraseña root o admin en Seguridad de la cuenta. Complete la nueva contraseña y su confirmación.
3. Seleccione Establecer contraseña root o Establecer contraseña admin. La interfaz acepta caracteres 4-64; cuatro caracteres es un mínimo técnico. Utilice una contraseña larga y única.

**Compruebe el resultado:** inicie sesión con la nueva contraseña en una ventana de navegación privada antes de cerrar sesión en la sesión original. Establecer una nueva contraseña no finaliza automáticamente las sesiones existentes.

**Si falla el inicio de sesión:** verifique primero la cuenta y la dirección del dispositivo. Cinco intentos fallidos consecutivos provocan un bloqueo de unos cinco minutos. Evite conjeturas repetidas.

### 2.3 Restablecer la contraseña de admin

Root puede seleccionar Restablecer admin a los valores predeterminados para restaurar la contraseña a `rm01` y borrar el bloqueo de inicio de sesión. Inicie sesión como admin en una nueva sesión y establezca una contraseña única inmediatamente después.

> Utilice la contraseña predeterminada solo para recuperar el acceso temporalmente. Cámbielo de inmediato y cierre sesión en cualquier sesión que ya no necesite.

## 3. Conéctese a un servidor con una clave SSH

Para la configuración inicial, cree una clave RSA, implemente su clave pública, revise el resultado y pruebe la conexión. Verifique la huella digital del servidor como parte de este proceso. Al retirar una clave, primero revoque el acceso a todos los servidores, confirme que la clave anterior ya no funciona y solo luego elimínela del dispositivo.

### 3.1 Crear una clave

1. En Administración de claves, seleccione Generar nueva clave.
2. Elija una ID de clave no utilizada, como `backup01`. Utilice una combinación corta de letras y números en inglés, no más de caracteres 10, sin comas. El límite real es 10 UTF-8 bytes; Los caracteres que no son ASCII pueden utilizar más de un byte cada uno.
3. Elija RSA 2048 o RSA 4096. RSA 2048 es el valor predeterminado. Se muestran las opciones de ECDSA, pero el flujo de trabajo actual de SSH no las admite; Elija RSA para SSH.
4. Agregue un comentario o alias si es útil. Active Exportable solo si necesita realizar una copia de seguridad o migrar la clave privada. No hay ningún control de página para cambiar esta opción más adelante.
5. Establezca Oculto si es necesario, luego seleccione Generar. Esta opción afecta la visualización de la lista; no mantiene en secreto el ID de la clave real.

**Compruebe el resultado:** una vez finalizado, la ventana se cierra y la lista se actualiza. Busque el ID deseado y el tipo de RSA, luego abra la clave pública. Compruebe que el texto completo comience por `ssh-rsa`.

**Mientras espera:** no vuelva a enviar la solicitud. Cerrar la ventana no cancela la generación en el dispositivo.

| Mensaje o situación | Qué hacer |
|---|---|
| El ID ya está en uso | Elija otra ID. El flujo de trabajo de clave nueva ahora rechaza las identificaciones existentes en lugar de sobrescribir sus claves. |
| Se ha alcanzado el límite de recuento de claves. | Se pueden guardar hasta ocho claves SSH. Antes de retirar una clave que ya no use, revoque su acceso siguiendo el procedimiento. |
| El almacenamiento o la memoria son insuficientes | Resuelva el problema de recursos del dispositivo antes de volver a intentarlo. No trates el fracaso como una creación exitosa. |
| Se generó la clave, pero la lista no se pudo actualizar | Actualice manualmente y verifique la clave; no lo vuelvas a generar La generación |
| La generación no está confirmada | Es posible que el dispositivo aún esté funcionando. Espere y verifique el registro; no vuelva a enviar la misma identificación La limpieza de |
| La limpieza no se completó | Verifique el almacenamiento del dispositivo, involucre a un administrador si es necesario y detenga la creación de claves adicionales |

Encontrar un registro con el mismo ID solo prueba que existe un registro. Si el resultado no está confirmado, verifique que sea la clave deseada antes de considerar la operación como completa.

### 3.2 Implementar la clave pública

El despliegue añade la clave pública a `~/.ssh/authorized_keys` de la cuenta remota. Esa cuenta podrá aceptar la clave privada correspondiente. La contraseña del servidor no cambia.

1. Seleccione Implementar en la fila de la clave deseada.
2. Ingrese la dirección del servidor, el nombre de usuario, el puerto SSH y la contraseña de inicio de sesión de SSH.
3. Revise la dirección y la cuenta, luego seleccione Iniciar implementación.
4. Lea el resultado y verifique el registro correspondiente en Hosts implementados.

> La nueva versión comprueba la huella del host antes de autenticar con contraseña y rechaza los cambios en hosts conocidos. Sin embargo, al desplegar una clave pública por primera vez, guarda y confía en la huella de un host desconocido sin pedirle que la compruebe. Realice el primer despliegue en una red controlada y contraste la huella completa por un canal de confianza.

### 3.3 Comprender el resultado de la implementación

| Lo que te dice el resultado | Qué hacer a continuación |
|---|---|
| Se implementó la clave, se registró el host y se verificó el inicio de sesión con clave pública | Verifique los detalles del host y luego pruebe la tarea real que necesita ejecutar |
| Se implementó la clave y se registró el host, pero el inicio de sesión no está confirmado | Seleccione Prueba. Si falla, verifique la autorización remota y la configuración de la cuenta a través de otra conexión de administración |
| La clave se implementó, pero el registro falló o no está confirmado | Verifique la lista local y la autorización remota antes de implementar nuevamente |
| Implementación completada, pero la lista no se pudo actualizar | Actualizar manualmente. Una actualización fallida de la lista no significa que la clave remota no se haya instalado |

**No implementar repetidamente porque el resultado está incompleto.** Cada implementación agrega la clave y puede crear entradas duplicadas. Utilice otra conexión de administración para inspeccionar `authorized_keys` cuando necesite confirmar el resultado remoto.

### 3.4 Pruebe la conexión

1. En Hosts implementados, verifique la dirección, el puerto, el nombre de usuario y la ID de clave, luego seleccione Probar.
2. Si aparece una confirmación de la huella digital del Host, obtenga y compare una huella digital confiable como se describe en la Sección 4.3 antes de elegir Confiar y conectar.
3. Después de conectarse, el dispositivo intenta el comando de eco fijo `echo "TianshanOS SSH Test OK"`.

**Qué significa éxito:** la página de prueba aún verifica si la solicitud se realizó correctamente, no el estado de salida o la salida del comando remoto. Úselo como verificación de conexión básica. Para una tarea importante, verifique la salida real, el estado de salida y los permisos. Esta prueba tampoco establece que sudo u otros comandos de la aplicación funcionarán.

**Si falla:** verifique la conectividad, el servicio SSH, la cuenta y la autorización remota de clave pública. Deje de volver a intentarlo si la huella digital cambia o la identidad del servidor es incierta.

### 3.5 Revocar el acceso antes de eliminar la clave local

1. Confirme que otra conexión de administración del servidor funcione y que la clave original permanezca en el dispositivo.
2. Seleccione Revocar en la fila del host, ingrese la contraseña del servidor y confirme Revocar y eliminar. También puede comenzar desde la fila de claves e ingresar los detalles del objetivo.
3. Lea el resultado, luego use una conexión confiable para verificar que la clave pública y cualquier duplicado desaparezcan de `authorized_keys`. Confirme que la clave anterior ya no funciona.
4. La revocación deja una copia de seguridad `authorized_keys.bak`. Gestiónela según la política de copias de seguridad del servidor para evitar restaurar una autorización antigua.
5. Compruebe que se haya eliminado el registro del host local. La página ahora verifica esta solicitud. Si la revocación remota tuvo éxito pero la eliminación local falló, actualice y realice la limpieza local por separado.
6. Solo después de que se haya manejado cada servidor de destino se debe eliminar la clave antigua y las copias de clave privada innecesarias.

**Si no se encuentra ninguna clave pública coincidente:** confirme que la cuenta sea correcta y que la clave no esté en el servidor antes de elegir eliminar solo el registro local.

**Si no se puede eliminar el host:** es posible que un servicio esté usando o protegiendo el registro. Verifique el estado del servicio y las referencias en Comandos SSH o las configuraciones de automatización relevantes. Termina de detener el servicio o de resolver sus referencias antes de volver a intentarlo. Pídale a un administrador que verifique un estado incierto.

**Si la revocación informa un error:** identifique qué paso falló. Es posible que la clave remota ya haya desaparecido aunque haya fallado la limpieza local. Utilice la autorización del servidor y una verificación de inicio de sesión real para establecer el resultado remoto. Conserve la clave local hasta que esto se resuelva.

## 4. Administrar claves, hosts y huellas digitales

### 4.1 Copiar una clave pública o exportar una clave privada

**Clave pública:** seleccione Clave pública y copie el valor completo de una sola línea para el administrador del servidor. Este es material público; enviarlo a la persona equivocada no expone la clave privada. El acceso se otorga cuando un administrador lo agrega a la lista de autorización de una cuenta.

**Clave privada:** la exportación está disponible solo si se habilitó Exportable durante la creación. Seleccione Clave privada en una computadora confiable y una red de administración aislada. Guárdelo en un almacén secreto aprobado, borre el portapapeles temporal y descargue copias. Nunca lo pegues en chats, tickets o registros.

**Si Copiar no hace nada:** los navegadores pueden restringir el acceso al portapapeles en una página HTTP. Seleccione y copie el texto manualmente, luego verifique sus marcadores de límites y su integridad. No debilite la configuración de seguridad del navegador para permitir la copia.

### 4.2 Revocar, eliminar y eliminar Acción

| Acción | Efecto |
|---|---|
| Revocar una clave pública | Intenta eliminar la autorización del servidor; requiere la contraseña remota |
| Eliminar un host | Elimina un registro de conexión local sin revocar el acceso al servidor |
| Eliminar una clave | Elimina el material de claves local sin contactar al servidor ni revocar el acceso. |
| Eliminar una huella digital del host | Elimina un registro de identidad del servidor guardado, no su registro de conexión o autorización remota Los hosts implementados de |

«Hosts con claves desplegadas» es una lista local; no muestra en directo las autorizaciones del servidor. Que esté vacía no confirma que se haya retirado el acceso. Que un host aparezca tampoco garantiza que pueda conectarse a él.

### 4.3 Verifique la huella digital del servidor SSH

Una huella digital identifica el servidor al que se está conectando. Esta página almacena un resumen SHA-256 como caracteres hexadecimales 64. Las herramientas OpenSSH suelen mostrar `SHA256:base64`. Solicite al administrador el mismo formato antes de comparar; las cadenas no se pueden comparar directamente.

**Después de la implementación inicial:** seleccione Ver en Huellas digitales de host conocidas y compare el valor total con uno obtenido de una consola de servidor, inventario de activos u otro canal confiable. La tabla muestra solo los primeros caracteres 32, lo que no es suficiente para una verificación completa.

**Cuando la prueba solicita confirmación:** el cuadro de diálogo muestra la huella digital completa actual. Verifíquelo de forma independiente antes de seleccionar Confiar y conectar. Si ha cambiado, verifique también la identidad del servidor, IP, puerto y registro de mantenimiento. No lo apruebe simplemente porque apareció el cuadro de diálogo.

**Si la huella digital difiere o su origen no está claro:** cancele la conexión e investigue. Si anteriormente utilizó una contraseña en una conexión que no es de confianza, trátela como potencialmente expuesta. Cámbielo a través de una conexión confiable, revise los registros de inicio de sesión y elimine la autorización no deseada. No envíe una contraseña a través de la conexión sospechosa para revocar el acceso.

**Después de una reconstrucción autorizada o un cambio de clave de host:** verifique primero la nueva huella digital completa y el registro de mantenimiento. Una vez verificado, acéptelo en el cuadro de diálogo de confirmación de prueba. Alternativamente, elimine la entrada anterior, pruebe nuevamente y confirme la huella digital verificada. La ruta de prueba ahora requiere confirmación explícita; No asuma que la reconexión confiará automáticamente en la nueva clave.

**Proteja la tarjeta SD:** las huellas digitales del host conocido se sincronizan con el texto sin formato JSON en la tarjeta. Al inicio, las configuraciones de huellas digitales SD disponibles reemplazan los registros locales correspondientes. Estos archivos no están firmados; no permita cambios que no sean de confianza en ellos.

### 4.4 Importar y exportar configuraciones de host SSH

Este flujo de trabajo dedicado `.tscfg` almacena la dirección, el puerto, el nombre de usuario, el tipo de autenticación y la ID de clave. No contiene contraseña SSH ni clave privada y no otorga acceso remoto. Está separada de la solicitud general inacabada del Capítulo 6.

**Para exportar:** en un dispositivo Developer, seleccione Exportar en la fila del host. Para otro dispositivo, proporcione y verifique su certificado, genere el paquete y seleccione Descargar. Compruebe que el archivo se haya guardado. Un dispositivo normal puede mostrar el control, pero se rechaza su solicitud de exportación.

**Para importar:**

1. Confirme que el paquete se creó para este dispositivo, que se puede escribir en la tarjeta SD y que la fuente se ha verificado a través de un canal confiable.
2. Asegúrese de que este dispositivo tenga la clave de referencia correcta. Una identificación coincidente por sí sola no es suficiente; el material clave debe coincidir con la autorización del servidor.
3. Seleccione Importar host, elija el archivo y revise la vista previa. Habilite la sobrescritura solo cuando desee reemplazar una configuración con el mismo nombre.
4. Confirme y reinicie según se le solicite. La importación primero guarda el paquete en la tarjeta SD; La carga y el descifrado se intentan al reiniciar.
5. Permita que finalice la carga de inicio, actualice la lista de hosts, verifique la dirección, la cuenta, el puerto y la clave, luego pruebe.

Que la vista previa se complete no confirma que el firmante sea de confianza ni que el paquete esté destinado a este dispositivo. La huella del destinatario se comprueba al cargarlo. Al iniciar, se combinan las configuraciones de host y se conservan los registros locales ajenos al paquete. Importar un paquete no borra toda la lista anterior.

Elimine un registro incorrecto y verifique que se haya borrado su configuración SD correspondiente. Un paquete restante se puede cargar nuevamente después del reinicio. Resolver referencias de servicios si el registro está en uso. Lea también la sección 5.6 antes de reemplazar el certificado del dispositivo.

## 5. Configurar los certificados HTTPS y mTLS

El servicio actual en el puerto 443 proporciona puntos finales de prueba de permisos, identidad y estado, no la interfaz web completa. El inicio predeterminado requiere una clave de dispositivo, un certificado de dispositivo, una cadena de CA de cliente y un reloj de dispositivo válido.

### 5.1 Sepa qué certificado hace qué

- El **certificado del dispositivo y la clave privada** permiten que el dispositivo demuestre su identidad a los clientes.
- Un **certificado de cliente y clave privada**, mantenidos por una computadora o servicio, permiten al cliente probar su identidad en el dispositivo.
- La **CA de verificación del cliente en el dispositivo** valida los certificados del cliente. No hace que una computadora o un navegador confíen automáticamente en el certificado del dispositivo.

Esta autenticación bidireccional se llama TLS mutua o mTLS. Los clientes aún deben confiar en la CA emisora ​​del certificado del dispositivo y verificar su nombre de acceso, usos permitidos y validez.

### 5.2 Lea el estado y configure la hora del dispositivo

Guardado, Dentro del período de validez y HTTPS: En ejecución describen el almacenamiento, la validez del tiempo y la operación del servicio por separado. Uno no establece los demás.

| Estado o situación | Qué hacer |
|---|---|
| Falta el certificado del dispositivo, la clave privada o la CA de verificación del cliente | Instale las credenciales que faltan utilizando las siguientes secciones |
| Esperando la hora del dispositivo | Verifique que el reloj de su computadora sea correcto, luego seleccione Establecer la hora del dispositivo desde esta computadora (fuente del navegador) |
| Aún no válido o caducado | Verifique el reloj del dispositivo y las fechas del certificado; concertar la renovación si ha caducado |
| Dentro del período de validez, pero HTTPS no se está ejecutando | Lea el error de inicio, falta de coincidencia de clave o credencial que se muestra; resolverlo y actualizar |
| El servicio en ejecución todavía usa credenciales anteriores | Guarde otros trabajos y reinicie el dispositivo. Confirme que las nuevas credenciales cumplan con los requisitos de inicio y estén en uso |
| El almacenamiento o el estado no están confirmados | Actualizar y comprobar. Reinicie si se le indica; evitar la instalación o eliminación repetida |

Después de configurar la hora, verifique la hora del dispositivo que se muestra y el estado de sincronización. Cuando el servicio no se está ejecutando, el sistema intenta iniciarse una vez que se cumplen los requisitos de tiempo y credenciales. Si permanece detenido, investigue el motivo que se muestra en lugar de tratar la instalación como prueba de que está lista.

### 5.3 Generar una clave de dispositivo y una solicitud de certificado

1. Seleccione Generar par de claves. Esto crea una clave privada ECDSA P-256 separada, no relacionada con las claves SSH. No se puede exportar a través de esta interfaz.
2. Si ya existe una clave, lea primero la sección 5.6. El procedimiento lo sobrescribe.
3. Seleccione Generar CSR. Ingrese el ID del dispositivo (CN), la organización y el departamento, o deje todos los campos en blanco. El departamento corresponde a la unidad organizativa (OU) del certificado.
4. Seleccione Generar solicitud de firma de certificado y envíe el texto CSR completo a su administrador de CA.

**Utilice una ID de dispositivo breve y estable.** Las letras y números en inglés son más fáciles de mantener dentro del límite UTF-8 de 63 bytes. Los caracteres que no son ASCII pueden utilizar varios bytes. Acorte los campos si la interfaz informa un error de longitud.

**Verifique los nombres antes de la emisión:** la ruta del campo personalizado no genera un SAN. Con todos los campos en blanco, CN se fija en `TIANSHAN-DEVICE-001`; la IP actual se agrega como IP SAN solo si está disponible. No se agrega ningún SAN DNS. Haga que el administrador de la CA utilice un proceso de emisión controlado para incluir los nombres reales de IP o DNS y los propósitos de autenticación requeridos en el certificado final. Este formulario no puede editar SAN.

Una CSR no contiene ninguna clave privada y no instala un certificado. Haga que el administrador de la CA inspeccione su clave pública, asunto y SAN antes de la emisión.

### 5.4 Instalar el certificado del dispositivo

1. Obtenga un certificado PEM que coincida con la clave privada del dispositivo actual.
2. Seleccione Instalar certificado, pegue el texto completo, incluidos sus marcadores de límites, y seleccione Instalar.
3. Verifique el resultado guardado, la validez del certificado y el estado real de HTTPS. Revise el tema, el emisor y las fechas.

La instalación comprueba el formato y el par de claves. El estado también informa de la vigencia y de lo necesario para iniciar el servicio. Los clientes deben verificar la cadena de confianza, el nombre usado para conectarse y los usos permitidos.

Si la clave no coincide, busque el certificado emitido para el CSR actual. No vuelva a generar una clave privada para eliminar el error. Si el resultado no está confirmado, actualice y verifique lo que se guardó antes de decidir si desea volver a intentarlo.

### 5.5 Instale la cadena de CA del cliente y pruebe

1. Seleccione Instalar CA, pegue uno o más certificados de CA PEM utilizados para confiar en sus clientes y seleccione Instalar.
2. Verifique el estado. Un servicio detenido intentará iniciarse cuando las credenciales y la hora estén listas. Si un servicio en ejecución informa cambios de credenciales, reinicie según las instrucciones para aplicarlas.
3. Acceda a los puntos finales de prueba adecuados utilizando un certificado de cliente confiable con el propósito y la función correctos.
4. Repita con un certificado que no sea de confianza o sin certificado y confirme el rechazo.

**Compruebe el resultado:** HTTPS se está ejecutando y utiliza el certificado previsto. Si se muestra el certificado activo SHA-256, compare su huella digital. Los clientes confiables deben acceder solo a los puntos finales que sus roles permitan; Los clientes que no son de confianza no deben conectarse. Verifique estos resultados en el dispositivo real.

### 5.6 Renovar certificados o eliminar todas las credenciales

**Caducidad del certificado:** reutilice una clave no comprometida para solicitar un nuevo certificado, instálelo, siga las instrucciones de estado para aplicarlo y vuelva a realizar la prueba. Los paquetes de configuración están vinculados a la huella digital del certificado del destinatario. Incluso con la misma clave, un paquete antiguo puede rechazarse después de la reinicialización o reinicio porque el certificado ha cambiado. Organice paquetes de reemplazo de antemano.

**Reemplazo de clave privada:** la CSR y el certificado antiguos ya no coinciden con la nueva clave. Esto no revoca el certificado antiguo en la CA. Maneje una clave expuesta con el administrador de CA por separado. Los paquetes que dependen de una clave perdida pueden ser irrecuperables.

**Eliminar todas las credenciales:** Eliminar credenciales elimina la clave del dispositivo, el certificado del dispositivo y la cadena de CA del cliente juntos. Verifique que el acceso de administración HTTP funcione y organice primero los paquetes de reemplazo. Una copia de seguridad de un certificado público no puede restaurar una clave privada.

Después de la eliminación, verifique que no haya certificado de dispositivo y que falten credenciales. Es posible que un servicio HTTPS en ejecución aún contenga las credenciales anteriores; La eliminación de los datos almacenados no constituye una revocación inmediata. Reinicie según las instrucciones y confirme que las credenciales antiguas ya no se utilizan. Restaure el servicio con una nueva clave, un certificado de dispositivo emitido, una cadena de CA del cliente y pruebas de conexión.

## 6. Comprender las limitaciones de Config Pack

A Config Pack es un paquete `.tscfg` cifrado y firmado. Actualmente se pueden crear e inspeccionar paquetes, pero la aplicación de configuración general no está terminada. No confíe en él para la configuración de la flota de producción, la recuperación ante desastres o las comprobaciones de aceptación de cambios en la configuración.

### 6.1 Qué hacen los controles

| Acción | Resultado actual Certificado de dispositivo de exportación |
|---|---|
| Exportar certificado del dispositivo | Proporciona el certificado público para que un remitente pueda crear un paquete para este dispositivo; no exporta su clave privada |
| Verificar solo | Comprueba la estructura y la firma del texto cifrado con el certificado incluido; no establece la confianza del firmante ni la identidad del destinatario |
| Importar después de seleccionar o pegar un paquete | Los parámetros de la página y los del dispositivo todavía no coinciden. Este procedimiento no puede completarse. |
| Importar desde la lista de paquetes | Valida un archivo de dispositivo existente sin copiarlo, descifrarlo ni aplicarlo |
| Aplicar | Descifra y enumera los nombres de los módulos sin escribir su configuración; todavía puede reportar éxito |
| Exportar Config Pack en un dispositivo Developer | Crea un paquete descargable e intenta guardarlo en la tarjeta SD. |

### 6.2 Verifique el origen y el destinatario Actualmente,

La verificación utiliza el certificado del firmante incluido en el paquete, pero no establece la confianza de su cadena de certificados. La firma cubre el texto cifrado; no dé por autenticados todos los campos mostrados. Una etiqueta «Official» no demuestra que el origen sea fiable.

Utilice un sistema de activos o un canal confiable independiente para confirmar la huella digital del firmante, el certificado del dispositivo de destino y el propósito del paquete. El nombre de destino de la vista previa no reemplaza la verificación de huellas digitales del certificado. Recibir un certificado y una huella digital en el mismo mensaje no es una verificación independiente.

### 6.3 Compartir el certificado del dispositivo e inspeccionar un paquete

**Para proporcionar el certificado de este dispositivo:** seleccione Exportar certificado de dispositivo y copie el PEM completo y la huella digital que se muestra. Envía el certificado público al remitente y confirma su huella digital a través de otro canal confiable.

**Para inspeccionar un paquete recibido:** abra Importar Config Pack, seleccione o pegue el archivo `.tscfg`, luego seleccione Verificar únicamente. Revise los detalles del firmante y confirme la fuente. La verificación no aplica la configuración ni prueba que este dispositivo sea el destinatario. Deténgase si la fuente, el objetivo o el propósito no están claros.

Incluso después de pasar la verificación, no se puede confiar en los controles generales actuales de Importar y Aplicar para configurar el dispositivo. Utilice los controles compatibles en las páginas de funciones relevantes y verifique la configuración resultante.

### 6.4 Exportar desde un dispositivo Developer

1. Prepare archivos de configuración JSON válidos en la tarjeta SD y obtenga un certificado de destino verificado.
2. Seleccione Exportar Config Pack, elija archivos, ingrese un nombre y una descripción y pegue el certificado del dispositivo del destinatario.
3. Genere el paquete, seleccione Descargar y verifique que el navegador haya guardado el archivo `.tscfg`.
4. Verifique la descarga y el archivo en `/sdcard/output_config/` por separado. El paquete puede permanecer disponible para su descarga incluso si falla la escritura en SD.

Exportar no modifica los ajustes de origen. Genere de nuevo un paquete si se creó para otro destinatario o si cambió el certificado del destinatario. Una exportación correcta no confirma que la aplicación general funcione en el dispositivo receptor.

## 7. Solución de problemas y respuesta a incidentes

### 7.1 Problemas comunes Síntoma de

| Falta la seguridad de la cuenta | Qué hacer |
|---|---|
| No aparece la sección de seguridad de la cuenta | Se muestra sólo a root |
| Se toma una ID de clave o es demasiado larga | Elija una identificación corta y no utilizada; ver Sección 3.1 |
| La generación de la clave no está confirmada | Espere e inspeccione el registro; no vuelva a enviar la misma identificación |
| El despliegue termina, pero falta un registro o falla la prueba | Verifique la autorización remota, el registro local e inicie sesión por separado; ver Sección 3.3 |
| Aparece una confirmación o cambio de huella digital | Verifique a través de un canal confiable antes de decidir confiar en él; ver Sección 4.3 |
| Queda un registro local después de la revocación | Verifique el resultado remoto, luego maneje la falla de eliminación local y las referencias de servicio |
| El acceso aún funciona después de eliminar un host | Eliminar afecta sólo al registro local; revocar la clave pública remota por separado |
| Se guarda un certificado, pero se detiene HTTPS | Verifique la hora del dispositivo, luego la credencial mostrada o el problema de inicio |
| El servicio en ejecución todavía usa el certificado anterior. | Reinicie según las instrucciones, luego verifique el certificado activo |
| Un cliente rechaza el certificado. | Verifique la confianza del cliente, el nombre de acceso, los usos permitidos y la validez. |
| La aplicación se realiza correctamente, pero la configuración no cambia La aplicación general | La aplicación general todavía no guarda los ajustes de los módulos. Configúrelos desde sus páginas de funciones. |

### 7.2 Sospecha de exposición de clave o contraseña

1. Restringir el acceso al dispositivo y al material afectado; mantener los registros necesarios para la investigación.
2. Para una clave privada SSH expuesta, revoque su clave pública en cada servidor afectado a través de conexiones confiables. Verifique las copias de seguridad y confirme que la clave anterior ya no funciona.
3. Cree e implemente una nueva clave RSA con una nueva ID. Verifíquelo, luego elimine la clave anterior y las copias exportadas.
4. Para una contraseña SSH expuesta, cámbiela a través de una conexión de administración confiable y revise los registros de inicio de sesión.
5. Para una clave HTTPS expuesta, reemplace las credenciales como se describe en la sección 5.6 y trabaje con el administrador de CA en la revocación y los paquetes antiguos.

Es posible que la lista de hosts locales no cubra todos los servidores que otorgaron acceso; También verifique los registros del servidor y de los activos. Antes de compartir registros, revíselos en busca de contraseñas, claves u otro contenido confidencial ingresado por los usuarios.

### 7.3 Límites operativos actuales Cuenta

Tenga en cuenta la gestión por HTTP, las limitaciones de autorización centralizada, la confianza automática en el primer despliegue y las limitaciones de Config Pack. «Oculto» no controla el acceso.

La configuración de compilación revisada no habilita el cifrado NVS, el cifrado Flash ni el arranque seguro. No asuma que esto protege las claves almacenadas o la integridad del inicio. La configuración del firmware actualizado y la configuración de seguridad del hardware requieren comprobaciones por separado. Solicite al propietario de la seguridad que disponga un aislamiento o una solución si el entorno previsto no puede tolerar estos límites.

## 8. Notas de versión y glosario

### 8.1 Alcance de esta edición

Esta guía se basa en el código y las interfaces en chino e inglés de TianShanOS 0.6.1, revisados el 9 de octubre de 2026. Puede seguir consultándola en versiones posteriores para las funciones que no hayan cambiado. Si los controles, pasos o mensajes difieren, revise las notas de su versión antes de continuar.

La revisión cubrió el código fuente y una interfaz simulada local. La simulación no se trató como una prueba de aceptación del hardware. Verifique el acceso a SSH, los protocolos de enlace TLS, los reinicios y la autorización remota en su propio entorno como se describe aquí.

### 8.2 Términos utilizados en esta guía

- **Clave pública/clave privada:** comparte la clave pública con el administrador que otorga acceso; mantener la clave privada en secreto. La autenticación utiliza el par coincidente.
- **Huella digital:** un resumen utilizado para comparar identidades de servidores o certificados. Convierta diferentes formatos de visualización antes de comparar.
- **CSR/CA:** una solicitud de firma de certificado y una autoridad de certificación o su certificado.
- **CN/O/OU:** nombre común, organización y unidad organizativa en un asunto de certificado. El departamento en forma corresponde a OU.
- **SAN / EKU:** los nombres de acceso o direcciones IP que cubre un certificado y sus propósitos de autenticación permitidos.
- **PEM:** un formato de texto con marcadores de INICIO/FIN para certificados, CSR y claves.
- **mTLS / PKI:** autenticación de certificados mutuos y el sistema de gestión de confianza y certificados.
- **NVS:** un área de almacenamiento Flash para configuraciones y claves del dispositivo; su nombre no implica cifrado.
