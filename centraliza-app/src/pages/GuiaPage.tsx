import { GuideStep } from '../components/GuideStep';
import { useAuth } from '../contexts/AuthContext';

// Guía de uso para todos los usuarios. Si la cuenta es admin, en la misma
// página se agrega además la guía del panel de administración (antes era
// una pestaña aparte, "Guía Admin", para no sumar otra opción al header).
export function GuiaPage() {
  const { isAdmin } = useAuth();

  return (
    <div className="page">
      <h1>Guía de uso</h1>
      <p className="guide-intro">
        Cómo instalar la app en Android, cargar un pedido de compra y enviarlo a Finnegans.
      </p>

      <section className="card" aria-labelledby="instalacion-apk">
        <h2 className="section-title" id="instalacion-apk">Instalar en Android con APK</h2>
        <p className="muted">
          El APK es el archivo que instala Centraliza en tu celular Android. Antes de empezar,
          tené a mano el archivo o enlace que te compartió el administrador, conexión a internet
          y tu usuario y contraseña. En iPhone, usá la versión web: el APK es solo para Android.
        </p>

        <GuideStep num={1} title="Descargar el APK en el celular">
          <p>
            Abrí el archivo o enlace que te envió el administrador y descargá el archivo terminado
            en <strong>.apk</strong>. Esperá a que termine la descarga. Si todavía no lo recibiste,
            pedíselo al administrador.
          </p>
        </GuideStep>

        <GuideStep num={2} title="Abrir el archivo descargado">
          <p>
            Tocá la notificación de descarga o buscá el APK en <strong>Archivos → Descargas</strong>
            {' '}del celular. Según el equipo, la aplicación puede llamarse <strong>Mis archivos</strong>.
          </p>
        </GuideStep>

        <GuideStep num={3} title="Permitir la instalación si Android lo solicita">
          <p>
            Si aparece un aviso de que esa fuente no puede instalar aplicaciones, tocá
            {' '}<strong>Configuración</strong> o <strong>Ajustes</strong> y activá
            {' '}<strong>Permitir desde esta fuente</strong> para la aplicación desde la que abriste
            el APK, por ejemplo Chrome o Archivos. Después volvé al instalador; si se cerró,
            abrí el APK de nuevo.
          </p>
          <p>
            Los nombres de las opciones varían según el celular y la versión de Android. Si
            necesitás buscar el permiso, buscá <strong>Instalar aplicaciones desconocidas</strong>
            {' '}en Ajustes.
          </p>
        </GuideStep>

        <GuideStep num={4} title="Instalar y abrir Centraliza">
          <p>
            Tocá <strong>Instalar</strong> y esperá a que termine. Luego tocá <strong>Abrir</strong>
            {' '}o buscá <strong>Centraliza SPA App</strong> entre las aplicaciones del celular.
          </p>
          <p>
            Al terminar, podés volver al mismo ajuste y desactivar <strong>Permitir desde esta fuente</strong>.
            Centraliza seguirá instalada.
          </p>
        </GuideStep>

        <GuideStep num={5} title="Ingresar con tu cuenta">
          <p>
            Con internet, ingresá con el usuario y la contraseña que te dio el administrador.
            Si ya usás Centraliza en la web, son los mismos. Cuando veas la pantalla de
            {' '}<strong>Inicio</strong>, la instalación está lista.
          </p>
          <p>
            Si tu cuenta no tiene empresas habilitadas, pedile al administrador que la configure
            antes de cargar tu primer pedido.
          </p>
        </GuideStep>

        <details className="step-body">
          <summary><strong>Actualizar una versión instalada</strong></summary>
          <p>
            Abrí <strong>Envíos</strong> en la app instalada y resolvé los pedidos pendientes o con
            error antes de actualizar. Después descargá el nuevo APK que te envíe el administrador,
            abrilo y confirmá <strong>Actualizar</strong> o <strong>Instalar</strong>, según el aviso
            de Android.
          </p>
          <p>
            <strong>No desinstales la app ni borres sus datos para actualizar:</strong> podrías
            perder los pedidos guardados en ese dispositivo. Si Android rechaza la actualización,
            consultá al administrador con el mensaje que aparece.
          </p>
        </details>

        <details className="step-body">
          <summary><strong>Si no podés instalar el APK</strong></summary>
          <ul>
            <li>
              <strong>No encontrás el archivo:</strong> revisá Descargas en el navegador o en
              Archivos y verificá que la descarga haya terminado.
            </li>
            <li>
              <strong>“App no instalada” o archivo no válido:</strong> verificá que haya espacio
              disponible y descargá el APK de nuevo desde el enlace del administrador. Si sigue
              fallando, compartile el mensaje y el modelo del celular.
            </li>
            <li>
              <strong>Bloqueo de Play Protect, desarrollador no verificado o equipo administrado:</strong>
              {' '}consultá al administrador para que verifique el APK y cómo instalarlo en tu equipo.
            </li>
          </ul>
          <p>
            Más ayuda sobre el permiso de instalación en la{' '}
            <a href="https://support.google.com/pixelphone/answer/7391672?hl=es" target="_blank" rel="noopener noreferrer">
              guía oficial de Google
            </a>.
          </p>
        </details>
      </section>

      <div className="card">
        <h3 className="section-title">Cargar un pedido de compra</h3>

        <GuideStep num={1} title="Ingresar a la aplicación">
          <p>
            Escribí tu <strong>usuario</strong> y <strong>contraseña</strong>. La sesión queda
            abierta 7 días; pasado ese plazo la aplicación te va a pedir que ingreses de nuevo.
          </p>
          <p>
            Si no recordás tu contraseña o tu cuenta no ingresa, pedile a un administrador que te
            la restablezca.
          </p>
        </GuideStep>

        <GuideStep num={2} title="Completar los datos del pedido">
          <p>
            Entrá a <strong>Pedido de Compra</strong> desde el menú o desde el acceso en Inicio.
            Arriba completás:
          </p>
          <ul>
            <li>
              <strong>Empresa</strong> — para cuál vas a cargar el pedido. Solo vas a ver las
              empresas que un administrador habilitó para tu cuenta; si te habilitaron una sola, se
              selecciona automáticamente. La elección queda guardada para la próxima vez.
            </li>
            <li>
              <strong>Fecha</strong> — viene con la fecha de hoy; cambiala si el pedido corresponde
              a otro día.
            </li>
            <li>
              <strong>Descripción</strong> — opcional, para identificar el pedido en general.
            </li>
          </ul>
          <div className="note">
            Si en lugar del campo Empresa ves un mensaje diciendo que no tenés ninguna habilitada,
            no vas a poder enviar el pedido: pedile a un administrador que te habilite las que
            necesitás.
          </div>
        </GuideStep>

        <GuideStep num={3} title="Agregar los ítems">
          <p>Por cada producto que necesites pedir, completá:</p>
          <ul>
            <li>
              <strong>Producto</strong> — hacé clic en el campo y escribí parte del nombre para
              filtrar la lista. Elegí el producto del desplegable.
            </li>
            <li>
              <strong>Cantidad</strong> — cuánto vas a pedir.
            </li>
            <li>
              <strong>Descripción</strong> — opcional, un detalle propio de ese ítem.
            </li>
          </ul>
          <p>
            Para sumar más productos usá <strong>+ Agregar ítem</strong>. Si te equivocaste, cada
            ítem tiene un botón <strong>Quitar</strong> arriba a la derecha.
          </p>
          <div className="note info">
            La lista de productos se guarda por 24 horas para que cargue rápido. Si agregaron un
            producto nuevo en Finnegans y todavía no aparece, esperá a que se actualice o avisale a
            un administrador.
          </div>
        </GuideStep>

        <GuideStep num={4} title="Revisar y enviar">
          <p>
            Al tocar <strong>Enviar pedido</strong> se abre una ventana con el resumen exacto de lo
            que se va a enviar. Revisalo y confirmá. Si algo está mal, cancelá y corregí.
          </p>
        </GuideStep>
      </div>

      <div className="card">
        <h3 className="section-title">Seguimiento en Envíos</h3>
        <p className="muted">
          Todos los pedidos que cargás quedan registrados en la pestaña <strong>Envíos</strong>, con
          un estado que indica qué pasó con cada uno:
        </p>

        <div className="status-legend">
          <div className="status-legend-row">
            <span className="badge SENT">SENT</span>
            <span>
              <strong>Enviado.</strong> El pedido llegó a Finnegans correctamente. No hay nada más
              que hacer.
            </span>
          </div>
          <div className="status-legend-row">
            <span className="badge PENDING">PENDING</span>
            <span>
              <strong>Pendiente.</strong> No había conexión al momento de enviarlo. El pedido está
              guardado y se reenvía solo cuando vuelva internet. No hace falta cargarlo de nuevo.
            </span>
          </div>
          <div className="status-legend-row">
            <span className="badge ERROR">ERROR</span>
            <span>
              <strong>Rechazado.</strong> Finnegans no aceptó el pedido. Debajo del pedido vas a ver
              el motivo.
            </span>
          </div>
        </div>

        <div className="note" style={{ marginTop: '1rem' }}>
          <strong>Si un pedido quedó en ERROR:</strong> tocá <strong>Revisar y reenviar</strong>.
          Se abre el detalle con el mensaje de Finnegans y podés corregir los datos antes de
          intentarlo otra vez. No crees un pedido nuevo: podrías duplicarlo.
        </div>
        <div className="note info">
          Si ya no necesitás un pedido con error, tocá <strong>Eliminar del historial</strong> y
          confirmá. Se borra de este dispositivo y no podrás recuperarlo ni reenviarlo desde acá.
          El registro del servidor se conserva y no se modifica ningún pedido en Finnegans.
          Esta opción solo aparece para pedidos en estado <strong>ERROR</strong>.
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">Trabajar sin conexión</h3>
        <p className="muted">
          La aplicación funciona aunque te quedes sin internet. Los pedidos se guardan en el
          dispositivo con estado <strong>PENDING</strong> y se envían automáticamente cuando volvés
          a tener señal y abrís la aplicación.
        </p>
        <p className="muted">
          También podés forzar el reintento con el botón <strong>Reenviar pendientes</strong> en la
          pestaña Envíos.
        </p>
      </div>

      <div className="card">
        <h3 className="section-title">Problemas frecuentes</h3>
        <div className="step-body">
          <h4>No aparece ningún producto en la lista</h4>
          <p>
            Suele ser falta de conexión al cargar la pantalla. Verificá tu internet y volvé a entrar
            a Pedido de Compra.
          </p>

          <h4>Al enviar dice que falta el workflow o el tipo de documento</h4>
          <p>
            Tu usuario no tiene configurado el circuito de compra. Es una configuración que hace un
            administrador desde el panel; avisale para que la complete.
          </p>

          <h4>Me pide usuario y contraseña de nuevo</h4>
          <p>
            La sesión venció (dura 7 días) o un administrador desactivó la cuenta. Volvé a ingresar;
            si no te deja, consultá con un administrador.
          </p>

          <h4>Cargué un pedido y no lo veo en Finnegans</h4>
          <p>
            Fijate el estado en <strong>Envíos</strong>. Si dice PENDING todavía no salió; si dice
            ERROR fue rechazado y el motivo está en el detalle.
          </p>
        </div>
      </div>

      {isAdmin && (
        <>
          <h1 style={{ marginTop: '2.5rem' }}>Guía del administrador</h1>
          <p className="guide-intro">
            Cómo administrar las cuentas que cargan pedidos y revisar la actividad del sistema.
          </p>

          <div className="card">
            <h3 className="section-title">Dar de alta un usuario</h3>

            <GuideStep num={1} title="Crear la cuenta">
              <p>
                En <strong>Administración → Usuarios</strong>, tocá <strong>Nuevo usuario</strong> y
                completá:
              </p>
              <ul>
                <li>
                  <strong>Usuario</strong> — con el que va a ingresar. No se puede repetir ni cambiar
                  después.
                </li>
                <li>
                  <strong>Contraseña</strong> — inicial; conviene que la persona la cambie luego (te
                  la tiene que pedir a vos, no hay autogestión).
                </li>
                <li>
                  <strong>Nombre completo</strong> — lo que se muestra en la aplicación.
                </li>
                <li>
                  <strong>Rol</strong> — mirá la sección de roles más abajo.
                </li>
              </ul>
            </GuideStep>

            <GuideStep num={2} title="Habilitar las empresas">
              <p>
                Tocá <strong>Editar</strong> sobre la fila del usuario y, en{' '}
                <strong>Empresas habilitadas</strong>, tildá aquellas con las que va a trabajar. Usá
                el buscador para encontrarlas y los atajos <strong>Todas</strong> /{' '}
                <strong>Ninguna</strong> para seleccionar en bloque.
              </p>
              <div className="note">
                <strong>Sin ninguna empresa tildada, el usuario no puede cargar pedidos:</strong> en
                el formulario de Pedido de Compra, en lugar del campo Empresa le va a aparecer un
                aviso indicándole que contacte a un administrador. El contador arriba de la lista te
                muestra cuántas lleva habilitadas.
              </div>
            </GuideStep>

            <GuideStep num={3} title="Configurar el circuito de compra">
              <p>
                Recién creado, el usuario <strong>todavía no puede enviar pedidos</strong>. Tocá{' '}
                <strong>Editar</strong> sobre su fila y completá, en la sección Workflow de compra:
              </p>
              <ul>
                <li>
                  <strong>Workflow</strong> — el circuito de Finnegans por el que van a pasar sus
                  pedidos. Escribí para filtrar la lista.
                </li>
                <li>
                  <strong>Tipo de documento</strong> — el tipo de comprobante asociado.
                </li>
              </ul>
              <div className="note">
                <strong>Este paso es obligatorio.</strong> Si falta alguno de los dos, cuando el
                usuario intente enviar un pedido le va a aparecer un mensaje pidiéndole que contacte
                al administrador.
              </div>
            </GuideStep>

            <GuideStep num={4} title="Verificar">
              <p>
                En la tabla de usuarios, las columnas <strong>Workflow compra</strong> y{' '}
                <strong>Tipo doc.</strong> tienen que mostrar valores. Si aparece un guion (—), la
                configuración está incompleta.
              </p>
              <p>
                Las empresas habilitadas se ven abriendo <strong>Editar</strong>: el contador arriba
                de la lista indica cuántas tiene.
              </p>
            </GuideStep>
          </div>

          <div className="card">
            <h3 className="section-title">Roles</h3>
            <div className="step-body">
              <h4>Usuario</h4>
              <p>
                Puede ingresar, cargar pedidos de compra y ver sus envíos. No ve la pestaña
                Administración.
              </p>
              <h4>Administrador</h4>
              <p>
                Todo lo anterior, más el panel de administración: crear y editar cuentas, cambiar
                roles y contraseñas, activar y desactivar, y ver los logs de toda la organización.
              </p>
              <div className="note">
                Otorgá el rol de administrador solo a quien realmente lo necesite: puede cambiar la
                contraseña de cualquier cuenta, incluida la tuya.
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="section-title">Editar una cuenta existente</h3>
            <div className="step-body">
              <h4>Cambiar la contraseña</h4>
              <p>
                En <strong>Editar</strong>, escribí la nueva contraseña en el campo correspondiente.
                Dejalo vacío si no querés cambiarla: no se modifica si no escribís nada.
              </p>

              <h4>Dar de baja a alguien</h4>
              <p>
                Usá <strong>Desactivar</strong>. La cuenta deja de poder ingresar de inmediato, pero
                se conserva junto con su historial en los logs. Es preferible a borrarla.
              </p>

              <h4>Cambiar el rol</h4>
              <p>
                Se hace desde <strong>Editar</strong>. El cambio tiene efecto la próxima vez que la
                persona inicie sesión.
              </p>

              <div className="note">
                Por seguridad, <strong>no podés desactivarte a vos mismo ni quitarte tu propio rol
                de administrador</strong>. Así se evita que la organización quede sin ningún
                administrador. Si necesitás ceder el puesto, pedile a otro administrador que haga el
                cambio.
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="section-title">Revisar la actividad</h3>
            <p className="muted">
              La pestaña <strong>Logs</strong> muestra los últimos 200 intentos de envío de toda la
              organización, con fecha, usuario, empresa y resultado.
            </p>
            <ul className="step-body" style={{ paddingLeft: '1.1rem', color: 'var(--text-muted)' }}>
              <li>
                <strong>SUCCESS</strong> — el pedido entró en Finnegans.
              </li>
              <li>
                <strong>ERROR</strong> — fue rechazado; la columna Detalle trae el mensaje exacto que
                devolvió Finnegans.
              </li>
            </ul>
            <p className="muted">
              Es el primer lugar donde mirar cuando alguien reporta que un pedido no llegó: ahí vas a
              ver si se envió, si fue rechazado y por qué.
            </p>
            <div className="note info">
              Los pedidos que quedaron <strong>PENDING</strong> por falta de conexión no aparecen
              acá, porque todavía no se intentaron enviar. Están guardados en el dispositivo de la
              persona, en su pestaña Envíos.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
