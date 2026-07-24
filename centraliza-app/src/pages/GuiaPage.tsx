import { Link } from 'react-router-dom';
import { GuideStep } from '../components/GuideStep';
import { useAuth } from '../contexts/AuthContext';

// Guía de uso para todos los usuarios.
export function GuiaPage() {
  const { isAdmin } = useAuth();

  return (
    <div className="page">
      <h1>Guía de uso</h1>
      <p className="guide-intro">
        Cómo cargar un pedido de compra y enviarlo a Finnegans, paso a paso.
      </p>

      {isAdmin && (
        <div className="card">
          <div className="note info" style={{ marginTop: 0 }}>
            Como tu cuenta es administradora, también tenés la{' '}
            <Link to="/guia-admin">Guía del administrador</Link>, con la gestión de usuarios y la
            lectura de logs.
          </div>
        </div>
      )}

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
    </div>
  );
}
