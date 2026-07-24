import { GuideStep } from '../components/GuideStep';

// Guía del panel de administración. Solo visible para cuentas con rol admin.
export function GuiaAdminPage() {
  return (
    <div className="page">
      <h1>Guía del administrador</h1>
      <p className="guide-intro">
        Cómo administrar las cuentas que cargan pedidos y revisar la actividad del sistema.
      </p>

      <div className="card">
        <div className="note info" style={{ marginTop: 0 }}>
          Esta guía cubre solo la pestaña <strong>Administración</strong>. Para el uso diario de la
          aplicación (cargar pedidos, revisar envíos) mirá la <strong>Guía de uso</strong>, que
          también tenés disponible.
        </div>
      </div>

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
              <strong>Contraseña</strong> — inicial; conviene que la persona la cambie luego (te la
              tiene que pedir a vos, no hay autogestión).
            </li>
            <li>
              <strong>Nombre completo</strong> — lo que se muestra en la aplicación.
            </li>
            <li>
              <strong>Rol</strong> — mirá la sección de roles más abajo.
            </li>
          </ul>
        </GuideStep>

        <GuideStep num={2} title="Configurar el circuito de compra">
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
            <strong>Este paso es obligatorio.</strong> Si falta alguno de los dos, cuando el usuario
            intente enviar un pedido le va a aparecer un mensaje pidiéndole que contacte al
            administrador.
          </div>
        </GuideStep>

        <GuideStep num={3} title="Verificar">
          <p>
            En la tabla de usuarios, las columnas <strong>Workflow compra</strong> y{' '}
            <strong>Tipo doc.</strong> tienen que mostrar valores. Si aparece un guion (—), la
            configuración está incompleta.
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
            Todo lo anterior, más el panel de administración: crear y editar cuentas, cambiar roles
            y contraseñas, activar y desactivar, y ver los logs de toda la organización.
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
            Usá <strong>Desactivar</strong>. La cuenta deja de poder ingresar de inmediato, pero se
            conserva junto con su historial en los logs. Es preferible a borrarla.
          </p>

          <h4>Cambiar el rol</h4>
          <p>
            Se hace desde <strong>Editar</strong>. El cambio tiene efecto la próxima vez que la
            persona inicie sesión.
          </p>

          <div className="note">
            Por seguridad, <strong>no podés desactivarte a vos mismo ni quitarte tu propio rol de
            administrador</strong>. Así se evita que la organización quede sin ningún administrador.
            Si necesitás ceder el puesto, pedile a otro administrador que haga el cambio.
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">Empresa habilitada</h3>
        <p className="muted">
          La aplicación opera contra una única empresa de Finnegans, definida a nivel del servidor.
          Por eso el panel no tiene selector de empresas: todos los usuarios trabajan con la misma y
          se les asigna automáticamente.
        </p>
        <div className="note">
          Habilitar otra empresa o cambiar la actual es una modificación de configuración del
          servidor, no algo que se haga desde este panel. Hay que pedírselo al equipo técnico.
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
          Los pedidos que quedaron <strong>PENDING</strong> por falta de conexión no aparecen acá,
          porque todavía no se intentaron enviar. Están guardados en el dispositivo de la persona,
          en su pestaña Envíos.
        </div>
      </div>
    </div>
  );
}
